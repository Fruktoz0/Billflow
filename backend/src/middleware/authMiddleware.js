const { verifyToken } = require('../utils/token');
const { User, Household } = require('../models');

/**
 * Authentication middleware that verifies JWT from Authorization header or cookie.
 * Populates req.user and req.householdId for downstream handlers.
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Fallback to HttpOnly cookie if no header
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      // In home server deployment without explicit JWT login, fallback to the default household owner
      const defaultUser = await User.findOne({
        include: [
          {
            model: Household,
            as: 'household',
            attributes: ['id', 'name', 'currency', 'inviteCode']
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      if (defaultUser) {
        req.user = defaultUser;
        req.householdId = defaultUser.householdId;
        return next();
      }

      return res.status(401).json({ error: 'Authentication token required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    // Load active user with household
    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: Household,
          as: 'household',
          attributes: ['id', 'name', 'currency', 'inviteCode']
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'User account not found' });
    }

    req.user = user;
    req.householdId = user.householdId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authorization middleware to restrict access to specific roles (e.g. OWNER).
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Access forbidden: requires ${role} role` });
    }
    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole
};
