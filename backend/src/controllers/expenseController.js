const { Op } = require('sequelize');
const { FixedExpense, BankAccount } = require('../models');

/**
 * Automatically resumes any expenses whose pausedUntil date has passed.
 */
const autoResumeExpiredExpenses = async (householdId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await FixedExpense.update(
      { active: true, pausedUntil: null },
      {
        where: {
          householdId,
          active: false,
          pausedUntil: {
            [Op.ne]: null,
            [Op.lte]: today
          }
        }
      }
    );
  } catch (err) {
    console.warn('[ExpenseController] autoResumeExpiredExpenses failed:', err.message);
  }
};

/**
 * Get all active recurring expense templates for the current household.
 * Ordered chronologically by due day (1-31).
 */
const getFixedExpenses = async (req, res, next) => {
  try {
    await autoResumeExpiredExpenses(req.householdId);

    const whereClause = { householdId: req.householdId };
    if (req.query.includeInactive !== 'true') {
      whereClause.active = true;
    }

    const expenses = await FixedExpense.findAll({
      where: whereClause,
      include: [
        {
          model: BankAccount,
          as: 'defaultAccount',
          attributes: ['id', 'name', 'type', 'currency', 'color', 'icon']
        }
      ],
      order: [
        ['dueDay', 'ASC'],
        ['name', 'ASC']
      ]
    });

    return res.status(200).json(expenses);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new recurring expense template.
 * Validates defaultAccountId if specified to ensure it belongs to the household.
 */
const createFixedExpense = async (req, res, next) => {
  try {
    const {
      name,
      category,
      defaultAmount,
      isVariableAmount,
      billingCycle,
      dueDay,
      paymentMethod,
      defaultAccountId,
      notes
    } = req.body;

    if (defaultAccountId) {
      const account = await BankAccount.findOne({
        where: { id: defaultAccountId, householdId: req.householdId, active: true }
      });
      if (!account) {
        return res.status(400).json({ error: 'Default bank account does not exist or is inactive' });
      }
    }

    const expense = await FixedExpense.create({
      householdId: req.householdId,
      name,
      category: category || 'OTHER',
      defaultAmount: Math.round(defaultAmount),
      isVariableAmount: Boolean(isVariableAmount),
      billingCycle: billingCycle || 'MONTHLY',
      dueDay: parseInt(dueDay, 10),
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      defaultAccountId: defaultAccountId || null,
      notes: notes || null,
      active: req.body.active !== undefined ? Boolean(req.body.active) : true,
      pausedUntil: req.body.pausedUntil || null
    });

    const populated = await FixedExpense.findByPk(expense.id, {
      include: [
        {
          model: BankAccount,
          as: 'defaultAccount',
          attributes: ['id', 'name', 'type', 'currency', 'color', 'icon']
        }
      ]
    });

    return res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing recurring expense template.
 */
const updateFixedExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      defaultAmount,
      isVariableAmount,
      billingCycle,
      dueDay,
      paymentMethod,
      defaultAccountId,
      notes,
      active,
      pausedUntil
    } = req.body;

    const expense = await FixedExpense.findOne({
      where: { id, householdId: req.householdId }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Fixed expense not found' });
    }

    if (defaultAccountId !== undefined && defaultAccountId !== null) {
      const account = await BankAccount.findOne({
        where: { id: defaultAccountId, householdId: req.householdId, active: true }
      });
      if (!account) {
        return res.status(400).json({ error: 'Default bank account does not exist or is inactive' });
      }
    }

    // If setting active to true, clear pausedUntil automatically
    const isActivating = active === true;

    await expense.update({
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(defaultAmount !== undefined && { defaultAmount: Math.round(defaultAmount) }),
      ...(isVariableAmount !== undefined && { isVariableAmount: Boolean(isVariableAmount) }),
      ...(billingCycle !== undefined && { billingCycle }),
      ...(dueDay !== undefined && { dueDay: parseInt(dueDay, 10) }),
      ...(paymentMethod !== undefined && { paymentMethod }),
      ...(defaultAccountId !== undefined && { defaultAccountId: defaultAccountId || null }),
      ...(notes !== undefined && { notes }),
      ...(active !== undefined && { active: Boolean(active) }),
      ...(isActivating ? { pausedUntil: null } : (pausedUntil !== undefined && { pausedUntil: pausedUntil || null }))
    });

    const updated = await FixedExpense.findByPk(expense.id, {
      include: [
        {
          model: BankAccount,
          as: 'defaultAccount',
          attributes: ['id', 'name', 'type', 'currency', 'color', 'icon']
        }
      ]
    });

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete (deactivate) an expense template.
 */
const deleteFixedExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    const expense = await FixedExpense.findOne({
      where: { id, householdId: req.householdId }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Fixed expense not found' });
    }

    await expense.update({ active: false });

    return res.status(200).json({ message: 'Fixed expense deactivated successfully', id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFixedExpenses,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense
};
