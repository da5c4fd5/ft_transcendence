GPU_COMPOSE := $(if $(filter 1 true yes,$(GPU)),-f docker-compose.ollama-gpu.yml)
COMPOSE := podman-compose --in-pod=false -p capsul -f docker-compose.yml $(GPU_COMPOSE)
PROD := $(COMPOSE)
DEV := $(COMPOSE) -f docker-compose.dev.yml
DATA_ROOT := $${ROOT_DIR:-./.capsul}

all: start

start up: generate
	$(PROD) up -d --build

seed: start
	$(PROD) run --rm backend sh -lc 'bun --bun run db:generate && bun --bun run db:seed'

dev: generate
	$(DEV) up --build

generate:
	@mkdir -p "$(DATA_ROOT)"/certs
	@mkdir -p "$(DATA_ROOT)"/database
	@mkdir -p "$(DATA_ROOT)"/media
	@mkdir -p "$(DATA_ROOT)"/ollama
	@mkdir -p "$(DATA_ROOT)"/mood-classifier
	@sh docker/secrets.sh

stop:
	$(PROD) down --remove-orphans

clean: stop

fclean:
	$(PROD) down --volumes --remove-orphans
	podman image prune -a -f
	podman builder prune -a -f
	podman volume prune -f
	podman network prune -f
	podman system prune -a -f --volumes

restart: stop start

logs:
	$(PROD) logs -f --tail=200

renew: generate
	$(PROD) run --rm nginx /usr/local/bin/acme-dns01.sh --force
	$(PROD) restart nginx

ps:
	$(PROD) ps

.PHONY: all start up seed dev stop clean fclean restart logs renew ps generate
