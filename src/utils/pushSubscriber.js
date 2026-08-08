import { supabase } from '../supabaseClient';

// Helper to convert base64 VAPID string into Uint8Array required by PushManager
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush(currentUser) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push notifications are not supported in this browser.');
    return;
  }

  try {
    // 1. Request notification permission from browser
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('Notification permission was denied.');
      return;
    }

    // 2. Retrieve registered service worker
    const registration = await navigator.serviceWorker.ready;

    // 3. Subscribe device with public VAPID key
    const publicVapidKey = import.meta.env.VITE_PUBLIC_VAPID_KEY;
    if (!publicVapidKey) {
      console.error('VITE_PUBLIC_VAPID_KEY is not defined in .env');
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });

    // 4. Save device token to Supabase push_subscriptions table
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: currentUser.id,
      subscription: subscription.toJSON(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving subscription to Supabase:', error);
      alert('Failed to register device for push notifications.');
    } else {
      alert('Device successfully registered for push notifications! 🔔');
    }
  } catch (err) {
    console.error('Push registration error:', err);
  }
}