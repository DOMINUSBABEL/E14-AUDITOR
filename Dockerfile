FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN bun install
COPY . .
RUN bun run build

FROM oven/bun:1-alpine
WORKDIR /app
RUN apk add --no-cache nginx

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/http.d/default.conf
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/constants.ts ./
COPY --from=builder /app/types.ts ./
RUN bun install --production

EXPOSE 80 3001

# Start both nginx and the bun backend
CMD nginx && bun run server.ts
