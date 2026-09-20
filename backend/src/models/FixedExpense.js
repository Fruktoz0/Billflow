const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FixedExpense = sequelize.define('FixedExpense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  householdId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'households',
      key: 'id'
    }
  },
  defaultAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'bank_accounts',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 150]
    }
  },
  category: {
    type: DataTypes.ENUM('UTILITY', 'HOUSING', 'SUBSCRIPTION', 'LOAN', 'INSURANCE', 'OTHER'),
    allowNull: false,
    defaultValue: 'OTHER'
  },
  defaultAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  isVariableAmount: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  billingCycle: {
    type: DataTypes.ENUM('MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'YEARLY'),
    allowNull: false,
    defaultValue: 'MONTHLY'
  },
  dueDay: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: {
      min: 1,
      max: 31
    }
  },
  paymentMethod: {
    type: DataTypes.ENUM('DIRECT_DEBIT', 'CARD', 'BANK_TRANSFER', 'MANUAL'),
    allowNull: false,
    defaultValue: 'BANK_TRANSFER'
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  pausedUntil: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'fixed_expenses',
  timestamps: true
});

module.exports = FixedExpense;
