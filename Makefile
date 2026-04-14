COMPOSE := docker compose -p capsul
PROD := $(COMPOSE)
DEV := $(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml

all: start

start up: generate
	$(PROD) up -d --build

dev: generate
	$(DEV) up --build

generate:
	@sh docker/secrets.sh

stop:
	$(PROD) down --remove-orphans

clean: stop

fclean:
	$(PROD) down --volumes --remove-orphans

restart: stop start

logs:
	$(PROD) logs -f --tail=200

renew: generate
	$(PROD) run --rm nginx /usr/local/bin/acme-dns01.sh --force
	$(PROD) restart nginx

ps:
	$(PROD) ps

.PHONY: all start up dev stop clean fclean restart logs renew ps generate
