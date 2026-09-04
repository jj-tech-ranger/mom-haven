// src/services/notificationDeliveryService.ts
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from '../lib/firebase';

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register or retrieve the MomHaven service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.warn('[NotificationDelivery] SW registration warning:', err);
    return null;
  }
}

/**
 * Check current browser notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission from the user and register FCM token
 */
export async function requestNotificationPermissionAndToken(userId: string): Promise<{
  granted: boolean;
  token?: string;
  error?: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, error: 'Notifications not supported in this browser' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { granted: false, error: 'Notification permission denied by user' };
    }

    const reg = await registerServiceWorker();
    let fcmToken: string | undefined;

    // Check if Firebase Messaging is supported in this browser environment
    const supported = await isSupported().catch(() => false);
    if (supported) {
      try {
        const messaging = getMessaging(app);
        const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined)?.trim();
        
        fcmToken = await getToken(messaging, {
          serviceWorkerRegistration: reg || undefined,
          vapidKey: vapidKey || undefined,
        });
      } catch (fcmErr) {
        console.warn('[NotificationDelivery] FCM token retrieval notice (using local push fallback):', fcmErr);
      }
    }

    // Persist to user's mother profile in Firestore
    if (userId) {
      const profileRef = doc(db, 'motherProfiles', userId);
      await setDoc(profileRef, {
        fcmToken: fcmToken || null,
        notificationsEnabled: true,
        notificationPermission: 'granted',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        fcmToken: fcmToken || null,
        notificationsEnabled: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    return { granted: true, token: fcmToken };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { granted: false, error: msg };
  }
}

/**
 * Deliver a local OS system notification via Service Worker
 */
export async function showLocalSystemNotification(params: {
  title: string;
  body: string;
  deepLink?: 'today' | 'records' | 'journey' | 'profile';
  reminderId?: string;
}): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const reg = swRegistration || (await navigator.serviceWorker?.getRegistration());
    if (reg && 'showNotification' in reg) {
      await reg.showNotification(params.title, {
        body: params.body,
        icon: '/icon.png',
        badge: '/icon.png',
        tag: params.reminderId ? `reminder-${params.reminderId}` : 'momhaven-reminder',
        data: {
          url: `/?tab=${params.deepLink || 'today'}`,
          deepLink: params.deepLink || 'today',
          reminderId: params.reminderId,
        },
        requireInteraction: true,
      });
      return true;
    }

    // Fallback to standard Notification API
    new Notification(params.title, {
      body: params.body,
      icon: '/icon.png',
      badge: '/icon.png',
      tag: params.reminderId ? `reminder-${params.reminderId}` : 'momhaven-reminder',
      data: {
        url: `/?tab=${params.deepLink || 'today'}`,
        deepLink: params.deepLink || 'today',
        reminderId: params.reminderId,
      },
    });
    return true;
  } catch (err) {
    console.warn('[NotificationDelivery] Failed to show notification:', err);
    return false;
  }
}

/**
 * Trigger backend due reminder check
 */
export async function triggerProcessDueReminders(idToken?: string): Promise<{
  success: boolean;
  processedCount?: number;
  notifiedCount?: number;
  error?: string;
}> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) {
      headers['authorization'] = `Bearer ${idToken}`;
      headers['x-firebase-id-token'] = idToken;
    }
    const res = await fetch('/api/v1/reminders/process-due', {
      method: 'POST',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.message || `Status ${res.status}` };
    }
    const data = await res.json();
    return {
      success: true,
      processedCount: data.processedCount,
      notifiedCount: data.notifiedCount,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
