# VPS Deployment Runbook (VPS-First, Docker/S3 Ready)

This project is deployed on a single VPS for now, with architecture kept ready to migrate later to containers and S3-compatible storage.

## 1) One-time VPS setup

1. Install runtime dependencies:
   - PHP 8.2+ with required extensions (`mbstring`, `xml`, `curl`, `zip`, `pdo_mysql`, `bcmath`, `intl`, `gd`)
   - Composer
   - Node.js 20+ and npm
   - MySQL 8+
   - Nginx + PHP-FPM
2. Clone project:
   ```bash
   cd /var/www
   git clone https://github.com/Ichsanul21/athlix2.git
   cd athlix2
   ```
3. Create env and set production values:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
4. Edit `.env` at minimum:
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - `APP_URL=https://your-domain`
   - `DB_CONNECTION=mysql`
   - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
   - `QUEUE_CONNECTION=database`
   - Optional bootstrap defaults (can be overridden in Super Admin dashboard):
     - `ALLOW_PUBLIC_REGISTRATION=false`
     - `BILLING_INVOICE_DAY=1`
     - `BILLING_INVOICE_TIME=00:10`
     - `BILLING_SCHEDULE_TIMEZONE=Asia/Makassar`
     - `SAAS_ENFORCEMENT_TIME=00:30`
     - `SAAS_SCHEDULE_TIMEZONE=Asia/Makassar`
     - `WHATSAPP_ENABLED=true`
     - `WHATSAPP_PROVIDER=fonnte`
     - `WHATSAPP_BASE_URL=https://api.fonnte.com/send`
     - `WHATSAPP_TOKEN=<token-whatsapp-gateway>`
     - `WHATSAPP_AUTH_HEADER=Authorization`
     - `WHATSAPP_TIMEOUT=10`
     - `WHATSAPP_COUNTRY_CODE=62`

After first login as `super_admin`, open `Super Admin > System Settings` to manage those app-level values without editing `.env`.

## 2) Queue worker (systemd)

Create `/etc/systemd/system/athlix-queue.service`:

```ini
[Unit]
Description=Athlix Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/athlix2/artisan queue:work --sleep=1 --tries=3 --timeout=120
WorkingDirectory=/var/www/athlix2

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now athlix-queue
```

## 3) Scheduler (cron)

Add cron on VPS user (or root):

```bash
* * * * * cd /var/www/athlix2 && php artisan schedule:run >> /dev/null 2>&1
```

This will trigger:
- monthly `billing:generate-invoices`
- daily `saas:enforce-subscriptions` (auto reminder H-7/H-1 and auto block after grace period)

`saas:enforce-subscriptions` sends notifications to email and WhatsApp (if enabled).

## 4) Update deploy command

From project root:

```bash
bash scripts/deploy_vps.sh --branch main
```

Useful options:
- `--skip-pull` if code already updated manually.
- `--skip-build` if frontend assets are prebuilt elsewhere.
- `--no-down` if you do not want maintenance mode.
- `--fresh-seed` for reset+seed (blocked automatically on production).

Optional service reload during deploy:

```bash
QUEUE_SERVICE=athlix-queue PHP_FPM_SERVICE=php8.2-fpm bash scripts/deploy_vps.sh --branch main
```

## 5) Migration path (later)

- Docker migration: split app, queue worker, scheduler, MySQL, Redis without changing app-level tenant schema.
- S3 migration: change filesystem disk config from local/public to S3-compatible (`FILESYSTEM_DISK=s3`) with existing Laravel storage abstraction.
