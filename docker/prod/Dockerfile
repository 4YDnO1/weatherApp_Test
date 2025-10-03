# single file for one app docker image
FROM php:8.3-fpm-alpine AS php

# System deps
RUN apk add --no-cache \
    bash \
    git \
    unzip \
    curl 
RUN apk add --no-cache \
    icu-dev \
    libxml2-dev \
    libzip-dev \
    oniguruma-dev \
    postgresql-dev 
	
# PHP extensions
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    mbstring \
    zip \
    intl \
    xml 

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

WORKDIR /app/weather_backend
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress  

COPY docker/entrypoint.prod.sh /entrypoint.prod.sh
RUN chmod +x /entrypoint.prod.sh

EXPOSE 9000

# Install additional PHP packages if needed
# RUN composer require guzzlehttp/guzzle:^7.0 --no-interaction --prefer-dist

CMD ["/entrypoint.sh"]
