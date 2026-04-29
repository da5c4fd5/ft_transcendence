GPU ?= 1
ROOT_DIR ?= $(HOME)/goinfre/capsul
export ROOT_DIR
GPU_COMPOSE := $(if $(filter 1 true yes,$(GPU)),-f docker-compose.ollama-gpu.yml)
COMPOSE := podman-compose --in-pod=false -p capsul -f docker-compose.yml $(GPU_COMPOSE)
PROD := $(COMPOSE)
DEV := $(COMPOSE) -f docker-compose.dev.yml

all: start

start up: generate
	$(PROD) up -d --build
	@container_id="capsul_nginx_1"; \
		for i in $$(seq 1 120); do \
			status="$$(podman container inspect "$${container_id}" --format '{{.State.Health.Status}}' 2>/dev/null || true)"; \
			test "$${status}" != healthy || exit 0; \
			test "$$(podman container inspect "$${container_id}" --format '{{.State.Status}}' 2>/dev/null || true)" = running; \
			sleep 2; \
		done; \
		podman logs "$${container_id}"; \
		exit 1

seed: start
	$(PROD) run --rm backend sh -lc 'bun --bun run db:generate && bun --bun run db:seed'

dev: generate
	$(DEV) up --build

generate:
	@mkdir -p "$(ROOT_DIR)"/certs
	@mkdir -p "$(ROOT_DIR)"/database
	@mkdir -p "$(ROOT_DIR)"/media
	@mkdir -p "$(ROOT_DIR)"/ollama
	@mkdir -p "$(ROOT_DIR)"/mood-classifier
	@sh docker/secrets.sh

stop:
	$(PROD) down --remove-orphans

clean: stop

fclean:
	@$(PROD) down --volumes --remove-orphans >/dev/null 2>&1 || true
	@podman system reset -f >/dev/null 2>&1 || true
	@test -n "$(ROOT_DIR)" && test "$(ROOT_DIR)" != "/"
	@if test -e "$(ROOT_DIR)"; then \
		podman unshare rm -rf "$(ROOT_DIR)" || \
		{ chmod -R u+rwX "$(ROOT_DIR)" 2>/dev/null || true; rm -rf "$(ROOT_DIR)"; }; \
	fi

restart: stop start

logs:
	$(PROD) logs -f --tail=200

ps:
	$(PROD) ps

.PHONY: all start up seed dev stop clean fclean restart logs ps generate
