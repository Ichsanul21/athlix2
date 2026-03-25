#!/usr/bin/env bash

set -euo pipefail

MODE="${1:-migrate}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if [[ ! -f "artisan" ]]; then
  echo "artisan not found. Run this script from inside the project."
  exit 1
fi

PHP_BIN="${PHP_BIN:-php}"
COMPOSER_BIN="${COMPOSER_BIN:-composer}"
NPM_BIN="${NPM_BIN:-npm}"

echo "==> Installing PHP dependencies"
"$COMPOSER_BIN" install --no-dev --optimize-autoloader --no-interaction

echo "==> Installing Node dependencies"
"$NPM_BIN" ci

echo "==> Building frontend assets"
"$NPM_BIN" run build

echo "==> Ensuring storage symlink"
if [[ ! -L "public/storage" ]]; then
  "$PHP_BIN" artisan storage:link || true
fi

if [[ "$MODE" == "--fresh-seed" ]]; then
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

echo "==> Deploy completed"
if [[ "$MODE" == "--fresh-seed" ]]; then
  echo "Database has been reset and reseeded."
else
  echo "Database schema updated without resetting data."
fi
