#!/bin/sh
set -eu

mkdir -p docker/secrets
umask 077
[ -f docker/secrets/postgres_password ] || openssl rand -hex 32 > docker/secrets/postgres_password
[ -f docker/secrets/jwt_secret ] || openssl rand -hex 48 > docker/secrets/jwt_secret
[ -f docker/secrets/mfa_encryption_key ] || openssl rand -hex 48 > docker/secrets/mfa_encryption_key
[ -f docker/secrets/powerdnsadmin_api_key ] || : > docker/secrets/powerdnsadmin_api_key
