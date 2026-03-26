#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f "artisan" ]]; then
  echo "artisan not found. Run this script from inside the project."
  exit 1
fi

PHP_BIN="${PHP_BIN:-php}"
COMPOSER_BIN="${COMPOSER_BIN:-composer}"
NPM_BIN="${NPM_BIN:-npm}"
DEPLOY_REMOTE="${DEPLOY_REMOTE:-origin}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-}"
LOCK_FILE="${LOCK_FILE:-/tmp/athlix2-deploy.lock}"
PHP_FPM_SERVICE="${PHP_FPM_SERVICE:-}"
QUEUE_SERVICE="${QUEUE_SERVICE:-}"

RUN_MODE="migrate"
SKIP_PULL=0
SKIP_BUILD=0
NO_DOWN=0

print_usage() {
  cat <<'USAGE'
Usage: ./scripts/deploy_vps.sh [options]

Options:
  --branch <name>   Git branch to deploy (default: current branch)
  --remote <name>   Git remote to pull from (default: origin)
  --fresh-seed      Destructive migrate:fresh --seed (non-production only)
  --skip-pull       Skip git fetch/pull (use current working tree)
  --skip-build      Skip npm ci + npm run build
  --no-down         Skip maintenance mode
  -h, --help        Show this help

Env overrides:
  PHP_BIN, COMPOSER_BIN, NPM_BIN, LOCK_FILE, PHP_FPM_SERVICE, QUEUE_SERVICE
USAGE
}

ensure_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Required command not found: $cmd"
    exit 1
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      [[ $# -ge 2 ]] || { echo "--branch needs a value"; exit 1; }
      DEPLOY_BRANCH="$2"
      shift 2
      ;;
    --remote)
      [[ $# -ge 2 ]] || { echo "--remote needs a value"; exit 1; }
      DEPLOY_REMOTE="$2"
      shift 2
      ;;
    --fresh-seed)
      RUN_MODE="fresh-seed"
      shift
      ;;
    --skip-pull)
      SKIP_PULL=1
      shift
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    --no-down)
      NO_DOWN=1
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      print_usage
      exit 1
      ;;
  esac
done

ensure_command "$PHP_BIN"
ensure_command "$COMPOSER_BIN"
ensure_command git

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  ensure_command "$NPM_BIN"
fi

if [[ -z "$DEPLOY_BRANCH" ]]; then
  DEPLOY_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
fi

APP_ENV_VALUE="${APP_ENV:-$(grep -m1 '^APP_ENV=' .env 2>/dev/null | cut -d= -f2 || echo production)}"
if [[ "$RUN_MODE" == "fresh-seed" && "$APP_ENV_VALUE" == "production" ]]; then
  echo "--fresh-seed is blocked on production."
  exit 1
fi

if command -v flock >/dev/null 2>&1; then
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    echo "Another deployment is running. Lock: $LOCK_FILE"
    exit 1
  fi
fi

APP_DOWN=0
cleanup() {
  if [[ "$APP_DOWN" -eq 1 ]]; then
    "$PHP_BIN" artisan up || true
  fi
}
trap cleanup EXIT

if [[ "$NO_DOWN" -eq 0 ]]; then
  echo "==> Entering maintenance mode"
  "$PHP_BIN" artisan down --retry=60 || true
  APP_DOWN=1
fi

if [[ "$SKIP_PULL" -eq 0 ]]; then
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Working tree is dirty. Commit/stash first or use --skip-pull."
    exit 1
  fi

  echo "==> Pulling latest code ($DEPLOY_REMOTE/$DEPLOY_BRANCH)"
  git fetch "$DEPLOY_REMOTE" "$DEPLOY_BRANCH"
  git checkout "$DEPLOY_BRANCH"
  git pull --ff-only "$DEPLOY_REMOTE" "$DEPLOY_BRANCH"
fi

echo "==> Installing PHP dependencies"
"$COMPOSER_BIN" install --no-dev --optimize-autoloader --no-interaction

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  echo "==> Installing Node dependencies"
  "$NPM_BIN" ci

  echo "==> Building frontend assets"
  "$NPM_BIN" run build
else
  echo "==> Skipping frontend build"
fi

echo "==> Ensuring writable directories"
mkdir -p storage bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache || true

echo "==> Ensuring storage symlink"
if [[ ! -L "public/storage" ]]; then
  "$PHP_BIN" artisan storage:link || true
fi

if [[ "$RUN_MODE" == "fresh-seed" ]]; then
  echo "==> Running destructive reset + seed"
  "$PHP_BIN" artisan migrate:fresh --seed --force
else
  echo "==> Running safe migrations only"
  "$PHP_BIN" artisan migrate --force
fi

echo "==> Refreshing cache"
"$PHP_BIN" artisan optimize:clear
"$PHP_BIN" artisan config:cache
"$PHP_BIN" artisan route:cache
"$PHP_BIN" artisan view:cache
"$PHP_BIN" artisan queue:restart

if [[ -n "$QUEUE_SERVICE" ]] && command -v systemctl >/dev/null 2>&1; then
  echo "==> Restarting queue service: $QUEUE_SERVICE"
  systemctl restart "$QUEUE_SERVICE" || true
fi

if [[ -n "$PHP_FPM_SERVICE" ]] && command -v systemctl >/dev/null 2>&1; then
  echo "==> Reloading PHP-FPM service: $PHP_FPM_SERVICE"
  systemctl reload "$PHP_FPM_SERVICE" || true
fi

if [[ "$NO_DOWN" -eq 0 ]]; then
  echo "==> Leaving maintenance mode"
  "$PHP_BIN" artisan up
  APP_DOWN=0
fi

echo "==> Deploy completed"
if [[ "$RUN_MODE" == "fresh-seed" ]]; then
  echo "Database reset and reseed completed."
else
  echo "Database migrated without resetting data."
fi
