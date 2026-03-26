const DB_NAME = 'athlix-offline-sync';
const DB_VERSION = 1;
const STORE_NAME = 'wellness_queue';

let dbPromise = null;

function openDb() {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return Promise.resolve(null);
    }

    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('created_at', 'created_at', { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return dbPromise;
}

async function queueItem(type, payload) {
    const db = await openDb();
    if (!db) {
        return null;
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.add({
            type,
            payload,
            created_at: new Date().toISOString(),
            attempts: 0,
        });

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllQueuedItems() {
    const db = await openDb();
    if (!db) {
        return [];
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const items = Array.isArray(request.result) ? request.result : [];
            items.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
            resolve(items);
        };
        request.onerror = () => reject(request.error);
    });
}

async function deleteQueuedItem(id) {
    const db = await openDb();
    if (!db) {
        return;
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function incrementAttempt(item) {
    const db = await openDb();
    if (!db) {
        return;
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put({
            ...item,
            attempts: (Number(item.attempts) || 0) + 1,
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function resolveEndpoint(type) {
    if (type === 'readiness') {
        return '/api/v1/wellness/readiness';
    }
    if (type === 'rpe') {
        return '/api/v1/wellness/rpe-logs';
    }

    return null;
}

async function postQueueItem(item) {
    const endpoint = resolveEndpoint(item.type);
    if (!endpoint) {
        throw new Error('Unsupported queue type');
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify(item.payload),
    });

    if (response.ok) {
        return;
    }

    if (response.status >= 400 && response.status < 500) {
        const error = new Error('Validation or authorization failed');
        error.permanent = true;
        throw error;
    }

    throw new Error(`Sync failed with status ${response.status}`);
}

export async function enqueueWellnessPayload(type, payload) {
    await queueItem(type, payload);
}

export async function getWellnessQueueSize() {
    const items = await getAllQueuedItems();

    return items.length;
}

export async function syncWellnessQueue() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return { synced: 0, pending: await getWellnessQueueSize() };
    }

    const items = await getAllQueuedItems();
    let synced = 0;

    for (const item of items) {
        try {
            await postQueueItem(item);
            await deleteQueuedItem(item.id);
            synced++;
        } catch (error) {
            if (error?.permanent) {
                await deleteQueuedItem(item.id);
                continue;
            }

            await incrementAttempt(item);
            break;
        }
    }

    return {
        synced,
        pending: await getWellnessQueueSize(),
    };
}

export async function submitWellnessPayload(type, payload) {
    const endpoint = resolveEndpoint(type);
    if (!endpoint) {
        throw new Error('Unsupported payload type');
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await enqueueWellnessPayload(type, payload);

        return { queued: true, synced: false };
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            return { queued: false, synced: true };
        }

        if (response.status >= 400 && response.status < 500) {
            const body = await response.json().catch(() => ({}));
            const message = body?.message || 'Request rejected by server.';
            throw new Error(message);
        }

        await enqueueWellnessPayload(type, payload);
        return { queued: true, synced: false };
    } catch (error) {
        await enqueueWellnessPayload(type, payload);
        return { queued: true, synced: false, error };
    }
}

export function registerWellnessAutoSync(onStatus) {
    let active = true;

    const triggerSync = async () => {
        if (!active) return;
        const result = await syncWellnessQueue();
        if (typeof onStatus === 'function') {
            onStatus(result);
        }
    };

    const handleOnline = () => {
        triggerSync();
    };

    const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
            triggerSync();
        }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = window.setInterval(triggerSync, 45000);
    triggerSync();

    return () => {
        active = false;
        window.removeEventListener('online', handleOnline);
        document.removeEventListener('visibilitychange', handleVisibility);
        window.clearInterval(interval);
    };
}
