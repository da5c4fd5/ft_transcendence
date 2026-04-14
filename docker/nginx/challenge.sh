#!/bin/sh
set -eu

hook="${1:-}"

case "${hook}" in
	deploy_challenge|clean_challenge)
		: "${PDA_API_URL:?}"
		key="$(cat "${PDA_API_KEY_FILE:?}")"
		server="${PDA_SERVER_ID:-localhost}"
		zone="${PDA_ZONE:-${DOMAIN:-}}"
		: "${zone:?}"

		case "${zone}" in
			*.) ;;
			*) zone="${zone}." ;;
		esac

		url="${PDA_API_URL%/}/api/v1/servers/${server}/zones/${zone}"
		shift
		while [ "$#" -ge 3 ]; do
			name="_acme-challenge.${1}"
			case "${name}" in
				*.) ;;
				*) name="${name}." ;;
			esac

			if [ "${hook}" = "deploy_challenge" ]; then
				data="$(jq -nc \
					--arg name "${name}" \
					--arg content "\"${3}\"" \
					'{rrsets:[{name:$name,type:"TXT",ttl:60,changetype:"REPLACE",records:[{content:$content,disabled:false}]}]}')"
				curl -fsS -X PATCH -H 'Content-Type: application/json' -H "X-API-KEY: ${key}" --data "${data}" "${url}"
			else
				data="$(jq -nc \
					--arg name "${name}" \
					'{rrsets:[{name:$name,type:"TXT",changetype:"DELETE"}]}')"
				curl -fsS -X PATCH -H 'Content-Type: application/json' -H "X-API-KEY: ${key}" --data "${data}" "${url}" || true
			fi

			shift 3
		done

		[ "${hook}" != "deploy_challenge" ] || sleep "${DNS_PROPAGATION_SECONDS:-30}"
		;;
	deploy_cert|unchanged_cert|startup_hook|exit_hook|invalid_challenge)
		;;
	*)
		;;
esac
