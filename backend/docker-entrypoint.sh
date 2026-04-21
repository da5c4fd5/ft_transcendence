#!/bin/sh
set -eu

read_secret() {
	name="$1"
	file_var="${name}_FILE"
	eval file="\${${file_var}:-}"
	if [ -n "${file}" ]; then
		export "${name}=$(cat "${file}")"
	fi
}

read_secret POSTGRES_PASSWORD
read_secret JWT_SECRET
read_secret MFA_ENCRYPTION_KEY

export POSTGRES_DB="${POSTGRES_DB:-capsul}"
export POSTGRES_USER="${POSTGRES_USER:-capsul}"
export POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
export PGSSLMODE="${PGSSLMODE:-verify-full}"
export PGSSLROOTCERT="${PGSSLROOTCERT:-/run/certs/internal/ca.crt}"

: "${POSTGRES_PASSWORD:?}"
: "${JWT_SECRET:?}"

if [ -z "${DATABASE_URL:-}" ]; then
	export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?sslmode=${PGSSLMODE}&sslrootcert=${PGSSLROOTCERT}"
fi

exec "$@"
