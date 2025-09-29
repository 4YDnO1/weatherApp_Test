#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  cp .env.example .env || true
fi

php artisan key:generate --force || true
php artisan migrate --force

# Initial fetch
if php artisan list | grep -q weather:fetch; then
  php artisan weather:fetch --once || true
  # Background fetch every 10 minutes
  ( while true; do php artisan weather:fetch --once || true; sleep 600; done ) &
fi

# Start scheduler as well (no harm if no tasks)
(php artisan schedule:work &) >/dev/null 2>&1 || true

php artisan serve --host=0.0.0.0 --port=8000 