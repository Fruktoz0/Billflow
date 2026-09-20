const dotenv = require('dotenv');
dotenv.config();

const { BankAccount, FixedExpense } = require('../src/models');

async function testCrud() {
  try {
    console.log('[TestCRUD] Checking BankAccount and FixedExpense model associations...');

    if (!BankAccount.associations.defaultFixedExpenses) {
      throw new Error('BankAccount.defaultFixedExpenses association is missing');
    }
    if (!FixedExpense.associations.defaultAccount) {
      throw new Error('FixedExpense.defaultAccount association is missing');
    }

    console.log('[TestCRUD] Associations verified successfully.');
    console.log('[TestCRUD] BankAccount model raw attributes:');
    console.log(Object.keys(BankAccount.rawAttributes).join(', '));

    console.log('[TestCRUD] FixedExpense model raw attributes:');
    console.log(Object.keys(FixedExpense.rawAttributes).join(', '));

    console.log('[TestCRUD] All CRUD model configuration checks passed!');
    process.exit(0);
  } catch (error) {
    console.error('[TestCRUD] Test failed:', error);
    process.exit(1);
  }
}

testCrud();
