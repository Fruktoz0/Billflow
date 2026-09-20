const express = require('express');
const { z } = require('zod');
const {
  getFixedExpenses,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense
} = require('../controllers/expenseController');
const { authMiddleware } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Protect all fixed expense routes with authentication
router.use(authMiddleware);

const categories = ['UTILITY', 'HOUSING', 'SUBSCRIPTION', 'LOAN', 'INSURANCE', 'OTHER'];
const billingCycles = ['MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'YEARLY'];
const paymentMethods = ['DIRECT_DEBIT', 'CARD', 'BANK_TRANSFER', 'MANUAL'];

const createExpenseSchema = z.object({
  name: z.string().trim().min(1, 'Expense name is required').max(150, 'Name cannot exceed 150 characters'),
  category: z.enum(categories).default('OTHER'),
  defaultAmount: z.number().int('Amount must be an integer').min(0, 'Amount must be 0 or positive'),
  isVariableAmount: z.boolean().optional().default(false),
  billingCycle: z.enum(billingCycles).default('MONTHLY'),
  dueDay: z.number().int().min(1, 'Due day must be between 1 and 31').max(31, 'Due day must be between 1 and 31'),
  paymentMethod: z.enum(paymentMethods).default('BANK_TRANSFER'),
  defaultAccountId: z.string().uuid('Invalid account ID format').nullable().optional(),
  pausedUntil: z.string().nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional()
});

const updateExpenseSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  category: z.enum(categories).optional(),
  defaultAmount: z.number().int().min(0).optional(),
  isVariableAmount: z.boolean().optional(),
  billingCycle: z.enum(billingCycles).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
  defaultAccountId: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  active: z.boolean().optional(),
  pausedUntil: z.string().nullable().optional()
});

// Endpoints
router.get('/', getFixedExpenses);
router.post('/', validate(createExpenseSchema), createFixedExpense);
router.put('/:id', validate(updateExpenseSchema), updateFixedExpense);
router.delete('/:id', deleteFixedExpense);

module.exports = router;
