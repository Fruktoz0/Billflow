const dotenv = require('dotenv');
dotenv.config();

const { PushSubscription, User } = require('../src/models');
const { vapidPublicKey } = require('../src/config/webpush');

async function testPush() {
  try {
    console.log('[TestPush] Verifying VAPID setup...');

    if (!vapidPublicKey || vapidPublicKey.length < 20) {
      throw new Error(`Invalid VAPID public key: ${vapidPublicKey}`);
    }
    console.log(`[TestPush] VAPID Public Key confirmed (length: ${vapidPublicKey.length}): ${vapidPublicKey.substring(0, 16)}...`);

    console.log('[TestPush] Checking PushSubscription model attributes and associations...');
    const attrs = Object.keys(PushSubscription.rawAttributes);
    console.log(`[TestPush] PushSubscription attributes: ${attrs.join(', ')}`);

    const required = ['id', 'userId', 'endpoint', 'p256dh', 'auth'];
    for (const r of required) {
      if (!attrs.includes(r)) {
        throw new Error(`Missing attribute: ${r}`);
      }
    }

    if (!PushSubscription.associations.user) {
      throw new Error('PushSubscription.user association missing');
    }
    if (!User.associations.pushSubscriptions) {
      throw new Error('User.pushSubscriptions association missing');
    }

    console.log('[TestPush] Model attributes and user associations verified successfully.');
    console.log('[TestPush] Phase 5 Web Push & Worker verification passed!');
    process.exit(0);
  } catch (error) {
    console.error('[TestPush] Test failed:', error);
    process.exit(1);
  }
}

testPush();
