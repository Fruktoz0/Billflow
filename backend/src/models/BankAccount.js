const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BankAccount = sequelize.define('BankAccount', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  type: {
    type: DataTypes.ENUM('BANK_ACCOUNT', 'REVOLUT', 'CREDIT_CARD', 'CASH', 'SAVINGS'),
    allowNull: false,
    defaultValue: 'BANK_ACCOUNT'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'HUF',
    validate: {
      len: [3, 3]
    }
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#5D9CEC',
    validate: {
      is: /^#[0-9A-Fa-f]{6}$/
    }
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'credit-card'
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'bank_accounts',
  timestamps: true
});

module.exports = BankAccount;
