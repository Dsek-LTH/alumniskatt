# Alumniskatt: Zettle poller, leaderboard API and the built web app in one Bun process.
#
#   docker build -t alumniskatt .
#   docker run --env-file .env -p 3000:3000 alumniskatt

# Debian-based images rather than Alpine: on D-sek's OKD, Alpine's resolver (musl) fails
# to look up registry.npmjs.org because of the cluster's DNS search domains, while
# glibc's works. The slim image also already has the time zone data TZ needs.

# ---------- build the web app ----------
FROM oven/bun:1.4.3-slim AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json vite.config.ts ./
COPY server ./server
COPY web ./web
RUN bun run build

# ---------- runtime ----------
FROM oven/bun:1.4.3-slim
WORKDIR /app

# The server only uses Bun built-ins, so no node_modules are needed at runtime, and
# it keeps nothing on disk: Zettle is polled for the whole evening every minute.

COPY --from=build /app/server ./server
COPY --from=build /app/web/dist ./web/dist

# Time zone data is in the image, so EVENT_START's default ("midnight today") is Swedish midnight
ENV TZ=Europe/Stockholm \
    PORT=3000

USER bun
EXPOSE 3000

# /health answers 503 if the last Zettle sync is more than three poll intervals old
# (the slim image has no wget or curl, so Bun makes the request)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
    CMD ["bun", "-e", "const r = await fetch('http://localhost:3000/health'); process.exit(r.ok ? 0 : 1)"]

CMD ["bun", "run", "server/index.ts"]
