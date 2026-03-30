import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                mono: ['Roboto', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                athlix: {
                    black: '#000000',
                    red: 'var(--athlix-red, #E61E32)',
                    white: '#FFFFFF',
                    grey: '#B3B3B3',
                },
                border: 'hsl(var(--border, 220 13% 91%))',
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.5s ease-out both',
                'fade-in': 'fadeIn 0.4s ease-out both',
                'slide-in-left': 'slideInLeft 0.4s ease-out both',
                'slide-in-right': 'slideInRight 0.4s ease-out both',
                'scale-in': 'scaleIn 0.3s ease-out both',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                'shimmer': 'shimmer 3s ease-in-out infinite',
                'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) both',
                'slide-up': 'slideUp 0.5s ease-out both',
                'gradient-shift': 'gradientShift 3s ease infinite',
            },
            keyframes: {
                fadeInUp: {
                    from: { opacity: '0', transform: 'translateY(20px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                slideInLeft: {
                    from: { opacity: '0', transform: 'translateX(-20px)' },
                    to: { opacity: '1', transform: 'translateX(0)' },
                },
                slideInRight: {
                    from: { opacity: '0', transform: 'translateX(20px)' },
                    to: { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    from: { opacity: '0', transform: 'scale(0.9)' },
                    to: { opacity: '1', transform: 'scale(1)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 10px rgba(230, 30, 50, 0.2)' },
                    '50%': { boxShadow: '0 0 25px rgba(230, 30, 50, 0.4)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                shimmer: {
                    '0%': { left: '-100%' },
                    '100%': { left: '200%' },
                },
                bounceIn: {
                    '0%': { transform: 'scale(0.3)', opacity: '0' },
                    '50%': { transform: 'scale(1.05)' },
                    '70%': { transform: 'scale(0.9)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                slideUp: {
                    from: { transform: 'translateY(100%)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
                gradientShift: {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
            },
            boxShadow: {
                'glow-red': '0 0 20px rgba(230, 30, 50, 0.15), 0 0 60px rgba(230, 30, 50, 0.05)',
                'glow-red-lg': '0 0 30px rgba(230, 30, 50, 0.3), 0 0 80px rgba(230, 30, 50, 0.1)',
                'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
                'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.3)',
                'card-hover': '0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04)',
                'nav-float': '0 15px 40px rgba(0, 0, 0, 0.4)',
            },
        },
    },

    plugins: [forms],
};
