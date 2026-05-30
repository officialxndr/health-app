#!/usr/bin/with-contenv bashio

# Read config from HA options
export DB_PASSWORD=$(bashio::config 'db_password')
export JWT_SECRET=$(bashio::config 'jwt_secret')
export ALLOW_REGISTRATION=$(bashio::config 'allow_registration')
export INVITE_TOKEN=$(bashio::config 'invite_token')
export USDA_API_KEY=$(bashio::config 'usda_api_key')
export DATABASE_URL="postgresql://fitself:${DB_PASSWORD}@localhost:5432/fitself"
export PORT=3001

# Initialize PostgreSQL data directory if fresh
PG_DATA=/data/postgres
if [ ! -d "${PG_DATA}/global" ]; then
  bashio::log.info "Initialising PostgreSQL database..."
  mkdir -p "${PG_DATA}"
  chown -R postgres:postgres "${PG_DATA}"
  su postgres -s /bin/sh -c "initdb -D ${PG_DATA}"
fi

# Start PostgreSQL
bashio::log.info "Starting PostgreSQL..."
su postgres -s /bin/sh -c "pg_ctl -D ${PG_DATA} -l /data/postgres.log start"
sleep 2

# Create DB and user if needed
su postgres -s /bin/sh -c "psql -tc \"SELECT 1 FROM pg_catalog.pg_user WHERE usename='fitself'\" | grep -q 1 || psql -c \"CREATE USER fitself WITH PASSWORD '${DB_PASSWORD}';\"" 2>/dev/null
su postgres -s /bin/sh -c "psql -tc \"SELECT 1 FROM pg_catalog.pg_database WHERE datname='fitself'\" | grep -q 1 || psql -c \"CREATE DATABASE fitself OWNER fitself;\"" 2>/dev/null

# Run migrations
bashio::log.info "Running database migrations..."
cd /app/apps/api
npx prisma migrate deploy

# Start nginx (serves the React web app)
bashio::log.info "Starting web server..."
nginx -g "daemon off;" &

# Start the API
bashio::log.info "Starting FitSelf API on port ${PORT}..."
exec node dist/server.js
