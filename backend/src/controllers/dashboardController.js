const { Op } = require('sequelize');
const { FixedExpense, ExpensePayment, BankAccount, User } = require('../models');

/**
 * Get monthly dashboard statistics, calendar items, and per-account cash-flow requirements.
 * Implements virtual state synthesis for unrecorded monthly expenses.
 */
const getMonthlyDashboard = async (req, res, next) => {
  try {
    const { yearMonth } = req.params;

    // Validate yearMonth format (YYYY-MM)
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) {
      return res.status(400).json({ error: 'Invalid period format. Expected YYYY-MM (e.g. 2026-10)' });
    }

    // Auto-resume expired paused expenses
    try {
      const today = new Date().toISOString().split('T')[0];
      await FixedExpense.update(
        { active: true, pausedUntil: null },
        {
          where: {
            householdId: req.householdId,
            active: false,
            pausedUntil: {
              [Op.ne]: null,
              [Op.lte]: today
            }
          }
        }
      );
    } catch (err) {
      console.warn('[DashboardController] Auto-resume paused expenses failed:', err.message);
    }

    // 1. Fetch active accounts for the household
    const accounts = await BankAccount.findAll({
      where: {
        householdId: req.householdId,
        active: true
      },
      order: [
        ['isDefault', 'DESC'],
        ['name', 'ASC']
      ]
    });

    // 2. Fetch active fixed expense templates with optional payment record for this month
    const fixedExpenses = await FixedExpense.findAll({
      where: {
        householdId: req.householdId,
        active: true
      },
      include: [
        {
          model: BankAccount,
          as: 'defaultAccount',
          attributes: ['id', 'name', 'type', 'currency', 'color', 'icon']
        },
        {
          model: ExpensePayment,
          as: 'payments',
          where: { periodYearMonth: yearMonth },
          required: false,
          include: [
            {
              model: BankAccount,
              as: 'account',
              attributes: ['id', 'name', 'type', 'currency', 'color', 'icon']
            },
            {
              model: User,
              as: 'paidByUser',
              attributes: ['id', 'displayName', 'email']
            }
          ]
        }
      ],
      order: [
        ['dueDay', 'ASC'],
        ['name', 'ASC']
      ]
    });

    // 3. Synthesize virtual vs. actual states
    const items = fixedExpenses.map((expense) => {
      const payment = expense.payments && expense.payments.length > 0 ? expense.payments[0] : null;

      if (payment) {
        return {
          id: payment.id,
          fixedExpenseId: expense.id,
          name: expense.name,
          category: expense.category,
          dueDay: expense.dueDay,
          billingCycle: expense.billingCycle,
          paymentMethod: expense.paymentMethod,
          isVariableAmount: expense.isVariableAmount,
          notes: expense.notes,
          status: payment.status, // 'PAID', 'PENDING', 'SKIPPED'
          plannedAmount: payment.plannedAmount,
          actualAmount: payment.actualAmount,
          paidAt: payment.paidAt,
          paidByUser: payment.paidByUser,
          paymentNote: payment.note,
          accountId: payment.accountId,
          account: payment.account || expense.defaultAccount,
          isVirtual: false
        };
      }

      // Virtual state (no payment record exists yet in this month)
      return {
        id: null,
        fixedExpenseId: expense.id,
        name: expense.name,
        category: expense.category,
        dueDay: expense.dueDay,
        billingCycle: expense.billingCycle,
        paymentMethod: expense.paymentMethod,
        isVariableAmount: expense.isVariableAmount,
        notes: expense.notes,
        status: 'PENDING',
        plannedAmount: expense.defaultAmount,
        actualAmount: null,
        paidAt: null,
        paidByUser: null,
        paymentNote: null,
        accountId: expense.defaultAccountId,
        account: expense.defaultAccount,
        isVirtual: true
      };
    });

    // 4. Calculate global summary
    let totalPlanned = 0;
    let totalPaid = 0;
    let totalRemainingPending = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      if (item.status === 'SKIPPED') {
        skippedCount++;
        continue;
      }

      totalPlanned += item.plannedAmount;

      if (item.status === 'PAID') {
        paidCount++;
        totalPaid += item.actualAmount !== null ? item.actualAmount : item.plannedAmount;
      } else if (item.status === 'PENDING') {
        pendingCount++;
        totalRemainingPending += item.plannedAmount;
      }
    }

    // 5. Calculate per-account breakdown
    const accountsBreakdown = accounts.map((acc) => {
      const assignedItems = items.filter((it) => it.accountId === acc.id && it.status !== 'SKIPPED');

      let paidAmount = 0;
      let pendingAmount = 0;
      let pendingItemsCount = 0;

      for (const it of assignedItems) {
        if (it.status === 'PAID') {
          paidAmount += it.actualAmount !== null ? it.actualAmount : it.plannedAmount;
        } else if (it.status === 'PENDING') {
          pendingAmount += it.plannedAmount;
          pendingItemsCount++;
        }
      }

      return {
        id: acc.id,
        name: acc.name,
        type: acc.type,
        currency: acc.currency,
        color: acc.color,
        icon: acc.icon,
        isDefault: acc.isDefault,
        paidAmount,
        pendingAmount,
        pendingItemsCount,
        totalAllocated: paidAmount + pendingAmount
      };
    });

    return res.status(200).json({
      periodYearMonth: yearMonth,
      summary: {
        totalPlanned,
        totalPaid,
        totalRemainingPending,
        totalItems: items.length,
        paidCount,
        pendingCount,
        skippedCount
      },
      accountsBreakdown,
      items
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMonthlyDashboard
};
