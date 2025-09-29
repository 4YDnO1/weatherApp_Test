#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
	if [ -f .env.docker ]; then
		cp .env.docker .env
	else
		cp .env.example .env || true
	fi
fi

# Ensure DB settings in .env match container env variables
if [ -n "${DB_CONNECTION:-}" ]; then sed -i "s/^DB_CONNECTION=.*/DB_CONNECTION=${DB_CONNECTION}/" .env || true; fi
if [ -n "${DB_HOST:-}" ]; then sed -i "s/^DB_HOST=.*/DB_HOST=${DB_HOST}/" .env || true; fi
if [ -n "${DB_PORT:-}" ]; then sed -i "s/^DB_PORT=.*/DB_PORT=${DB_PORT}/" .env || true; fi
if [ -n "${DB_DATABASE:-}" ]; then sed -i "s/^DB_DATABASE=.*/DB_DATABASE=${DB_DATABASE}/" .env || true; fi
if [ -n "${DB_USERNAME:-}" ]; then sed -i "s/^DB_USERNAME=.*/DB_USERNAME=${DB_USERNAME}/" .env || true; fi
if [ -n "${DB_PASSWORD:-}" ]; then sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=${DB_PASSWORD}/" .env || true; fi

php artisan key:generate --force || true
php artisan config:clear || true

php artisan migrate --force

# bad loop fetching
# # Initial fetch
# if php artisan list | grep -q weather:fetch; then
# 	php artisan weather:fetch --once || true
# 	# Background fetch every 10 minutes
# 	( while true; do php artisan weather:fetch --once || true; sleep 600; done ) &
# fi

# Start scheduler as well (no harm if no tasks)
(php artisan schedule:work &) >/dev/null 2>&1 || true

php artisan serve --host=0.0.0.0 --port=8000 