FROM php:8.3-fpm-alpine AS base

# System deps
RUN apk add --no-cache \
	bash libzip-dev oniguruma-dev postgresql-dev git unzip curl supervisor icu-dev libxml2-dev
	
# PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql mbstring zip intl xml 

# RUN pecl install xdebug \
#     && docker-php-ext-enable xdebug

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

WORKDIR /app/weather_backend
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress  

COPY ./docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 9000

# Install additional PHP packages if needed
# RUN composer require guzzlehttp/guzzle:^7.0 --no-interaction --prefer-dist

CMD ["/entrypoint.sh"]
