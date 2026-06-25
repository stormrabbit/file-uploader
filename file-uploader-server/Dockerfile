# ---- builder ----
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com/

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npx prisma generate && npm run build

# ---- runner ----
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com/

# Alpine 默认不含 OpenSSL，Prisma engine 依赖此库
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# 在 runner 容器内重新生成 Prisma client，确保使用正确的 linux-musl-openssl-3.0.x engine
RUN npx prisma generate

COPY entrypoint.sh ./

EXPOSE 38902

ENTRYPOINT ["sh", "entrypoint.sh"]
