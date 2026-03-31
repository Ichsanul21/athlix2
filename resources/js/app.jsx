import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { LanguageProvider } from '@/Components/LanguageProvider';
import axios from 'axios';

const appName = import.meta.env.VITE_APP_NAME || 'ATHLIX';

// ── Session / Token Expiry Interceptor ──
// If the server returns 401 (Unauthenticated) or 419 (CSRF/Session expired),
// redirect to landing page with clear message.
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && [401, 419].includes(error.response.status)) {
            window.location.href = '/?session_expired=1';
        }
        return Promise.reject(error);
    }
);

// Also intercept Inertia navigation errors (e.g. when Inertia itself gets a 401/419)
router.on('invalid', (event) => {
    const status = event.detail?.response?.status;
    if (status === 401 || status === 419) {
        event.preventDefault();
        window.location.href = '/?session_expired=1';
    }
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const app = (
            <LanguageProvider>
                <App {...props} />
            </LanguageProvider>
        );

        if (import.meta.env.SSR) {
            hydrateRoot(el, app);
            return;
        }

        createRoot(el).render(app);
    },
    progress: {
        color: '#E61E32',
    },
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registered: ', registration);
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}
