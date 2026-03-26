const REGISTERED_DEVICE_KEY = 'athlix_device_registered_token_hash';

function toBase64UrlSafe(input) {
    return btoa(input)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function decodeBase64UrlToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const safeBase64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(safeBase64);
    const output = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
        output[i] = rawData.charCodeAt(i);
    }

    return output;
}

function fallbackToken() {
    const ua = navigator.userAgent || 'unknown';
    const platform = navigator.platform || 'unknown';
    const language = navigator.language || 'unknown';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';

    return toBase64UrlSafe(`${ua}|${platform}|${language}|${timezone}`);
}

async function resolvePushToken() {
    if (!('serviceWorker' in navigator)) {
        return fallbackToken();
    }

    const registration = await navigator.serviceWorker.ready;
    const vapidKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;

    if ('PushManager' in window && vapidKey) {
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: decodeBase64UrlToUint8Array(vapidKey),
            });
        }

        return JSON.stringify(subscription.toJSON());
    }

    return fallbackToken();
}

async function hashToken(token) {
    if (!window.crypto?.subtle) {
        return token.slice(0, 64);
    }

    const buffer = new TextEncoder().encode(token);
    const digest = await window.crypto.subtle.digest('SHA-256', buffer);
    const view = Array.from(new Uint8Array(digest));

    return view.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function registerWebNotificationDevice() {
    if (typeof window === 'undefined') {
        return;
    }

    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    try {
        const token = await resolvePushToken();
        const tokenHash = await hashToken(token);
        const existingHash = window.localStorage.getItem(REGISTERED_DEVICE_KEY);
        if (existingHash === tokenHash) {
            return;
        }

        const response = await fetch('/api/v1/notifications/devices', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                platform: 'webpush',
                device_label: navigator.platform || 'Web',
                push_token: token,
            }),
        });

        if (response.ok) {
            window.localStorage.setItem(REGISTERED_DEVICE_KEY, tokenHash);
        }
    } catch (error) {
        // noop
    }
}
