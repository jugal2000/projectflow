FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
  git \
  curl \
  zip \
  unzip \
  libpng-dev \
  libonig-dev \
  libxml2-dev \
  libzip-dev \
  && docker-php-ext-install \
  pdo \
  pdo_mysql \
  mbstring \
  exif \
  pcntl \
  bcmath \
  gd \
  zip \
  && pecl install redis \
  && docker-php-ext-enable redis \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

# Install dependencies (with scripts now that all files are present)
RUN composer install --no-dev --optimize-autoloader

EXPOSE 8000

CMD cp -n .env.example .env || true; \
  php artisan key:generate --force; \
  echo "Waiting for MySQL..."; \
  until php artisan migrate --force 2>/dev/null; do \
  echo "MySQL not ready, retrying in 3s..."; \
  sleep 3; \
  done; \
  echo "Migrations done. Seeding database..."; \
  php artisan db:seed --force 2>/dev/null || true; \
  echo "Starting server..."; \
  php artisan serve --host=0.0.0.0 --port=8000