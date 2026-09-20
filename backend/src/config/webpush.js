const webpush = require('web-push');
const dotenv = require('dotenv');

dotenv.config();

let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@billflow.local';

// If keys are missing, generate temporary keys for development and instruct user
if (!vapidPublicKey || !vapidPrivateKey) {
  console.warn('[WebPush] VAPID keys not found in .env. Generating development VAPID keypair...');
  const generated = webpush.generateVAPIDKeys();
  vapidPublicKey = generated.publicKey;
  vapidPrivateKey = generated.privateKey;
  console.warn(`[WebPush] Generated VAPID Public Key:  ${vapidPublicKey}`);
  console.warn(`[WebPush] Generated VAPID Private Key: ${vapidPrivateKey}`);
  console.warn('[WebPush] TIP: Add these to your backend/.env to persist them across restarts.');
}

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

module.exports = {
  webpush,
  vapidPublicKey
};
