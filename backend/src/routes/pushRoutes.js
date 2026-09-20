const express = require('express');
const {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  sendTestNotification
} = require('../controllers/pushController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Public endpoint for browser to fetch public key
router.get('/vapid-public-key', getVapidPublicKey);

// Protected endpoints for managing user's push subscriptions
router.post('/subscribe', authMiddleware, subscribe);
router.post('/unsubscribe', authMiddleware, unsubscribe);
router.post('/test', authMiddleware, sendTestNotification);

module.exports = router;
