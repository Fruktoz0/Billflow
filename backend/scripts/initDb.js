const dotenv = require('dotenv');
dotenv.config();

const {
  sequelize,
  Household,
  User,
  BankAccount,
  FixedExpense,
  ExpensePayment,
  PushSubscription,
  HouseholdInvitation
} = require('../src/models');

async function initDb() {
  try {
    console.log('[InitDB] Connecting to MySQL database...');
    await sequelize.authenticate();
    console.log('[InitDB] Connection established successfully.');

    console.log('[InitDB] Synchronizing Sequelize models with MySQL...');
    // Sync all defined models to the database
    await sequelize.sync({ alter: true });
    console.log('[InitDB] Synchronization complete. Tables verified:');
    console.log(' - households');
    console.log(' - users');
    console.log(' - bank_accounts');
    console.log(' - fixed_expenses');
    console.log(' - expense_payments');
    console.log(' - push_subscriptions');
    console.log(' - household_invitations');

    console.log('[InitDB] Database is ready for Phase 2 implementation.');
    process.exit(0);
  } catch (error) {
    console.error('[InitDB] Database initialization failed:', error);
    process.exit(1);
  }
}

initDb();
