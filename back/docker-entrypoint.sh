#!/bin/sh
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"

echo "⏳ Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."

while ! nc -z "$DB_HOST" "$DB_PORT"; do
  echo "  ...waiting"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "🚀 Starting application..."
exec node dist/src/main.js
