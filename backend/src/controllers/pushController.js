const { PushSubscription } = require('../models');
const { webpush, vapidPublicKey } = require('../config/webpush');

/**
 * Return the public VAPID key to the client for push registration.
 */
const getVapidPublicKey = (req, res) => {
  return res.status(200).json({ publicKey: vapidPublicKey });
};

/**
 * Register or update a browser push subscription for the logged-in user.
 */
const subscribe = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Invalid subscription object. Requires endpoint, p256dh and auth keys.' });
    }

    const [subscription, created] = await PushSubscription.findOrCreate({
      where: { endpoint },
      defaults: {
        userId: req.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      }
    });

    if (!created) {
      await subscription.update({
        userId: req.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth
      });
    }

    return res.status(201).json({
      message: 'Push subscription registered successfully',
      id: subscription.id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unsubscribe and remove push registration for the specified endpoint.
 */
const unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required to unsubscribe' });
    }

    const count = await PushSubscription.destroy({
      where: {
        endpoint,
        userId: req.user.id
      }
    });

    return res.status(200).json({
      message: 'Push subscription removed successfully',
      removed: count > 0
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a test notification to the authenticated user's registered devices.
 */
const sendTestNotification = async (req, res, next) => {
  try {
    const subscriptions = await PushSubscription.findAll({
      where: { userId: req.user.id }
    });

    if (subscriptions.length === 0) {
      return res.status(400).json({
        error: 'No active push subscriptions found for this user. Subscribe in your browser first.'
      });
    }

    const payload = JSON.stringify({
      title: '🏦 Billflow Teszt Értesítés',
      body: 'Sikeres Web Push kapcsolat! Az értesítések megfelelően működnek a böngésződben.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        url: '/?source=push_test'
      }
    });

    let sent = 0;
    let failed = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushConfig = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        try {
          await webpush.sendNotification(pushConfig, payload);
          sent++;
        } catch (err) {
          failed++;
          console.error(`[WebPush] Failed sending to endpoint (${err.statusCode}):`, err.message);
          // If subscription is expired or unsubscribed, remove from DB
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log(`[WebPush] Removing expired subscription ${sub.id}`);
            await sub.destroy();
          }
        }
      })
    );

    return res.status(200).json({
      message: 'Test notification processed',
      totalSubscriptions: subscriptions.length,
      sent,
      failed
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  sendTestNotification
};
