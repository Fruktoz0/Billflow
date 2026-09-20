const express = require('express');
const { z } = require('zod');
const {
  payExpense,
  unpayExpense,
  skipExpense
} = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authMiddleware);

const yearMonthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

const paySchema = z.object({
  periodYearMonth: z.string().regex(yearMonthRegex, 'Invalid period format. Expected YYYY-MM (e.g. 2026-10)'),
  actualAmount: z.number().int().min(0).optional(),
  accountId: z.string().uuid('Invalid account ID format').optional(),
  paidAt: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional()),
  note: z.string().trim().max(255).optional()
});

const unpaySchema = z.object({
  periodYearMonth: z.string().regex(yearMonthRegex, 'Invalid period format. Expected YYYY-MM')
});

const skipSchema = z.object({
  periodYearMonth: z.string().regex(yearMonthRegex, 'Invalid period format. Expected YYYY-MM'),
  note: z.string().trim().max(255).optional()
});

// Endpoints for /api/expenses/:fixedExpenseId/...
router.post('/:fixedExpenseId/pay', validate(paySchema), payExpense);
router.post('/:fixedExpenseId/unpay', validate(unpaySchema), unpayExpense);
router.post('/:fixedExpenseId/skip', validate(skipSchema), skipExpense);

module.exports = router;
