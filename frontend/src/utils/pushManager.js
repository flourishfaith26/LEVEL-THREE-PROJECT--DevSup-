const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
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

/**
 * Request notification permission and subscribe to Web Push
 */
export async function subscribeToPushNotifications(getAccessTokenSilently) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Web Push is not supported in this browser.');
        return { success: false, reason: 'unsupported' };
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return { success: false, reason: 'denied' };
        }

        const registration = await navigator.serviceWorker.ready;

        // Fetch VAPID Public Key from backend
        const keyRes = await fetch(`${BACKEND_URL}/api/push/public-key`);
        if (!keyRes.ok) {
            throw new Error('Failed to retrieve VAPID public key');
        }
        const { publicKey } = await keyRes.json();
        if (!publicKey) {
            throw new Error('VAPID public key was empty');
        }

        // Subscribe with PushManager
        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey
        });

        // Send subscription to backend
        const token = await getAccessTokenSilently();
        const subRes = await fetch(`${BACKEND_URL}/api/push/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ subscription })
        });

        if (!subRes.ok) {
            throw new Error('Backend failed to register push subscription');
        }

        return { success: true };
    } catch (err) {
        console.warn('Error subscribing to push notifications:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Unsubscribe from Web Push
 */
export async function unsubscribeFromPushNotifications(getAccessTokenSilently) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            const endpoint = subscription.endpoint;
            await subscription.unsubscribe();

            const token = await getAccessTokenSilently();
            await fetch(`${BACKEND_URL}/api/push/unsubscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ endpoint })
            });
        }
    } catch (err) {
        console.warn('Error unsubscribing from push notifications:', err.message);
    }
}

