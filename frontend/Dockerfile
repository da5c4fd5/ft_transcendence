FROM oven/bun:1.2-alpine AS deps

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS dev

COPY . .

ARG DOMAIN
ARG HTTPS_PORT
ENV DOMAIN=${DOMAIN}
ENV HTTPS_PORT=${HTTPS_PORT}

EXPOSE 6767

CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0", "--port", "6767"]

FROM deps AS build

COPY . .

ARG DOMAIN
ARG HTTPS_PORT
ENV DOMAIN=${DOMAIN}
ENV HTTPS_PORT=${HTTPS_PORT}

RUN bun run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 6767
