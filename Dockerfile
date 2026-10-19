# Alumniskatt: Zettle poller, leaderboard API and the built web app in one Bun process.
#
#   docker build -t alumniskatt .
#   docker run --env-file .env -p 3000:3000 alumniskatt

# ---------- build the web app ----------
FROM oven/bun:1.4.3-alpine AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json vite.config.ts ./
COPY server ./server
COPY web ./web
RUN bun run build

# ---------- runtime ----------
FROM oven/bun:1.4.3-alpine
WORKDIR /app

# The server only uses Bun built-ins, so no node_modules are needed at runtime, and
# it keeps nothing on disk: Zettle is polled for the whole evening every minute.
# tzdata makes TZ work, so EVENT_START's default ("midnight today") is Swedish midnight.
RUN apk add --no-cache tzdata

COPY --from=build /app/server ./server
COPY --from=build /app/web/dist ./web/dist

ENV TZ=Europe/Stockholm \
    PORT=3000

USER bun
EXPOSE 3000

# /health answers 503 if the last Zettle sync is more than three poll intervals old
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
    CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["bun", "run", "server/index.ts"]
