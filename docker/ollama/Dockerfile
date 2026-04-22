FROM docker.io/ollama/ollama:latest

COPY entrypoint.sh /usr/local/bin/ollama-entrypoint.sh

RUN chmod +x /usr/local/bin/ollama-entrypoint.sh

EXPOSE 11434

ENTRYPOINT ["/usr/local/bin/ollama-entrypoint.sh"]
