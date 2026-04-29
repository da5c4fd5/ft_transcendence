FROM docker.io/library/nginx:1.27-alpine

RUN apk add --no-cache gettext openssl

COPY nginx.conf.template /etc/nginx/templates/capsul.conf.template
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
