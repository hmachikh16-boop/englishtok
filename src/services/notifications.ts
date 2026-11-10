import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

let permissionGranted = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const current = await LocalNotifications.checkPermissions();
      if (current.display === 'granted') {
        permissionGranted = true;
        return true;
      }
      const requested = await LocalNotifications.requestPermissions();
      permissionGranted = requested.display === 'granted';
      return permissionGranted;
    } catch {
      return false;
    }
  }
  if (typeof Notification !== 'undefined') {
    if (Notification.permission === 'granted') {
      permissionGranted = true;
      return true;
    }
    if (Notification.permission === 'default') {
      try {
        const result = await Notification.requestPermission();
        permissionGranted = result === 'granted';
        return permissionGranted;
      } catch {
        return false;
      }
    }
  }
  return false;
}

export async function notifyLocal(title: string, body: string, id = Date.now()): Promise<void> {
  const granted = permissionGranted || (await ensureNotificationPermission());
  if (!granted) return;
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: { at: new Date(Date.now() + 50) },
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#a56c18',
          },
        ],
      });
    } catch {
      /* ignore */
    }
  } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/icon-512.png', tag: String(id) });
    } catch {
      /* ignore */
    }
  }
}
