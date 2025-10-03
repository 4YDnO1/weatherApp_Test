#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
    cp -n .env.docker .env 2>/dev/null || cp -n .env.example .env 2>/dev/null || true
fi

php artisan optimize:clear

while IFS='=' read -r key value; do
	if [[ "$key" == DB_* ]] && grep -q "^$key=" .env; then
		sed -i "s/^$key=.*/$key=$value/" .env
	fi
done 

php artisan key:generate --force
php artisan config:clear
php artisan migrate --force
chmod -R 777 storage bootstrap/cache
mkdir -p storage/logs
touch storage/logs/laravel.log
chmod 666 storage/logs/laravel.log

# Start scheduler as well (no harm if no tasks)
(php artisan schedule:work &) >/dev/null 2>&1 || true
echo "ready"
php-fpm