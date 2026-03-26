const ABSOLUTE_URL_PATTERN = /^(?:[a-z]+:)?\/\//i;

export function resolveMediaUrl(path) {
    if (!path) {
        return null;
    }

    if (ABSOLUTE_URL_PATTERN.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
    }

    const normalized = String(path).replace(/^\/+/, '');

    if (normalized.startsWith('seed/')) {
        return `/${normalized}`;
    }

    if (!normalized.includes('/') && normalized.endsWith('-placeholder.svg')) {
        return `/seed/${normalized}`;
    }

    if (normalized.startsWith('storage/')) {
        return `/${normalized}`;
    }

    return `/storage/${normalized}`;
}
