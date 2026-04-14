#!/bin/sh
set -eu

DOMAIN="${DOMAIN:-transcen.dence.fr}"
PROD="${PROD:-false}"
TLS_MODE="${TLS_MODE:-selfsigned}"
CERT_ROOT="/certs"
INTERNAL_DIR="${CERT_ROOT}/internal"
PUBLIC_DIR="${CERT_ROOT}/public/certs/${DOMAIN}"

mkdir -p "${INTERNAL_DIR}" "${PUBLIC_DIR}"

make_ca() {
	if [ -f "${INTERNAL_DIR}/ca.crt" ] && [ -f "${INTERNAL_DIR}/ca.key" ]; then
		return
	fi

	openssl req \
		-x509 \
		-newkey rsa:3072 \
		-nodes \
		-days 120 \
		-keyout "${INTERNAL_DIR}/ca.key" \
		-out "${INTERNAL_DIR}/ca.crt" \
		-subj "/CN=TopTopTop Corp" \
		-addext "basicConstraints=critical,CA:TRUE,pathlen:0" \
		-addext "keyUsage=critical,keyCertSign,cRLSign" \
		2>/dev/null
}

make_server_cert() {
	name="$1"
	san="$2"
	key_file="${INTERNAL_DIR}/${name}.key"
	csr_file="${INTERNAL_DIR}/${name}.csr"
	crt_file="${INTERNAL_DIR}/${name}.crt"
	ext_file="${INTERNAL_DIR}/${name}.ext"

	if [ -f "${crt_file}" ] && [ -f "${key_file}" ]; then
		return
	fi

	openssl req \
		-newkey rsa:2048 \
		-nodes \
		-keyout "${key_file}" \
		-out "${csr_file}" \
		-subj "/CN=${name}" \
		2>/dev/null

	cat > "${ext_file}" <<EOF
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=${san}
EOF

	openssl x509 \
		-req \
		-in "${csr_file}" \
		-CA "${INTERNAL_DIR}/ca.crt" \
		-CAkey "${INTERNAL_DIR}/ca.key" \
		-CAcreateserial \
		-out "${crt_file}" \
		-days 120 \
		-sha256 \
		-extfile "${ext_file}" \
		2>/dev/null

	rm -f "${csr_file}" "${ext_file}"
}

make_public_selfsigned() {
	if [ "${PROD}" = "true" ] || [ "${TLS_MODE}" = "letsencrypt" ]; then
		return
	fi

	if [ -f "${PUBLIC_DIR}/fullchain.pem" ] && [ -f "${PUBLIC_DIR}/privkey.pem" ]; then
		return
	fi

	openssl req \
		-x509 \
		-newkey rsa:2048 \
		-nodes \
		-days 120 \
		-keyout "${PUBLIC_DIR}/privkey.pem" \
		-out "${PUBLIC_DIR}/fullchain.pem" \
		-subj "/CN=${DOMAIN}" \
		-addext "subjectAltName=DNS:${DOMAIN},DNS:localhost,IP:127.0.0.1" \
		2>/dev/null
	cp "${PUBLIC_DIR}/fullchain.pem" "${PUBLIC_DIR}/cert.pem"
	touch "${PUBLIC_DIR}/.selfsigned"
}

make_ca
make_server_cert "backend" "DNS:backend,DNS:localhost,IP:127.0.0.1"
make_server_cert "postgres" "DNS:postgres,DNS:localhost,IP:127.0.0.1"
make_public_selfsigned

chmod 644 "${INTERNAL_DIR}/ca.crt" "${INTERNAL_DIR}"/*.crt
chmod 600 "${INTERNAL_DIR}"/*.key
if [ -f "${PUBLIC_DIR}/privkey.pem" ]; then
	chmod 600 "${PUBLIC_DIR}/privkey.pem"
	chmod 644 "${PUBLIC_DIR}/fullchain.pem" "${PUBLIC_DIR}/cert.pem"
fi

chown 70:70 "${INTERNAL_DIR}/postgres.key" "${INTERNAL_DIR}/postgres.crt" || true
chmod 600 "${INTERNAL_DIR}/postgres.key"
