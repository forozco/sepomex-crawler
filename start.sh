#!/bin/bash

# Script de inicio rápido para SEPOMEX Crawler con Docker

set -e

echo "🐳 SEPOMEX Crawler - Inicio con Docker"
echo "======================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker no está instalado${NC}"
    echo "Instala Docker desde: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar si Docker Compose está disponible
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Error: Docker Compose no está instalado${NC}"
    echo "Instala Docker Compose desde: https://docs.docker.com/compose/install/"
    exit 1
fi

# Crear directorios si no existen
echo "📁 Creando directorios..."
mkdir -p data downloads logs

# Verificar si la imagen ya existe
if docker images | grep -q "sepomex-crawler"; then
    echo -e "${GREEN}✅ Imagen Docker encontrada${NC}"
else
    echo "🔨 Construyendo imagen Docker (primera vez)..."
    docker-compose build
fi

# Mostrar menú
echo ""
echo "Selecciona una opción:"
echo "  1) Iniciar en modo automático (cron - lunes 3AM)"
echo "  2) Verificar actualizaciones ahora (solo check)"
echo "  3) Descargar y procesar ahora (forzar)"
echo "  4) Ver logs en tiempo real"
echo "  5) Ver historial de versiones"
echo "  6) Detener contenedor"
echo "  7) Abrir shell en el contenedor"
echo "  0) Salir"
echo ""
read -p "Opción: " option

case $option in
    1)
        echo ""
        echo "🚀 Iniciando crawler en modo automático..."
        docker-compose up -d
        echo ""
        echo -e "${GREEN}✅ Contenedor iniciado${NC}"
        echo "El crawler se ejecutará automáticamente todos los lunes a las 3:00 AM"
        echo ""
        echo "Comandos útiles:"
        echo "  - Ver logs: make logs  o  docker-compose logs -f"
        echo "  - Detener: make down  o  docker-compose down"
        echo "  - Estado: make status"
        ;;
    2)
        echo ""
        echo "🔍 Verificando actualizaciones..."
        docker-compose run --rm sepomex-crawler node src/index.js --check-only
        ;;
    3)
        echo ""
        echo "📥 Descargando y procesando..."
        docker-compose run --rm sepomex-crawler node src/index.js --force-download
        ;;
    4)
        echo ""
        echo "📋 Mostrando logs (Ctrl+C para salir)..."
        docker-compose logs -f sepomex-crawler
        ;;
    5)
        echo ""
        if [ -f "data/versions.json" ]; then
            echo "📊 Historial de versiones:"
            echo ""
            cat data/versions.json | jq . 2>/dev/null || cat data/versions.json
        else
            echo -e "${YELLOW}⚠️  No hay historial todavía${NC}"
        fi
        ;;
    6)
        echo ""
        echo "🛑 Deteniendo contenedor..."
        docker-compose down
        echo -e "${GREEN}✅ Contenedor detenido${NC}"
        ;;
    7)
        echo ""
        echo "🐚 Abriendo shell (escribe 'exit' para salir)..."
        docker-compose exec sepomex-crawler /bin/sh || docker-compose run --rm sepomex-crawler /bin/sh
        ;;
    0)
        echo "👋 Saliendo..."
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Opción inválida${NC}"
        exit 1
        ;;
esac

echo ""
