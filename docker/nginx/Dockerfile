FROM nginx:1.27-alpine

RUN apk add --no-cache bash bind-tools curl gettext jq openssl \
	&& curl -fsSL \
		https://raw.githubusercontent.com/dehydrated-io/dehydrated/master/dehydrated \
		-o /usr/local/bin/dehydrated \
	&& chmod +x /usr/local/bin/dehydrated

COPY nginx.conf.template /etc/nginx/templates/capsul.conf.template
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
COPY acme-dns01.sh /usr/local/bin/acme-dns01.sh
COPY challenge.sh /usr/local/bin/challenge.sh

RUN chmod +x \
	/usr/local/bin/entrypoint.sh \
	/usr/local/bin/acme-dns01.sh \
	/usr/local/bin/challenge.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
