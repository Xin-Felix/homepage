FROM node:24.22.0-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run typecheck && npm run build

FROM node:24.22.0-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    NITRO_PORT=3000 \
    NITRO_HOST=0.0.0.0

# OG 图片依赖 Noto CJK；固定 UID/GID 并以非 root 用户运行。
RUN apk add --no-cache font-noto-cjk \
    && addgroup -g 10001 app \
    && adduser -D -u 10001 -G app app

WORKDIR /app
COPY --from=build --chown=10001:10001 /app/.output ./.output
# 双保险复制 Resvg 及当前 Alpine 架构的可选二进制，避免原生依赖被 trace 遗漏。
COPY --from=build --chown=10001:10001 /app/node_modules/@resvg ./node_modules/@resvg

USER app
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=4s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/readyz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", ".output/server/index.mjs"]
