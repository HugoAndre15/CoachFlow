FROM node:20-alpine

RUN apk add --no-cache netcat-openbsd openssl openssl-dev

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm cache clean --force && npm install --legacy-peer-deps

COPY prisma/ ./prisma/

RUN npx prisma generate

COPY src/ ./src/

RUN npm run build

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["docker-entrypoint.sh"]