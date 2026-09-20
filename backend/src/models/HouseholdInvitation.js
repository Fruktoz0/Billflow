const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HouseholdInvitation = sequelize.define('HouseholdInvitation', {
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
    },
    onDelete: 'CASCADE'
  },
  invitedByUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  role: {
    type: DataTypes.ENUM('OWNER', 'MEMBER'),
    defaultValue: 'MEMBER',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED'),
    defaultValue: 'PENDING',
    allowNull: false
  },
  token: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'household_invitations',
  timestamps: true,
  indexes: [
    { fields: ['householdId'] },
    { fields: ['email'] },
    { fields: ['token'], unique: true },
    { fields: ['status'] }
  ]
});

module.exports = HouseholdInvitation;
