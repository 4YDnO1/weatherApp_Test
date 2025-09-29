FROM php:8.2-fpm-alpine

# System deps
RUN apk add --no-cache bash libzip-dev oniguruma-dev postgresql-dev git unzip curl icu-dev libxml2-dev

# PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql mbstring zip intl xml

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Create Laravel project directly in working directory
RUN composer create-project --prefer-dist laravel/laravel:^10.0 .

# Install additional PHP packages if needed
RUN composer require guzzlehttp/guzzle:^7.0 --no-interaction --prefer-dist

# Copy application code (controllers, models, routes, migrations)
COPY ./app/ ./app/
COPY ./routes/ ./routes/
COPY ./database/ ./database/
COPY ./docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
CMD ["/entrypoint.sh"] 