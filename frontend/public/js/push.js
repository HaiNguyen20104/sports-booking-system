// Push Notification Helper

const PushNotification = {
  // VAPID Public Key - Lấy từ backend hoặc config
  // Thay bằng key thực từ .env của bạn
  VAPID_PUBLIC_KEY: null,

  /**
   * Lấy VAPID Public Key từ backend
   */
  async getVapidKey() {
    if (this.VAPID_PUBLIC_KEY) return this.VAPID_PUBLIC_KEY;

    try {
      const response = await fetch('/api/notifications/vapid-key');
      const data = await response.json();
      if (data.success && data.data.vapidPublicKey) {
        this.VAPID_PUBLIC_KEY = data.data.vapidPublicKey;
        return this.VAPID_PUBLIC_KEY;
      }
    } catch (error) {
      console.error('Failed to get VAPID key:', error);
    }
    return null;
  },

  /**
   * Kiểm tra browser có hỗ trợ push không
   */
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  /**
   * Đăng ký Service Worker
   */
  async registerServiceWorker() {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  },

  /**
   * Xin quyền thông báo
   */
  async requestPermission() {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission === 'granted';
  },

  /**
   * Đăng ký push subscription
   */
  async subscribe() {
    if (!this.isSupported()) {
      console.warn('Push not supported');
      return null;
    }

    // Xin quyền
    const granted = await this.requestPermission();
    if (!granted) {
      console.warn('Notification permission denied');
      return null;
    }

    // Lấy VAPID key
    const vapidKey = await this.getVapidKey();
    if (!vapidKey) {
      console.error('VAPID key not available');
      return null;
    }

    try {
      // Đăng ký service worker
      const registration = await navigator.serviceWorker.ready;

      // Tạo subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey)
      });

      console.log('Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      return null;
    }
  },

  /**
   * Gửi subscription lên backend
   */
  async saveSubscription(subscription) {
    const accessToken = localStorage.getItem('accessToken');
    const deviceId = localStorage.getItem('deviceId');

    if (!accessToken || !deviceId) {
      console.error('Missing accessToken or deviceId');
      return false;
    }

    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          device_id: deviceId,
          subscription: subscription.toJSON()
        })
      });

      const data = await response.json();
      console.log('Subscription saved:', data);
      return data.success;
    } catch (error) {
      console.error('Failed to save subscription:', error);
      return false;
    }
  },

  /**
   * Đăng ký push và lưu lên backend
   */
  async subscribeAndSave() {
    // Đăng ký service worker trước
    await this.registerServiceWorker();

    // Subscribe
    const subscription = await this.subscribe();
    if (!subscription) {
      return false;
    }

    // Gửi lên backend
    return await this.saveSubscription(subscription);
  },

  /**
   * Convert base64 to Uint8Array (cho VAPID key)
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
};

// Export for use
window.PushNotification = PushNotification;
