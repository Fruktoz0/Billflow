const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExpensePayment = sequelize.define('ExpensePayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  fixedExpenseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'fixed_expenses',
      key: 'id'
    }
  },
  householdId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'households',
      key: 'id'
    }
  },
  accountId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'bank_accounts',
      key: 'id'
    }
  },
  periodYearMonth: {
    type: DataTypes.STRING(7),
    allowNull: false,
    validate: {
      is: /^\d{4}-(0[1-9]|1[0-2])$/
    }
  },
  plannedAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  actualAmount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'SKIPPED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paidByUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  note: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'expense_payments',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['fixedExpenseId', 'periodYearMonth'],
      name: 'unique_fixed_expense_period'
    },
    {
      fields: ['periodYearMonth'],
      name: 'idx_period_year_month'
    },
    {
      fields: ['householdId', 'periodYearMonth'],
      name: 'idx_household_period'
    }
  ]
});

module.exports = ExpensePayment;
