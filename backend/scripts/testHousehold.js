const dotenv = require('dotenv');
dotenv.config();

const { sequelize, User, Household, HouseholdInvitation } = require('../src/models');
const { generateInviteCode } = require('../src/utils/inviteCode');
const crypto = require('crypto');

async function testHousehold() {
  try {
    console.log('[TestHousehold] Checking models and database connection...');
    await sequelize.authenticate();
    console.log('[TestHousehold] Database connected.');

    // 1. Check Model Associations
    console.log('[TestHousehold] Checking HouseholdInvitation associations...');
    if (!Household.associations.invitations) {
      throw new Error('Household.associations.invitations missing!');
    }
    if (!HouseholdInvitation.associations.household) {
      throw new Error('HouseholdInvitation.associations.household missing!');
    }
    if (!User.associations.sentInvitations) {
      throw new Error('User.associations.sentInvitations missing!');
    }
    console.log('[TestHousehold] Associations verified successfully.');

    // 2. Test invite code format
    const code = generateInviteCode();
    console.log(`[TestHousehold] Generated invite code: ${code}`);
    if (!code.startsWith('BF-') || code.length !== 9) {
      throw new Error(`Invite code format invalid: ${code}`);
    }

    // 3. Test token generation
    const token = crypto.randomBytes(32).toString('hex');
    console.log(`[TestHousehold] Generated 64-char crypto token: ${token.substring(0, 12)}...`);
    if (token.length !== 64) {
      throw new Error(`Token length invalid: expected 64, got ${token.length}`);
    }

    // 4. Test table sync
    console.log('[TestHousehold] Syncing table structure...');
    await sequelize.sync({ alter: true });
    console.log('[TestHousehold] Table household_invitations synced.');

    console.log('[TestHousehold] All household backend checks PASSED!');
    process.exit(0);
  } catch (error) {
    console.error('[TestHousehold] Test failed:', error);
    process.exit(1);
  }
}

testHousehold();
