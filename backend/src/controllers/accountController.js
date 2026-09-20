const { sequelize, BankAccount } = require('../models');

/**
 * Get all active bank accounts for the current household.
 * Ordered by default account first, then alphabetically by name.
 */
const getAccounts = async (req, res, next) => {
  try {
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

    return res.status(200).json(accounts);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new bank account or card for the household.
 * If set as default, removes default flag from other accounts in the household.
 */
const createAccount = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { name, type, currency, color, icon, isDefault } = req.body;

    if (isDefault) {
      await BankAccount.update(
        { isDefault: false },
        {
          where: { householdId: req.householdId },
          transaction: t
        }
      );
    }

    const account = await BankAccount.create(
      {
        householdId: req.householdId,
        name,
        type: type || 'BANK_ACCOUNT',
        currency: currency || 'HUF',
        color: color || '#5D9CEC',
        icon: icon || 'credit-card',
        isDefault: Boolean(isDefault),
        active: true
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json(account);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Update an existing bank account.
 * Restricts access to accounts owned by the current household.
 */
const updateAccount = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { name, type, currency, color, icon, isDefault, active } = req.body;

    const account = await BankAccount.findOne({
      where: { id, householdId: req.householdId },
      transaction: t
    });

    if (!account) {
      await t.rollback();
      return res.status(404).json({ error: 'Bank account not found' });
    }

    if (isDefault && !account.isDefault) {
      await BankAccount.update(
        { isDefault: false },
        {
          where: { householdId: req.householdId },
          transaction: t
        }
      );
    }

    await account.update(
      {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(currency !== undefined && { currency }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(isDefault !== undefined && { isDefault: Boolean(isDefault) }),
        ...(active !== undefined && { active: Boolean(active) })
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(200).json(account);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Soft delete (deactivate) an account.
 * Preserves past payment records while hiding it from active pickers.
 */
const deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const account = await BankAccount.findOne({
      where: { id, householdId: req.householdId }
    });

    if (!account) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    await account.update({ active: false, isDefault: false });

    return res.status(200).json({ message: 'Bank account deactivated successfully', id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount
};
