const sequelize = require('../config/database');
const Household = require('./Household');
const User = require('./User');
const BankAccount = require('./BankAccount');
const FixedExpense = require('./FixedExpense');
const ExpensePayment = require('./ExpensePayment');
const PushSubscription = require('./PushSubscription');
const HouseholdInvitation = require('./HouseholdInvitation');

// 1. Household <-> User (1:N)
Household.hasMany(User, {
  foreignKey: 'householdId',
  as: 'members'
});
User.belongsTo(Household, {
  foreignKey: 'householdId',
  as: 'household'
});

// 2. Household <-> BankAccount (1:N)
Household.hasMany(BankAccount, {
  foreignKey: 'householdId',
  as: 'bankAccounts'
});
BankAccount.belongsTo(Household, {
  foreignKey: 'householdId',
  as: 'household'
});

// 3. Household <-> FixedExpense (1:N)
Household.hasMany(FixedExpense, {
  foreignKey: 'householdId',
  as: 'fixedExpenses'
});
FixedExpense.belongsTo(Household, {
  foreignKey: 'householdId',
  as: 'household'
});

// 4. BankAccount <-> FixedExpense (1:N default account)
BankAccount.hasMany(FixedExpense, {
  foreignKey: 'defaultAccountId',
  as: 'defaultFixedExpenses'
});
FixedExpense.belongsTo(BankAccount, {
  foreignKey: 'defaultAccountId',
  as: 'defaultAccount'
});

// 5. Household <-> ExpensePayment (1:N)
Household.hasMany(ExpensePayment, {
  foreignKey: 'householdId',
  as: 'expensePayments'
});
ExpensePayment.belongsTo(Household, {
  foreignKey: 'householdId',
  as: 'household'
});

// 6. FixedExpense <-> ExpensePayment (1:N)
FixedExpense.hasMany(ExpensePayment, {
  foreignKey: 'fixedExpenseId',
  as: 'payments'
});
ExpensePayment.belongsTo(FixedExpense, {
  foreignKey: 'fixedExpenseId',
  as: 'fixedExpense'
});

// 7. BankAccount <-> ExpensePayment (1:N actual account)
BankAccount.hasMany(ExpensePayment, {
  foreignKey: 'accountId',
  as: 'payments'
});
ExpensePayment.belongsTo(BankAccount, {
  foreignKey: 'accountId',
  as: 'account'
});

// 8. User <-> ExpensePayment (1:N paid by)
User.hasMany(ExpensePayment, {
  foreignKey: 'paidByUserId',
  as: 'paidExpenses'
});
ExpensePayment.belongsTo(User, {
  foreignKey: 'paidByUserId',
  as: 'paidByUser'
});

// 9. User <-> PushSubscription (1:N)
User.hasMany(PushSubscription, {
  foreignKey: 'userId',
  as: 'pushSubscriptions'
});
PushSubscription.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// 10. Household <-> HouseholdInvitation (1:N)
Household.hasMany(HouseholdInvitation, {
  foreignKey: 'householdId',
  as: 'invitations'
});
HouseholdInvitation.belongsTo(Household, {
  foreignKey: 'householdId',
  as: 'household'
});

// 11. User <-> HouseholdInvitation (1:N sent invitations)
User.hasMany(HouseholdInvitation, {
  foreignKey: 'invitedByUserId',
  as: 'sentInvitations'
});
HouseholdInvitation.belongsTo(User, {
  foreignKey: 'invitedByUserId',
  as: 'invitedBy'
});

module.exports = {
  sequelize,
  Household,
  User,
  BankAccount,
  FixedExpense,
  ExpensePayment,
  PushSubscription,
  HouseholdInvitation
};
