const dotenv = require('dotenv');
dotenv.config();

const { sequelize, User, Household } = require('../src/models');
const { generateToken, verifyToken } = require('../src/utils/token');
const { generateInviteCode } = require('../src/utils/inviteCode');

async function testAuth() {
  try {
    console.log('[TestAuth] Testing Database Connection...');
    await sequelize.authenticate();
    console.log('[TestAuth] Database connected.');

    // 1. Test invite code generator
    const code = generateInviteCode();
    console.log(`[TestAuth] Generated test invite code: ${code}`);
    if (!code.startsWith('BF-') || code.length !== 9) {
      throw new Error(`Invite code format invalid: ${code}`);
    }

    // 2. Test token generator and verification
    const mockUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'test@billflow.local',
      householdId: '00000000-0000-0000-0000-000000000002',
      role: 'OWNER'
    };
    const token = generateToken(mockUser);
    console.log('[TestAuth] Generated JWT successfully.');
    const decoded = verifyToken(token);
    if (decoded.email !== mockUser.email || decoded.role !== mockUser.role) {
      throw new Error('Decoded token payload does not match original user!');
    }
    console.log('[TestAuth] Verified JWT payload successfully.');

    console.log('[TestAuth] All unit and utility checks passed!');
    process.exit(0);
  } catch (error) {
    console.error('[TestAuth] Test failed:', error);
    process.exit(1);
  }
}

testAuth();
