#!/usr/bin/env bash
set -euo pipefail

# Setup environment file

cp -n .env.dev .env 2>/dev/null

# Clear all caches
php artisan optimize:clear

# Update database configuration from environment if needed
while IFS='=' read -r key value; do
	if [[ "$key" == DB_* ]] && grep -q "^$key=" .env.dev; then
		sed -i "s/^$key=.*/$key=$value/" .env
	fi
done 

# Generate application key if not exists
php artisan key:generate --force
php artisan config:clear

php artisan migrate --force
# php artisan storage:link || true

# Set proper permissions for Laravel directories
chmod -R 755 storage bootstrap/cache

# Start scheduler in background (no harm if no tasks)
(php artisan schedule:work &) >/dev/null 2>&1 || true

php artisan serve --host=0.0.0.0 --port=8000 
