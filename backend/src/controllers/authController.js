const { sequelize, User, Household } = require('../models');
const { generateToken, cookieOptions } = require('../utils/token');
const { generateInviteCode } = require('../utils/inviteCode');

/**
 * Register a new user and either create a new household or join an existing one.
 */
const register = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { email, password, displayName, inviteCode } = req.body;

    // Check if email already registered
    const existingUser = await User.findOne({ where: { email }, transaction: t });
    if (existingUser) {
      await t.rollback();
      return res.status(409).json({ error: 'A user with this email address already exists' });
    }

    let targetHousehold;
    let userRole = 'MEMBER';

    if (inviteCode && inviteCode.trim().length > 0) {
      // Joining an existing household
      targetHousehold = await Household.findOne({
        where: { inviteCode: inviteCode.trim().toUpperCase() },
        transaction: t
      });

      if (!targetHousehold) {
        await t.rollback();
        return res.status(400).json({ error: 'Invalid household invite code' });
      }
    } else {
      // Creating a new household for the user
      userRole = 'OWNER';
      let uniqueCode = generateInviteCode();

      // Ensure uniqueness of invite code
      let collision = await Household.findOne({ where: { inviteCode: uniqueCode }, transaction: t });
      let attempts = 0;
      while (collision && attempts < 5) {
        uniqueCode = generateInviteCode();
        collision = await Household.findOne({ where: { inviteCode: uniqueCode }, transaction: t });
        attempts++;
      }

      targetHousehold = await Household.create(
        {
          name: `${displayName} háztartása`,
          currency: 'HUF',
          inviteCode: uniqueCode
        },
        { transaction: t }
      );
    }

    // Create user attached to household
    const user = await User.create(
      {
        email,
        password,
        displayName,
        householdId: targetHousehold.id,
        role: userRole
      },
      { transaction: t }
    );

    await t.commit();

    const token = generateToken(user);
    res.cookie('token', token, cookieOptions);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user,
      household: {
        id: targetHousehold.id,
        name: targetHousehold.name,
        currency: targetHousehold.currency,
        inviteCode: targetHousehold.inviteCode
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Log in with email and password.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Household,
          as: 'household',
          attributes: ['id', 'name', 'currency', 'inviteCode']
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.cookie('token', token, cookieOptions);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user,
      household: user.household
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently authenticated user details with household members.
 */
const getMe = async (req, res, next) => {
  try {
    const members = await User.findAll({
      where: { householdId: req.householdId },
      attributes: ['id', 'displayName', 'email', 'role', 'createdAt']
    });

    return res.status(200).json({
      user: req.user,
      household: req.user.household,
      members
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out and clear the session cookie.
 */
const logout = (req, res) => {
  res.clearCookie('token', cookieOptions);
  return res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
