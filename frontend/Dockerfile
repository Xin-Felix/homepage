FROM node:24.22.0-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

FROM node:24.22.0-alpine
ENV NODE_ENV=production PORT=3000
RUN addgroup -g 10001 app && adduser -D -u 10001 -G app app
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY views ./views
COPY public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=4s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/readyz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
