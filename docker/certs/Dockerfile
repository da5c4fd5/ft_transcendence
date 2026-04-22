FROM docker.io/library/alpine:3.22

RUN apk add --no-cache openssl

COPY generate.sh /usr/local/bin/generate.sh

CMD ["sh", "/usr/local/bin/generate.sh"]
