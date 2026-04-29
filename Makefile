GPU ?= 1
ROOT_DIR ?= $(HOME)/goinfre/capsul
export ROOT_DIR
GPU_COMPOSE := $(if $(filter 1 true yes,$(GPU)),-f docker-compose.ollama-gpu.yml)
COMPOSE := podman-compose --in-pod=false -p capsul -f docker-compose.yml $(GPU_COMPOSE)
CERT_IMAGE := localhost/capsul_certificate:latest
PROD := $(COMPOSE)
DEV := $(COMPOSE) -f docker-compose.dev.yml

all: start

start up: generate
	@podman rm -f capsul_nginx_1 >/dev/null 2>&1 || true
	$(PROD) up -d --build --remove-orphans
	@container_id="capsul_nginx_1"; \
		healthy=0; \
		for i in $$(seq 1 120); do \
			status="$$(podman container inspect "$${container_id}" --format '{{.State.Health.Status}}' 2>/dev/null || true)"; \
			if test "$${status}" = healthy; then healthy=1; break; fi; \
			test "$$(podman container inspect "$${container_id}" --format '{{.State.Status}}' 2>/dev/null || true)" = running; \
			sleep 2; \
		done; \
		if test "$${healthy}" != 1; then podman logs "$${container_id}"; exit 1; fi; \
		tls_mode="$$(podman inspect "$${container_id}" --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^TLS_MODE=' | cut -d= -f2-)"; \
		if test "$${tls_mode}" = letsencrypt; then \
			if podman exec "$${container_id}" /usr/local/bin/validate-public-cert.sh >/dev/null 2>&1; then \
				printf '%s\n' "TLS: Let's Encrypt certificate active."; \
			else \
				printf '%s\n' 'TLS: WARNING: nginx is running with fallback/self-signed certificate.'; \
			fi; \
		fi

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
	podman build -t $(CERT_IMAGE) docker/certs
	@env_file_arg=""; \
		test ! -f .env || env_file_arg="--env-file .env"; \
		podman rm -f capsul_certificate_generate >/dev/null 2>&1 || true; \
		podman run --rm \
			--name capsul_certificate_generate \
			$${env_file_arg} \
			-v "$(ROOT_DIR)"/certs:/certs:z \
			$(CERT_IMAGE)

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

cert-status:
	@container_id="capsul_nginx_1"; \
		if ! podman container inspect "$${container_id}" >/dev/null 2>&1; then \
			printf '%s\n' 'nginx: not found'; exit 1; \
		fi; \
		podman inspect "$${container_id}" --format 'nginx: {{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}'; \
		podman exec "$${container_id}" sh -lc 'cert_dir="/etc/nginx/certs/public/certs/$${DOMAIN}"; cert="$${cert_dir}/fullchain.pem"; key="$${cert_dir}/privkey.pem"; test -s "$${cert}" || { echo "certificate: missing"; exit 1; }; openssl x509 -in "$${cert}" -noout -issuer -subject -dates; if command -v /usr/local/bin/validate-public-cert.sh >/dev/null 2>&1 && /usr/local/bin/validate-public-cert.sh >/dev/null 2>&1; then echo "certificate_status=public_ca"; elif test -e "$${cert_dir}/.selfsigned"; then echo "certificate_status=selfsigned_fallback"; else test -s "$${key}" && openssl x509 -in "$${cert}" -noout -checkend 0 >/dev/null 2>&1 && openssl x509 -in "$${cert}" -noout -checkhost "$${DOMAIN}" >/dev/null 2>&1 && echo "certificate_status=public_ca_unverified_by_helper" || { echo "certificate_status=invalid"; exit 1; }; fi'

.PHONY: all start up seed dev stop clean fclean restart logs ps cert-status generate
