# MarcheAgents frontend — multi-arch (linux/amd64, linux/arm64) static build.
# In production, Caddy serves `dist/` directly (see blueprint §10.3); this image
# is a self-contained alternative for local demos and CI smoke checks.

# --- Build stage ---
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Serve stage (Caddy, non-root file server) ---
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile.local /etc/caddy/Caddyfile
EXPOSE 8080
# caddy:2-alpine runs as root by default; drop to an unprivileged user.
USER 1000:1000
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
