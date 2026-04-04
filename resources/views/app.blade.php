<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'ATHLIX') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700|roboto:400,500,700&display=swap" rel="stylesheet" />
        
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="theme-color" content="#ef4444">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="icon" type="image/png" href="/logo.png">


        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-slate-950">
        <!-- PWA/Loading Splash Screen -->
        <div id="pwa-splash">
            <div class="logo-wrapper">
                <div class="athlix-box">
                    <img src="/logo.png" class="athlix-icon">
                    <span class="athlix-brand">ATHLIX</span>
                </div>
                <span class="collab-x">X</span>
                <img src="/icons/winpro_logo.png" class="winpro-brand">
            </div>
            
            <div class="loader-box">
                <div class="loader-fill"></div>
            </div>

            <div class="footer-credit">by Alenkosa</div>

            <style>
                #pwa-splash {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: #020617; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; z-index: 9999;
                    transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    font-family: 'Inter', sans-serif;
                }
                .logo-wrapper {
                    display: flex; align-items: center; gap: 20px;
                    animation: zoomIn 0.8s ease-out;
                }
                .athlix-box { display: flex; align-items: center; gap: 12px; }
                .athlix-icon { width: 60px; height: 60px; border-radius: 14px; box-shadow: 0 0 20px rgba(220,38,38,0.2); }
                .athlix-brand { color: #fff; font-size: 26px; font-weight: 900; letter-spacing: 1px; }
                .collab-x { color: #334155; font-size: 22px; font-weight: 300; }
                .winpro-brand { height: 42px; filter: drop-shadow(0 0 8px rgba(255,255,255,0.05)); }
                
                .loader-box { margin-top: 40px; width: 120px; height: 2px; background: #1e293b; border-radius: 2px; overflow: hidden; position: relative; }
                .loader-fill { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(90deg, #ef4444, #dc2626); animation: loadingBar 2.5s infinite ease-in-out; }
                
                .footer-credit { position: absolute; bottom: 40px; color: #475569; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; opacity: 0.8; }

                @media (max-width: 640px) {
                    .logo-wrapper { flex-direction: column; gap: 15px; text-align: center; }
                    .collab-x { margin: 5px 0; font-size: 18px; }
                    .athlix-icon { width: 80px; height: 80px; }
                    .athlix-brand { font-size: 32px; }
                    .winpro-brand { height: 50px; }
                }

                @keyframes loadingBar { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            </style>
        </div>
        <script>
            window.addEventListener('load', function() {
                setTimeout(function() {
                    var splash = document.getElementById('pwa-splash');
                    if (splash) {
                        splash.style.opacity = '0';
                        setTimeout(function() { splash.remove(); }, 600);
                    }
                }, 1200);
            });
        </script>

        @inertia
    </body>
</html>
