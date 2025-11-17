# 🐳 SEPOMEX Crawler - Docker

Guía completa para ejecutar el crawler en un contenedor Docker.

## 📋 Requisitos Previos

- Docker 20.10+
- Docker Compose 2.0+

## 🚀 Inicio Rápido

### Opción 1: Usando Makefile (Recomendado)

```bash
# Ver todos los comandos disponibles
make help

# Construir y ejecutar
make build
make up

# Ver logs en tiempo real
make logs
```

### Opción 2: Usando Docker Compose

```bash
# Construir la imagen
docker-compose build

# Iniciar el contenedor
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Opción 3: Docker directo

```bash
# Construir
docker build -t sepomex-crawler .

# Ejecutar
docker run -d \
  --name sepomex-crawler \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/downloads:/app/downloads \
  -v $(pwd)/logs:/app/logs \
  sepomex-crawler
```

## 📁 Volúmenes y Persistencia

El contenedor usa **3 volúmenes** para persistir datos:

```yaml
volumes:
  - ./data:/app/data          # Historial de versiones
  - ./downloads:/app/downloads # Archivos descargados
  - ./logs:/app/logs          # Logs del sistema
```

Todos los datos persisten aunque el contenedor se elimine.

## ⚙️ Configuración

### Variables de Entorno

Edita `docker-compose.yml` para personalizar:

```yaml
environment:
  - TZ=America/Mexico_City       # Timezone
  - CRON_SCHEDULE=0 3 * * 1      # Programación (Lunes 3AM)
  - DOWNLOAD_TIMEOUT=300000      # Timeout de descarga (5 min)
```

### Modificar Configuración

```bash
# Opción 1: Editar config.js localmente
vim src/config.js

# Opción 2: Montar config personalizado
# En docker-compose.yml, descomentar:
# - ./src/config.js:/app/src/config.js:ro
```

## 📝 Comandos Útiles

### Usando Makefile

```bash
make build      # Construir imagen
make up         # Iniciar contenedor
make down       # Detener contenedor
make restart    # Reiniciar contenedor
make logs       # Ver logs en tiempo real
make shell      # Abrir shell en el contenedor
make check      # Verificar actualizaciones
make download   # Forzar descarga
make status     # Ver estado del contenedor
make stats      # Ver uso de recursos
make clean      # Limpiar archivos temporales
make rebuild    # Reconstruir completamente
```

### Usando Docker Compose

```bash
# Gestión básica
docker-compose up -d              # Iniciar
docker-compose down               # Detener
docker-compose restart            # Reiniciar
docker-compose logs -f            # Ver logs

# Ejecutar comandos dentro del contenedor
docker-compose exec sepomex-crawler node src/index.js --check-only
docker-compose exec sepomex-crawler node src/index.js --force-download

# Shell interactivo
docker-compose exec sepomex-crawler /bin/sh
```

## 🔍 Monitoreo

### Ver logs en tiempo real

```bash
make logs
# o
docker-compose logs -f sepomex-crawler
```

### Ver logs históricos

```bash
# Logs del contenedor
docker logs sepomex-crawler

# Logs del sistema (en archivo)
cat logs/sepomex-$(date +%Y-%m).log
```

### Verificar estado

```bash
make status
# o
docker ps | grep sepomex
```

### Estadísticas de recursos

```bash
make stats
# o
docker stats sepomex-crawler --no-stream
```

## 🔄 Actualización

### Actualizar el código

```bash
# Detener contenedor
make down

# Actualizar código (git pull, modificaciones, etc.)
# ...

# Reconstruir y reiniciar
make rebuild
```

### Cambiar versión de Node.js

Edita `Dockerfile`:

```dockerfile
FROM node:20-alpine  # Cambiar versión aquí
```

Luego:

```bash
make rebuild
```

## 🛠️ Troubleshooting

### El contenedor no inicia

```bash
# Ver logs de error
docker-compose logs sepomex-crawler

# Verificar que los directorios existen
mkdir -p data downloads logs
```

### Problemas de permisos

```bash
# Dar permisos a los directorios
chmod -R 755 data downloads logs
```

### Limpiar todo y empezar de nuevo

```bash
# Detener y eliminar todo
make down
docker system prune -a -f

# Reconstruir
make build
make up
```

### Verificar conexión a SEPOMEX

```bash
# Dentro del contenedor
make shell

# Luego ejecutar
curl -I https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/CodigoPostal_Exportar.aspx
```

## 📊 Datos Persistentes

### Backup del historial

```bash
# Backup de data/
tar -czf sepomex-data-backup-$(date +%Y%m%d).tar.gz data/

# Restaurar
tar -xzf sepomex-data-backup-YYYYMMDD.tar.gz
```

### Limpiar descargas antiguas

```bash
make clean
# o
rm -rf downloads/*.zip downloads/*.txt
```

### Ver historial de versiones

```bash
# Desde el host
cat data/versions.json | jq .

# Desde el contenedor
make shell
cat /app/data/versions.json
```

## 🔒 Seguridad

El contenedor ejecuta como **usuario no-root** (uid 1001) para mayor seguridad.

```dockerfile
USER sepomex  # Usuario no-root en el contenedor
```

### Límites de recursos

El contenedor tiene límites configurados:

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'      # Máximo 50% de 1 CPU
      memory: 512M     # Máximo 512MB RAM
```

## 🌐 Integración con Angular

Para copiar archivos al proyecto Angular desde el contenedor:

```bash
# Opción 1: Montar el directorio de Angular como volumen
# En docker-compose.yml:
volumes:
  - ../frontend/internet/src/assets:/app/angular-assets

# Opción 2: Copiar manualmente después de la descarga
docker cp sepomex-crawler:/app/data/20241114.txt ../frontend/internet/src/assets/
docker cp sepomex-crawler:/app/data/20241114.json ../frontend/internet/src/assets/postal-codes.json
```

## 📈 Producción

### Ejecutar en producción

```bash
# Usar restart policy para auto-reinicio
docker-compose up -d
```

El contenedor se reiniciará automáticamente si falla o si el servidor se reinicia.

### Logs en producción

```bash
# Rotar logs automáticamente
# Ya configurado en docker-compose.yml:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Healthcheck

El contenedor incluye healthcheck que verifica cada hora:

```dockerfile
HEALTHCHECK --interval=1h --timeout=10s
```

Ver estado:

```bash
docker inspect sepomex-crawler | grep -A 10 Health
```

## 🐛 Debug

### Modo interactivo

```bash
# Ejecutar en modo interactivo (no daemon)
docker-compose up

# Ver todo el output en consola
```

### Ejecutar comando único

```bash
# Solo verificar (no mantener contenedor)
docker run --rm \
  -v $(pwd)/data:/app/data \
  sepomex-crawler \
  node src/index.js --check-only
```

### Inspeccionar contenedor

```bash
# Ver configuración completa
docker inspect sepomex-crawler

# Ver variables de entorno
docker exec sepomex-crawler env

# Ver procesos
docker top sepomex-crawler
```

## 📚 Referencias

- [Dockerfile reference](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose reference](https://docs.docker.com/compose/compose-file/)
- [Node.js Alpine images](https://hub.docker.com/_/node)

---

💡 **Tip**: Usa `make help` para ver todos los comandos disponibles rápidamente.
