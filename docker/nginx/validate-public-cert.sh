#!/bin/sh
set -eu

DOMAIN="${DOMAIN:-transcen.dence.fr}"
cert_dir="/etc/nginx/certs/public/certs/${DOMAIN}"
cert_file="${cert_dir}/fullchain.pem"
key_file="${cert_dir}/privkey.pem"

[ -s "${cert_file}" ]
[ -s "${key_file}" ]
[ ! -e "${cert_dir}/.selfsigned" ]

openssl x509 -in "${cert_file}" -noout -checkend 0 >/dev/null
openssl x509 -in "${cert_file}" -noout -checkhost "${DOMAIN}" >/dev/null

cert_pubkey="$(openssl x509 -in "${cert_file}" -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256)"
key_pubkey="$(openssl pkey -in "${key_file}" -pubout -outform DER | openssl dgst -sha256)"
[ "${cert_pubkey}" = "${key_pubkey}" ]

issuer="$(openssl x509 -in "${cert_file}" -noout -issuer)"
subject="$(openssl x509 -in "${cert_file}" -noout -subject)"
[ "${issuer}" != "${subject}" ]
