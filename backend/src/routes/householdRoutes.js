const express = require('express');
const { z } = require('zod');
const {
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
} = require('../controllers/householdController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation schemas
const updateHouseholdSchema = z.object({
  name: z.string().trim().min(1, 'A háztartás neve kötelező').max(100, 'A név legfeljebb 100 karakter lehet').optional(),
  currency: z.string().trim().length(3, 'A pénznem pontosan 3 betűs kód kell legyen (pl. HUF)').optional()
});

const updateRoleSchema = z.object({
  role: z.enum(['OWNER', 'MEMBER'], {
    errorMap: () => ({ message: 'A megengedett szerepkörök: OWNER vagy MEMBER' })
  })
});

const createInvitationSchema = z.object({
  email: z.string().trim().email('Érvényes e-mail cím megadása kötelező'),
  role: z.enum(['OWNER', 'MEMBER']).optional().default('MEMBER')
});

const joinByCodeSchema = z.object({
  code: z.string().trim().min(4, 'Érvénytelen kódformátum')
});

// 1. Public endpoint - verify invitation token
router.get('/invitations/info/:token', getInvitationInfo);

// Authenticated routes below
router.use(authMiddleware);

// 2. Current household details & management
router.get('/current', getCurrentHousehold);
router.put('/current', requireRole('OWNER'), validate(updateHouseholdSchema), updateHousehold);
router.post('/current/regenerate-code', requireRole('OWNER'), regenerateInviteCode);

// 3. Members management
router.get('/current/members', getMembers);
router.patch('/current/members/:userId/role', requireRole('OWNER'), validate(updateRoleSchema), updateMemberRole);
router.delete('/current/members/:userId', removeMember);

// 4. Invitations management (outgoing)
router.get('/current/invitations', getInvitations);
router.post('/current/invitations', requireRole('OWNER'), validate(createInvitationSchema), createInvitation);
router.delete('/current/invitations/:id', requireRole('OWNER'), cancelInvitation);
router.post('/current/invitations/:id/resend', requireRole('OWNER'), resendInvitation);

// 5. Incoming invitations & code join
router.get('/my-invitations', getMyInvitations);
router.post('/join-by-code', validate(joinByCodeSchema), joinByCode);
router.post('/invitations/accept/:token', acceptInvitation);
router.post('/invitations/decline/:token', declineInvitation);

module.exports = router;
