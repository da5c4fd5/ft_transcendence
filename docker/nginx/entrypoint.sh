#!/bin/sh
set -eu

DOMAIN="${DOMAIN:-transcen.dence.fr}"
export DOMAIN

has_public_selfsigned() {
	[ -f "${cert_dir}/fullchain.pem" ] && [ -f "${cert_dir}/privkey.pem" ] && [ -f "${cert_dir}/.selfsigned" ]
}

make_public_selfsigned() {
	mkdir -p "${cert_dir}"
	rm -f "${cert_dir}/fullchain.pem" "${cert_dir}/privkey.pem" "${cert_dir}/cert.pem"
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
	chmod 600 "${cert_dir}/privkey.pem"
	chmod 644 "${cert_dir}/fullchain.pem" "${cert_dir}/cert.pem"
}

cert_dir="/etc/nginx/certs/public/certs/${DOMAIN}"
if ! has_public_selfsigned; then
	make_public_selfsigned
fi

envsubst '${DOMAIN} ${HTTPS_PORT}' \
		< /etc/nginx/templates/capsul.conf.template \
	> /etc/nginx/conf.d/default.conf

exec "$@"
