import { api } from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushService = {
  /**
   * Check if Web Push and Service Workers are supported in the current browser.
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  /**
   * Get the current notification permission state.
   */
  getPermissionState(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  /**
   * Check if there is an active push subscription.
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;
    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch {
      return null;
    }
  },

  /**
   * Request permission and subscribe the device to Web Push.
   */
  async subscribe(): Promise<PushSubscription> {
    if (!this.isSupported()) {
      throw new Error('A Web Push értesítések nem támogatottak ebben a böngészőben.');
    }

    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Az értesítési jogosultság elutasításra került.');
    }

    // 2. Ensure Service Worker is registered and ready
    const registration = await navigator.serviceWorker.ready;

    // 3. Fetch VAPID public key from backend
    const { publicKey } = await api.push.getVapidKey();
    if (!publicKey) {
      throw new Error('Nem sikerült lekérni a VAPID publikus kulcsot a szervertől.');
    }

    // 4. Subscribe via PushManager
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    // 5. Send subscription to backend
    const subJSON = subscription.toJSON();
    await api.push.subscribe({
      endpoint: subJSON.endpoint,
      keys: {
        p256dh: subJSON.keys?.p256dh,
        auth: subJSON.keys?.auth
      }
    });

    return subscription;
  },

  /**
   * Unsubscribe from Web Push both in the browser and on the backend.
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await api.push.unsubscribe({ endpoint }).catch(() => {});
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[PushService] Unsubscribe error:', err);
      return false;
    }
  }
};
