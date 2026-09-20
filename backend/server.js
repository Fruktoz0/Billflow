const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env or root .env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mysql = require('mysql2/promise');
const app = require('./src/app');
const {
  sequelize,
  Household,
  User,
  BankAccount,
  FixedExpense
} = require('./src/models');
const { startReminderCron } = require('./src/jobs/reminderWorker');

const PORT = process.env.PORT || 5000;
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = parseInt(process.env.DB_PORT, 10) || 3306;
const dbName = process.env.DB_NAME || 'billflow';
const dbUser = process.env.DB_USER || 'billflow_user';
const dbPassword = process.env.DB_PASSWORD || 'billflow_password';

/**
 * Ensure database exists on the target MySQL server with retry support
 */
async function ensureDatabaseExists(maxRetries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Server] Connecting to MySQL server at ${dbHost}:${dbPort} (attempt ${attempt}/${maxRetries})...`);
      const connection = await mysql.createConnection({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword
      });

      await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
      await connection.end();
      console.log(`[Server] Database "${dbName}" verified/created successfully.`);
      return;
    } catch (err) {
      console.warn(`[Server] Database check attempt ${attempt} failed:`, err.message);
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Seed initial default household, user, and standard bank accounts if database is empty
 */
async function seedDefaultDataIfEmpty() {
  try {
    const householdCount = await Household.count();
    if (householdCount > 0) {
      return;
    }

    console.log('[Server] Fresh database detected. Seeding initial household and default accounts...');

    // 1. Default Household
    const household = await Household.create({
      name: 'Budapesti Otthon',
      currency: 'HUF',
      inviteCode: 'BF-89X4K'
    });

    // 2. Default User (Családfő / Owner)
    await User.create({
      householdId: household.id,
      email: 'admin@billflow.local',
      displayName: 'Családfő',
      passwordHash: '$2a$10$wN1FvDqL4kK1g6x.g6x.u.defaultHashForDevUser',
      role: 'OWNER'
    });

    // 3. Default Bank Accounts
    const accRevolut = await BankAccount.create({
      id: 'acc-revolut',
      householdId: household.id,
      name: 'Revolut',
      type: 'REVOLUT',
      currency: 'HUF',
      color: '#0E8A9A',
      icon: 'credit-card',
      isDefault: false,
      active: true
    });

    const accUnicredit = await BankAccount.create({
      id: 'acc-unicredit',
      householdId: household.id,
      name: 'UniCredit Folyószámla',
      type: 'BANK_ACCOUNT',
      currency: 'HUF',
      color: '#5D9CEC',
      icon: 'credit-card',
      isDefault: true,
      active: true
    });

    // 4. Default Sample Recurring Expenses
    await FixedExpense.bulkCreate([
      {
        id: 'exp-eon',
        householdId: household.id,
        defaultAccountId: accUnicredit.id,
        name: 'Áramszámla (E.ON)',
        category: 'UTILITY',
        defaultAmount: 16030,
        isVariableAmount: true,
        billingCycle: 'MONTHLY',
        dueDay: 16,
        paymentMethod: 'DIRECT_DEBIT',
        active: true
      },
      {
        id: 'exp-telekom',
        householdId: household.id,
        defaultAccountId: accRevolut.id,
        name: 'Otthoni Internet & TV (Telekom)',
        category: 'UTILITY',
        defaultAmount: 11490,
        isVariableAmount: false,
        billingCycle: 'MONTHLY',
        dueDay: 20,
        paymentMethod: 'DIRECT_DEBIT',
        active: true
      },
      {
        id: 'exp-insur',
        householdId: household.id,
        defaultAccountId: accUnicredit.id,
        name: 'Lakásbiztosítás Generali',
        category: 'INSURANCE',
        defaultAmount: 14500,
        isVariableAmount: false,
        billingCycle: 'MONTHLY',
        dueDay: 24,
        paymentMethod: 'BANK_TRANSFER',
        active: true
      },
      {
        id: 'exp-kozos',
        householdId: household.id,
        defaultAccountId: accUnicredit.id,
        name: 'Közös költség & Felújítási alap',
        category: 'HOUSING',
        defaultAmount: 18500,
        isVariableAmount: false,
        billingCycle: 'MONTHLY',
        dueDay: 28,
        paymentMethod: 'BANK_TRANSFER',
        active: true
      }
    ]);

    console.log('[Server] Default seed data created successfully.');
  } catch (err) {
    console.error('[Server] Seeding failed (non-fatal):', err);
  }
}

async function startServer() {
  try {
    // 1. Ensure MySQL database exists
    await ensureDatabaseExists();

    // 2. Authenticate Sequelize connection
    console.log('[Server] Connecting Sequelize to database...');
    await sequelize.authenticate();
    console.log('[Server] Database connection authenticated successfully.');

    // 3. Auto-sync schema tables
    console.log('[Server] Synchronizing Sequelize models with MySQL...');
    await sequelize.sync({ alter: true });
    console.log('[Server] Database tables synchronized.');

    // 4. Seed initial default data if empty
    await seedDefaultDataIfEmpty();

    // 5. Start background scheduled workers
    startReminderCron();

    // 6. Start Express server
    app.listen(PORT, () => {
      console.log(`[Server] Billflow API running on http://localhost:${PORT}`);
      console.log(`[Server] Health Check available at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[Server] Unable to connect to the database or start server:', error);
    process.exit(1);
  }
}

startServer();
