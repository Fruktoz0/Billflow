const crypto = require('crypto');
const { sequelize, Household, User, HouseholdInvitation } = require('../models');
const { generateInviteCode } = require('../utils/inviteCode');

/**
 * Get current household overview with members count and user role.
 */
const getCurrentHousehold = async (req, res, next) => {
  try {
    const household = await Household.findByPk(req.householdId);
    if (!household) {
      return res.status(404).json({ error: 'Háztartás nem található' });
    }

    const memberCount = await User.count({
      where: { householdId: req.householdId }
    });

    const pendingInvitesCount = await HouseholdInvitation.count({
      where: {
        householdId: req.householdId,
        status: 'PENDING'
      }
    });

    return res.status(200).json({
      id: household.id,
      name: household.name,
      currency: household.currency,
      inviteCode: household.inviteCode,
      memberCount,
      pendingInvitesCount,
      myRole: req.user.role,
      createdAt: household.createdAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update household metadata (name, currency).
 * Requires OWNER role.
 */
const updateHousehold = async (req, res, next) => {
  try {
    const { name, currency } = req.body;
    const household = await Household.findByPk(req.householdId);

    if (!household) {
      return res.status(404).json({ error: 'Háztartás nem található' });
    }

    if (name) household.name = name.trim();
    if (currency) household.currency = currency.trim().toUpperCase();

    await household.save();

    return res.status(200).json({
      message: 'Háztartás adatai sikeresen módosítva',
      household
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Regenerate household invite code.
 * Requires OWNER role. Old invite code becomes invalid immediately.
 */
const regenerateInviteCode = async (req, res, next) => {
  try {
    const household = await Household.findByPk(req.householdId);
    if (!household) {
      return res.status(404).json({ error: 'Háztartás nem található' });
    }

    let uniqueCode = generateInviteCode();
    let collision = await Household.findOne({ where: { inviteCode: uniqueCode } });
    let attempts = 0;
    while (collision && attempts < 5) {
      uniqueCode = generateInviteCode();
      collision = await Household.findOne({ where: { inviteCode: uniqueCode } });
      attempts++;
    }

    household.inviteCode = uniqueCode;
    await household.save();

    return res.status(200).json({
      message: 'Új meghívókód sikeresen generálva',
      inviteCode: uniqueCode
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all members in the current household.
 */
const getMembers = async (req, res, next) => {
  try {
    const members = await User.findAll({
      where: { householdId: req.householdId },
      attributes: ['id', 'displayName', 'email', 'role', 'createdAt'],
      order: [
        ['role', 'ASC'], // 'OWNER' comes before 'MEMBER' alphabetically
        ['displayName', 'ASC']
      ]
    });

    return res.status(200).json(members);
  } catch (error) {
    next(error);
  }
};

/**
 * Update member role (OWNER <-> MEMBER).
 * Guard: Cannot demote the last OWNER of the household.
 * Requires OWNER role.
 */
const updateMemberRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['OWNER', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Érvénytelen szerepkör. Megengedett: OWNER, MEMBER' });
    }

    const member = await User.findOne({
      where: { id: userId, householdId: req.householdId }
    });

    if (!member) {
      return res.status(404).json({ error: 'A felhasználó nem található ebben a háztartásban' });
    }

    // Guard: Prevent demoting the only OWNER
    if (member.role === 'OWNER' && role === 'MEMBER') {
      const ownerCount = await User.count({
        where: { householdId: req.householdId, role: 'OWNER' }
      });
      if (ownerCount <= 1) {
        return res.status(400).json({
          error: 'Nem minősítheted vissza az egyetlen tulajdonost! Előbb jelölj ki egy másik tulajdonost.'
        });
      }
    }

    member.role = role;
    await member.save();

    return res.status(200).json({
      message: `A szerepkör sikeresen módosítva: ${role === 'OWNER' ? 'Tulajdonos' : 'Tag'}`,
      member: {
        id: member.id,
        displayName: member.displayName,
        email: member.email,
        role: member.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a member from the household, or self-leave.
 * If removed/leaving, the user is automatically transitioned into a fresh personal household
 * so their account is preserved and functioning.
 */
const removeMember = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { userId } = req.params;
    const isSelf = req.user.id === userId;

    // Only OWNER can remove others; any member can remove themselves
    if (!isSelf && req.user.role !== 'OWNER') {
      await t.rollback();
      return res.status(403).json({ error: 'Csak a háztartás tulajdonosa távolíthat el tagokat' });
    }

    const targetUser = await User.findOne({
      where: { id: userId, householdId: req.householdId },
      transaction: t
    });

    if (!targetUser) {
      await t.rollback();
      return res.status(404).json({ error: 'A tag nem található a háztartásban' });
    }

    // Guard: If self-leaving as OWNER, make sure another OWNER exists
    if (isSelf && targetUser.role === 'OWNER') {
      const remainingMembers = await User.count({
        where: { householdId: req.householdId },
        transaction: t
      });

      if (remainingMembers > 1) {
        const otherOwners = await User.count({
          where: {
            householdId: req.householdId,
            role: 'OWNER',
            id: { [sequelize.Sequelize.Op.ne]: userId }
          },
          transaction: t
        });

        if (otherOwners === 0) {
          await t.rollback();
          return res.status(400).json({
            error: 'Egyetlen tulajdonosként nem léphetsz ki a háztartásból! Előbb jelölj ki egy másik tulajdonost.'
          });
        }
      }
    }

    // Create a new fresh personal household for the departing user
    let newCode = generateInviteCode();
    const newHousehold = await Household.create(
      {
        name: `${targetUser.displayName} háztartása`,
        currency: 'HUF',
        inviteCode: newCode
      },
      { transaction: t }
    );

    targetUser.householdId = newHousehold.id;
    targetUser.role = 'OWNER';
    await targetUser.save({ transaction: t });

    await t.commit();

    return res.status(200).json({
      message: isSelf
        ? 'Sikeresen kiléptél a háztartásból. Új személyes háztartást hoztunk létre számodra.'
        : `${targetUser.displayName} sikeresen el lett távolítva a háztartásból.`,
      userId: targetUser.id,
      newHouseholdId: newHousehold.id
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * List outgoing pending invitations for this household.
 */
const getInvitations = async (req, res, next) => {
  try {
    const invitations = await HouseholdInvitation.findAll({
      where: { householdId: req.householdId },
      include: [
        {
          model: User,
          as: 'invitedBy',
          attributes: ['id', 'displayName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const enriched = invitations.map((inv) => {
      const plain = inv.toJSON();
      const isExpired = new Date(inv.expiresAt) < new Date();
      return {
        ...plain,
        isExpired,
        inviteLink: `${clientUrl}/join?token=${inv.token}`
      };
    });

    return res.status(200).json(enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * Send / create a new invitation by email.
 * Requires OWNER role.
 */
const createInvitation = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const targetRole = role === 'OWNER' ? 'OWNER' : 'MEMBER';

    // 1. Check if user is already a member in this household
    const existingMember = await User.findOne({
      where: {
        email: normalizedEmail,
        householdId: req.householdId
      }
    });

    if (existingMember) {
      return res.status(400).json({
        error: 'Ez a felhasználó már a jelenlegi háztartás tagja.'
      });
    }

    // 2. Check if a pending invite already exists for this email in this household
    let invitation = await HouseholdInvitation.findOne({
      where: {
        householdId: req.householdId,
        email: normalizedEmail,
        status: 'PENDING'
      }
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days validity
    const token = crypto.randomBytes(32).toString('hex');

    if (invitation) {
      // Refresh existing invite
      invitation.token = token;
      invitation.role = targetRole;
      invitation.expiresAt = expiresAt;
      invitation.invitedByUserId = req.user.id;
      await invitation.save();
    } else {
      // Create new invite record
      invitation = await HouseholdInvitation.create({
        householdId: req.householdId,
        invitedByUserId: req.user.id,
        email: normalizedEmail,
        role: targetRole,
        status: 'PENDING',
        token,
        expiresAt
      });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteLink = `${clientUrl}/join?token=${token}`;

    return res.status(201).json({
      message: 'Meghívó sikeresen létrehozva',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        token: invitation.token
      },
      inviteLink
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel / revoke an outgoing invitation.
 * Requires OWNER role.
 */
const cancelInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invitation = await HouseholdInvitation.findOne({
      where: { id, householdId: req.householdId }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'A meghívó nem található' });
    }

    invitation.status = 'CANCELLED';
    await invitation.save();

    return res.status(200).json({
      message: 'A meghívó sikeresen vissza lett vonva',
      id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend / renew an outgoing invitation (+7 days extension).
 * Requires OWNER role.
 */
const resendInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invitation = await HouseholdInvitation.findOne({
      where: { id, householdId: req.householdId }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'A meghívó nem található' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    invitation.token = token;
    invitation.status = 'PENDING';
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invitation.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteLink = `${clientUrl}/join?token=${token}`;

    return res.status(200).json({
      message: 'Meghívó sikeresen megújítva (+7 nap)',
      invitation,
      inviteLink
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get incoming invitations sent to the currently logged-in user's email.
 */
const getMyInvitations = async (req, res, next) => {
  try {
    const userEmail = req.user.email.toLowerCase();

    const invitations = await HouseholdInvitation.findAll({
      where: {
        email: userEmail,
        status: 'PENDING'
      },
      include: [
        {
          model: Household,
          as: 'household',
          attributes: ['id', 'name', 'currency']
        },
        {
          model: User,
          as: 'invitedBy',
          attributes: ['id', 'displayName', 'email']
        }
      ]
    });

    const activeInvitations = invitations.filter(
      (inv) => new Date(inv.expiresAt) > new Date()
    );

    return res.status(200).json(activeInvitations);
  } catch (error) {
    next(error);
  }
};

/**
 * Join a household using an invite code (BF-XXXXXX).
 * Authenticated user action.
 */
const joinByCode = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { code } = req.body;
    if (!code) {
      await t.rollback();
      return res.status(400).json({ error: 'Meghívókód megadása kötelező' });
    }

    const cleanCode = code.trim().toUpperCase();
    const targetHousehold = await Household.findOne({
      where: { inviteCode: cleanCode },
      transaction: t
    });

    if (!targetHousehold) {
      await t.rollback();
      return res.status(404).json({ error: 'Nem található háztartás ezzel a meghívókóddal' });
    }

    if (targetHousehold.id === req.householdId) {
      await t.rollback();
      return res.status(400).json({ error: 'Már ennek a háztartásnak vagy a tagja!' });
    }

    const user = await User.findByPk(req.user.id, { transaction: t });
    user.householdId = targetHousehold.id;
    user.role = 'MEMBER';
    await user.save({ transaction: t });

    await t.commit();

    return res.status(200).json({
      message: `Sikeresen csatlakoztál a(z) ${targetHousehold.name} háztartáshoz!`,
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
 * Public endpoint to verify invitation token and inspect metadata.
 */
const getInvitationInfo = async (req, res, next) => {
  try {
    const { token } = req.params;
    const invitation = await HouseholdInvitation.findOne({
      where: { token },
      include: [
        {
          model: Household,
          as: 'household',
          attributes: ['id', 'name', 'currency']
        },
        {
          model: User,
          as: 'invitedBy',
          attributes: ['id', 'displayName', 'email']
        }
      ]
    });

    if (!invitation) {
      return res.status(404).json({ error: 'A meghívó nem található vagy érvénytelen' });
    }

    const isExpired = new Date(invitation.expiresAt) < new Date();
    const isValid = !isExpired && invitation.status === 'PENDING';

    return res.status(200).json({
      isValid,
      isExpired,
      status: invitation.status,
      householdName: invitation.household ? invitation.household.name : 'Háztartás',
      currency: invitation.household ? invitation.household.currency : 'HUF',
      inviterName: invitation.invitedBy ? invitation.invitedBy.displayName : 'Családtag',
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept invitation via token.
 * Authenticated user action.
 */
const acceptInvitation = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { token } = req.params;
    const invitation = await HouseholdInvitation.findOne({
      where: { token },
      include: [{ model: Household, as: 'household' }],
      transaction: t
    });

    if (!invitation || invitation.status !== 'PENDING') {
      await t.rollback();
      return res.status(400).json({ error: 'A meghívó nem található vagy már fel lett használva' });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'EXPIRED';
      await invitation.save({ transaction: t });
      await t.commit();
      return res.status(400).json({ error: 'A meghívó lejárati ideje lejárt' });
    }

    const user = await User.findByPk(req.user.id, { transaction: t });
    user.householdId = invitation.householdId;
    user.role = invitation.role;
    await user.save({ transaction: t });

    invitation.status = 'ACCEPTED';
    await invitation.save({ transaction: t });

    await t.commit();

    return res.status(200).json({
      message: `Sikeresen csatlakoztál a(z) ${invitation.household.name} háztartáshoz!`,
      household: invitation.household
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Decline invitation via token.
 * Authenticated user action.
 */
const declineInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const invitation = await HouseholdInvitation.findOne({
      where: { token }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'A meghívó nem található' });
    }

    invitation.status = 'DECLINED';
    await invitation.save();

    return res.status(200).json({ message: 'Meghívó sikeresen elutasítva' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentHousehold,
  updateHousehold,
  regenerateInviteCode,
  getMembers,
  updateMemberRole,
  removeMember,
  getInvitations,
  createInvitation,
  cancelInvitation,
  resendInvitation,
  getMyInvitations,
  joinByCode,
  getInvitationInfo,
  acceptInvitation,
  declineInvitation
};
