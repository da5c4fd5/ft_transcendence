#!/bin/sh
set -eu

is_prod_tls() {
	[ "${PROD:-false}" = "true" ] || [ "${TLS_MODE:-selfsigned}" = "letsencrypt" ]
}

is_prod_tls || exit 0

: "${DOMAIN:?}"
: "${ACME_CONTACT_EMAIL:?}"
: "${PDA_API_URL:?}"

export DOMAIN
export PDA_API_URL="${PDA_API_URL:-}"
export PDA_SERVER_ID="${PDA_SERVER_ID:-localhost}"
export PDA_ZONE="${PDA_ZONE:-${DOMAIN}}"
export DNS_PROPAGATION_SECONDS="${DNS_PROPAGATION_SECONDS:-30}"

base="/etc/nginx/certs/public"
mkdir -p "${base}"
acme_ca="${ACME_CA:-letsencrypt}"
account_name="$(printf '%s' "${acme_ca}" | tr -c 'A-Za-z0-9_.-' '_')"

cat > "${base}/config" <<EOF
CA="${acme_ca}"
CHALLENGETYPE="dns-01"
BASEDIR="${base}"
DOMAINS_TXT="${base}/domains.txt"
CERTDIR="${base}/certs"
ACCOUNTDIR="${base}/accounts/${account_name}"
CONTACT_EMAIL="${ACME_CONTACT_EMAIL}"
HOOK="/usr/local/bin/challenge.sh"
HOOK_CHAIN="yes"
KEY_ALGO=secp384r1
RENEW_DAYS="30"
EOF

printf '%s\n' "${DOMAIN}" > "${base}/domains.txt"

force_arg=""
[ ! -f "${base}/certs/${DOMAIN}/.selfsigned" ] || force_arg="--force"

dehydrated --register --accept-terms --config "${base}/config"
dehydrated --cron --accept-terms --config "${base}/config" ${force_arg} "$@"
rm -f "${base}/certs/${DOMAIN}/.selfsigned"
