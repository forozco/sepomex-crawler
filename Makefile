# Makefile para facilitar comandos de Docker

.PHONY: help build up down restart logs shell check download clean prune history history-all history-latest history-compare

# Variables
COMPOSE=docker-compose
CONTAINER=sepomex-crawler

help: ## Muestra esta ayuda
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Construye la imagen Docker
	$(COMPOSE) build

up: ## Inicia el contenedor en background
	$(COMPOSE) up -d

down: ## Detiene y elimina el contenedor
	$(COMPOSE) down

restart: ## Reinicia el contenedor
	$(COMPOSE) restart

logs: ## Muestra los logs del contenedor
	$(COMPOSE) logs -f

shell: ## Abre una shell dentro del contenedor
	docker exec -it $(CONTAINER) /bin/sh

check: ## Ejecuta verificación manual (solo check, no descarga)
	docker exec $(CONTAINER) node src/index.js --check-only

download: ## Fuerza descarga manual
	docker exec $(CONTAINER) node src/index.js --force-download

status: ## Muestra el estado del contenedor
	docker ps -a | grep $(CONTAINER)

clean: ## Limpia archivos temporales (downloads y logs)
	rm -rf downloads/*.zip downloads/*.txt logs/*.log

prune: ## Limpia imágenes Docker sin usar
	docker system prune -f

rebuild: down build up ## Reconstruye y reinicia el contenedor

stats: ## Muestra estadísticas de uso de recursos
	docker stats $(CONTAINER) --no-stream

history: ## Muestra historial de versiones (últimas 5)
	docker exec $(CONTAINER) node src/history.js

history-all: ## Muestra historial completo de todas las versiones
	docker exec $(CONTAINER) node src/history.js all

history-latest: ## Muestra solo la última versión descargada
	docker exec $(CONTAINER) node src/history.js latest

history-compare: ## Compara las últimas 2 versiones
	docker exec $(CONTAINER) node src/history.js compare
