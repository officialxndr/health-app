ARG BUILD_FROM
FROM $BUILD_FROM

# Install Node.js 20 and PostgreSQL
RUN apk add --no-cache nodejs npm postgresql postgresql-client

WORKDIR /app

# Copy built API
COPY apps/api/package*.json apps/api/tsconfig.json ./apps/api/
COPY apps/api/src ./apps/api/src
COPY apps/api/prisma ./apps/api/prisma

# Copy built web (pre-built dist)
COPY apps/web/dist ./apps/web/dist
COPY apps/web/nginx.conf /etc/nginx/http.d/fitself.conf

RUN apk add --no-cache nginx

# Install API dependencies and build
WORKDIR /app/apps/api
RUN npm ci --omit=dev && \
    npx prisma generate && \
    npm run build

WORKDIR /app

COPY ha-addon-fitself/run.sh /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
