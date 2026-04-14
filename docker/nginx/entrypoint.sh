#!/bin/sh
set -eu

DOMAIN="${DOMAIN:-transcen.dence.fr}"
export DOMAIN

is_prod_tls() {
	[ "${PROD:-false}" = "true" ] || [ "${TLS_MODE:-selfsigned}" = "letsencrypt" ]
}

if [ "${1:-}" = "/usr/local/bin/acme-dns01.sh" ]; then
	exec "$@"
fi

if is_prod_tls; then
	/usr/local/bin/acme-dns01.sh
fi

cert_dir="/etc/nginx/certs/public/certs/${DOMAIN}"
if [ ! -f "${cert_dir}/fullchain.pem" ] || [ ! -f "${cert_dir}/privkey.pem" ]; then
	is_prod_tls && exit 1
	mkdir -p "${cert_dir}"
	openssl req \
		-x509 \
		-newkey rsa:2048 \
		-nodes \
		-days 120 \
		-keyout "${cert_dir}/privkey.pem" \
		-out "${cert_dir}/fullchain.pem" \
		-subj "/CN=${DOMAIN}" \
		-addext "subjectAltName=DNS:${DOMAIN},DNS:localhost,IP:127.0.0.1" \
		2>/dev/null
	cp "${cert_dir}/fullchain.pem" "${cert_dir}/cert.pem"
	touch "${cert_dir}/.selfsigned"
fi

envsubst '${DOMAIN}' \
		< /etc/nginx/templates/capsul.conf.template \
	> /etc/nginx/conf.d/default.conf

exec "$@"
