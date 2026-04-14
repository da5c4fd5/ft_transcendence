FROM oven/bun:1.2-alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY src ./src

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4242

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["sh", "-lc", "bun --bun run db:generate && bun --bun run db:migrate:prod && bun src/index.ts"]
