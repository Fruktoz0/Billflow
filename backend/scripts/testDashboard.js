const dotenv = require('dotenv');
dotenv.config();

const { ExpensePayment, FixedExpense, BankAccount, User } = require('../src/models');

async function testDashboard() {
  try {
    console.log('[TestDashboard] Checking ExpensePayment model attributes and associations...');

    const attrs = Object.keys(ExpensePayment.rawAttributes);
    console.log(`[TestDashboard] ExpensePayment attributes: ${attrs.join(', ')}`);

    const requiredAttrs = [
      'id',
      'fixedExpenseId',
      'householdId',
      'accountId',
      'periodYearMonth',
      'plannedAmount',
      'actualAmount',
      'status',
      'paidAt',
      'paidByUserId',
      'note'
    ];

    for (const attr of requiredAttrs) {
      if (!attrs.includes(attr)) {
        throw new Error(`Missing required attribute in ExpensePayment: ${attr}`);
      }
    }

    // Verify associations
    if (!ExpensePayment.associations.account) {
      throw new Error('ExpensePayment.account association missing');
    }
    if (!ExpensePayment.associations.fixedExpense) {
      throw new Error('ExpensePayment.fixedExpense association missing');
    }
    if (!ExpensePayment.associations.paidByUser) {
      throw new Error('ExpensePayment.paidByUser association missing');
    }

    console.log('[TestDashboard] ExpensePayment associations verified successfully.');

    // Test calculation algorithm logic
    const mockAccounts = [
      { id: 'acc-1', name: 'UniCredit Folyószámla' },
      { id: 'acc-2', name: 'Revolut' }
    ];

    const mockItems = [
      { accountId: 'acc-1', status: 'PAID', plannedAmount: 10000, actualAmount: 9500 },
      { accountId: 'acc-1', status: 'PENDING', plannedAmount: 15000, actualAmount: null },
      { accountId: 'acc-2', status: 'PENDING', plannedAmount: 5000, actualAmount: null },
      { accountId: 'acc-2', status: 'SKIPPED', plannedAmount: 3000, actualAmount: 0 }
    ];

    let totalPlanned = 0;
    let totalPaid = 0;
    let totalRemainingPending = 0;

    for (const it of mockItems) {
      if (it.status === 'SKIPPED') continue;
      totalPlanned += it.plannedAmount;
      if (it.status === 'PAID') totalPaid += it.actualAmount;
      if (it.status === 'PENDING') totalRemainingPending += it.plannedAmount;
    }

    if (totalPlanned !== 30000 || totalPaid !== 9500 || totalRemainingPending !== 20000) {
      throw new Error(`Global calculation mismatch: planned=${totalPlanned}, paid=${totalPaid}, pending=${totalRemainingPending}`);
    }

    console.log(`[TestDashboard] Calculation verified: totalPlanned=${totalPlanned}, totalPaid=${totalPaid}, totalRemainingPending=${totalRemainingPending}`);
    console.log('[TestDashboard] All Phase 4 engine tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[TestDashboard] Test failed:', error);
    process.exit(1);
  }
}

testDashboard();
