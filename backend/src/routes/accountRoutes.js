const express = require('express');
const { z } = require('zod');
const {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount
} = require('../controllers/accountController');
const { authMiddleware } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Apply authentication to all account endpoints
router.use(authMiddleware);

const accountTypes = ['BANK_ACCOUNT', 'REVOLUT', 'CREDIT_CARD', 'CASH', 'SAVINGS'];

const createAccountSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required').max(100, 'Name cannot exceed 100 characters'),
  type: z.enum(accountTypes).default('BANK_ACCOUNT'),
  currency: z.string().trim().length(3, 'Currency must be a 3-letter code (e.g. HUF)').default('HUF'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid 6-character hex code (e.g. #5D9CEC)').default('#5D9CEC'),
  icon: z.string().trim().max(50).default('credit-card'),
  isDefault: z.boolean().optional().default(false)
});

const updateAccountSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  type: z.enum(accountTypes).optional(),
  currency: z.string().trim().length(3).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().trim().max(50).optional(),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional()
});

// Endpoints
router.get('/', getAccounts);
router.post('/', validate(createAccountSchema), createAccount);
router.put('/:id', validate(updateAccountSchema), updateAccount);
router.delete('/:id', deleteAccount);

module.exports = router;
