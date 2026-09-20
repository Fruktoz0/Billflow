const { FixedExpense, ExpensePayment, BankAccount } = require('../models');

/**
 * Record payment for a fixed expense in a given month.
 * Supports overriding actualAmount and source accountId.
 */
const payExpense = async (req, res, next) => {
  try {
    const { fixedExpenseId } = req.params;
    const { periodYearMonth, actualAmount, accountId, paidAt, note } = req.body;

    // 1. Verify fixed expense exists and belongs to user's household
    const expense = await FixedExpense.findOne({
      where: { id: fixedExpenseId, householdId: req.householdId }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Fixed expense template not found' });
    }

    // 2. Determine target source account
    const targetAccountId = accountId || expense.defaultAccountId;
    if (!targetAccountId) {
      return res.status(400).json({
        error: 'Source bank account is required. Specify an accountId or assign a default account to the template.'
      });
    }

    // Verify target account belongs to household and is active
    const account = await BankAccount.findOne({
      where: { id: targetAccountId, householdId: req.householdId }
    });

    if (!account) {
      return res.status(400).json({ error: 'Selected bank account does not exist or does not belong to your household' });
    }

    // 3. Determine payment values
    const targetActualAmount = actualAmount !== undefined ? Math.round(actualAmount) : expense.defaultAmount;
    const paymentDate = paidAt ? new Date(paidAt) : new Date();

    // 4. Upsert payment row using unique key (fixedExpenseId, periodYearMonth)
    let payment = await ExpensePayment.findOne({
      where: {
        fixedExpenseId,
        periodYearMonth
      }
    });

    if (payment) {
      await payment.update({
        accountId: targetAccountId,
        actualAmount: targetActualAmount,
        status: 'PAID',
        paidAt: paymentDate,
        paidByUserId: req.user.id,
        note: note !== undefined ? note : payment.note
      });
    } else {
      payment = await ExpensePayment.create({
        fixedExpenseId,
        householdId: req.householdId,
        accountId: targetAccountId,
        periodYearMonth,
        plannedAmount: expense.defaultAmount,
        actualAmount: targetActualAmount,
        status: 'PAID',
        paidAt: paymentDate,
        paidByUserId: req.user.id,
        note: note || null
      });
    }

    const populated = await ExpensePayment.findByPk(payment.id, {
      include: [
        {
          model: BankAccount,
          as: 'account',
          attributes: ['id', 'name', 'type', 'currency', 'color', 'icon']
        }
      ]
    });

    return res.status(200).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * Revert a payment back to PENDING state for the given month.
 */
const unpayExpense = async (req, res, next) => {
  try {
    const { fixedExpenseId } = req.params;
    const { periodYearMonth } = req.body;

    const expense = await FixedExpense.findOne({
      where: { id: fixedExpenseId, householdId: req.householdId }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Fixed expense template not found' });
    }

    const payment = await ExpensePayment.findOne({
      where: {
        fixedExpenseId,
        periodYearMonth
      }
    });

    if (payment) {
      // Removing the payment row cleanly reverts the item to its virtual PENDING state
      await payment.destroy();
    }

    return res.status(200).json({
      message: 'Expense payment reverted to pending',
      fixedExpenseId,
      periodYearMonth,
      status: 'PENDING'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark an expense as SKIPPED for a specific month (e.g. seasonal pause).
 * Skipped items do not burden the monthly cash-flow calculation.
 */
const skipExpense = async (req, res, next) => {
  try {
    const { fixedExpenseId } = req.params;
    const { periodYearMonth, note } = req.body;

    const expense = await FixedExpense.findOne({
      where: { id: fixedExpenseId, householdId: req.householdId }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Fixed expense template not found' });
    }

    const targetAccountId = expense.defaultAccountId || (await BankAccount.findOne({
      where: { householdId: req.householdId, active: true }
    }))?.id;

    if (!targetAccountId) {
      return res.status(400).json({ error: 'At least one active bank account must exist in the household' });
    }

    let payment = await ExpensePayment.findOne({
      where: {
        fixedExpenseId,
        periodYearMonth
      }
    });

    if (payment) {
      await payment.update({
        status: 'SKIPPED',
        actualAmount: 0,
        paidAt: null,
        paidByUserId: req.user.id,
        note: note !== undefined ? note : payment.note
      });
    } else {
      payment = await ExpensePayment.create({
        fixedExpenseId,
        householdId: req.householdId,
        accountId: targetAccountId,
        periodYearMonth,
        plannedAmount: expense.defaultAmount,
        actualAmount: 0,
        status: 'SKIPPED',
        paidAt: null,
        paidByUserId: req.user.id,
        note: note || null
      });
    }

    return res.status(200).json({
      message: 'Expense marked as skipped for this period',
      payment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  payExpense,
  unpayExpense,
  skipExpense
};
