import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            outDir: 'public',
            buildBase: '/',
            scope: '/',
            manifest: {
                name: 'ATHLIX Dojo Management',
                short_name: 'ATHLIX',
                description: 'Dojo Management SaaS Platform',
                theme_color: '#E61E32',
                background_color: '#000000',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    {
                        src: '/logo-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/logo-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                navigateFallback: null,
            },
        })
    ],
});
