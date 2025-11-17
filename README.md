# SEPOMEX Crawler - Microservicio API REST

Microservicio con API REST para descargar, procesar y consultar códigos postales de SEPOMEX (Servicio Postal Mexicano).

## Características

- **API REST** para consultas en tiempo real (Puerto 9000)
- **Descarga automática** de códigos postales desde SEPOMEX
- **Detección inteligente** de nuevas versiones
- **Conversión optimizada** de TXT a JSON (búsqueda O(1))
- **Historial completo** de versiones descargadas
- **Programación automática** con cron (Lunes 3:00 AM)
- **Health checks** para Kubernetes (liveness/readiness)
- **Métricas Prometheus** para monitoreo
- **Logs profesionales** sin emojis
- **Contenedor Docker** listo para producción
- **Lightweight**: ~20MB RAM usage
- **Datos**: 157,284+ registros, 31,929+ códigos postales

## Tabla de Contenidos

- [API REST](#api-rest)
- [Inicio Rápido](#inicio-rápido-con-docker)
- [Arquitectura](#arquitectura)
- [Endpoints Disponibles](#endpoints-de-la-api)
- [Comandos Principales](#comandos-principales)
- [Historial de Versiones](#historial-de-versiones)
- [Configuración](#configuración)
- [Kubernetes](#kubernetes)
- [Desarrollo](#desarrollo)

---

## API REST

El servicio expone una API REST completa en el **puerto 9000** para consultas en tiempo real.

**Documentación completa:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

### Endpoints Principales

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/postal-codes/:code` | GET | Consultar código postal específico |
| `/api/postal-codes/search` | GET | Buscar por estado, ciudad, municipio, colonia |
| `/api/postal-codes` | GET | Listar todos los códigos postales (paginado) |
| `/health` | GET | Health check completo con métricas del sistema |
| `/healthz` | GET | Liveness probe para Kubernetes |
| `/ready` | GET | Readiness probe para Kubernetes |
| `/metrics` | GET | Métricas Prometheus |
| `/api/versions/latest` | GET | Información de la versión actual |
| `/api/versions` | GET | Historial de todas las versiones |

### Ejemplos de Uso

```bash
# Consultar código postal específico
curl http://localhost:9000/api/postal-codes/06600

# Buscar todos los códigos postales de Jalisco (limitado a 10)
curl "http://localhost:9000/api/postal-codes/search?state=Jalisco&limit=10"

# Buscar por ciudad
curl "http://localhost:9000/api/postal-codes/search?city=Guadalajara"

# Buscar por colonia
curl "http://localhost:9000/api/postal-codes/search?colony=Roma&limit=5"

# Health check completo
curl http://localhost:9000/health

# Métricas Prometheus
curl http://localhost:9000/metrics

# Información de la API
curl http://localhost:9000/api
```

**Respuesta ejemplo:**
```json
{
  "cp": "06600",
  "estado": "Ciudad de México",
  "municipio": "Cuauhtémoc",
  "ciudad": "Ciudad de México",
  "colonias": ["Juárez"]
}
```

---

## Inicio Rápido con Docker

### Opción 1: Makefile (Recomendado)

```bash
# Ver todos los comandos disponibles
make help

# Construir y ejecutar
make rebuild

# Ver logs en tiempo real
make logs

# Verificar estado
curl http://localhost:9000/health
```

### Opción 2: Docker Compose

```bash
# Construir la imagen
docker-compose build

# Iniciar el servicio
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

### Opción 3: Script Interactivo

```bash
./start.sh
```

El script te guiará por todas las opciones disponibles.

---

## Arquitectura

```
┌─────────────────────────────────────────┐
│     SEPOMEX Microservice (Puerto 9000)  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐    ┌────────────────┐ │
│  │  API Server │    │ Cron Scheduler │ │
│  │  (Express)  │    │  (node-cron)   │ │
│  └──────┬──────┘    └────────┬───────┘ │
│         │                    │         │
│         │  ┌─────────────────┘         │
│         │  │                           │
│  ┌──────▼──▼──────┐                    │
│  │  Data Services │                    │
│  │  - Postal Code │                    │
│  │  - Versions    │                    │
│  │  - Health      │                    │
│  └────────┬───────┘                    │
│           │                            │
│  ┌────────▼───────┐                    │
│  │ In-Memory Cache│                    │
│  │   (31k+ CPs)   │                    │
│  └────────────────┘                    │
│                                         │
└─────────────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │ Persistent   │
    │ Volume       │
    │ - data/      │
    │ - downloads/ │
    │ - logs/      │
    └──────────────┘
```

### Componentes Principales

1. **API Server** ([src/api/server.js](src/api/server.js))
   - Express.js con middleware de seguridad (helmet, cors, compression)
   - Prometheus metrics integrados
   - Health checks para Kubernetes
   - Manejo centralizado de errores

2. **Cron Scheduler** ([src/cron.js](src/cron.js))
   - Ejecución automática todos los lunes a las 3:00 AM
   - Zona horaria: America/Mexico_City
   - Auto-reload del API cuando hay nuevas versiones

3. **Data Services** ([src/api/services/](src/api/services/))
   - `postal-code-service.js` - Búsqueda en caché in-memory (O(1))
   - `version-service.js` - Gestión de versiones
   - `health-service.js` - Monitoreo del sistema

4. **Main Orchestrator** ([src/app.js](src/app.js))
   - Coordina API Server + Cron Scheduler
   - Graceful shutdown
   - Notificaciones de nuevas versiones

---

## Estructura del Proyecto

```
sepomex-crawler/
├── src/
│   ├── app.js                    # Orquestador principal (API + Cron)
│   ├── index.js                  # Crawler principal
│   ├── cron.js                   # Programador automático
│   ├── config.js                 # Configuración centralizada
│   ├── logger.js                 # Sistema de logs
│   ├── scraper.js                # Web scraper SEPOMEX
│   ├── processor.js              # Procesador TXT → JSON
│   ├── version-manager.js        # Gestión de historial
│   └── api/
│       ├── server.js             # Express API Server
│       └── services/
│           ├── postal-code-service.js  # Servicio de códigos postales
│           ├── version-service.js      # Servicio de versiones
│           └── health-service.js       # Servicio de health checks
│
├── data/
│   ├── versions.json             # Historial completo de versiones
│   ├── last-version.json         # Última versión descargada
│   └── YYYYMMDD.json             # Archivos JSON procesados
│
├── downloads/
│   ├── sepomex-YYYYMMDD.zip      # ZIPs descargados de SEPOMEX
│   └── YYYYMMDD.txt              # TXTs extraídos
│
├── logs/
│   └── sepomex-YYYY-MM.log       # Logs mensuales
│
├── k8s/                          # Manifiestos Kubernetes
│   ├── configmap.yaml
│   ├── pvc.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── cronjob.yaml
│   └── README.md
│
├── Dockerfile                    # Imagen Docker
├── docker-compose.yml            # Orquestación Docker
├── Makefile                      # Comandos facilitados
├── package.json                  # Dependencias Node.js
├── README.md                     # Este archivo
└── API_DOCUMENTATION.md          # Documentación completa del API
```

---

## Endpoints de la API

### Códigos Postales

#### `GET /api/postal-codes/:code`
Obtiene información de un código postal específico.

**Parámetros:**
- `code` (path) - Código postal de 5 dígitos

**Ejemplo:**
```bash
curl http://localhost:9000/api/postal-codes/44100
```

**Respuesta:**
```json
{
  "cp": "44100",
  "estado": "Jalisco",
  "municipio": "Guadalajara",
  "ciudad": "Guadalajara",
  "colonias": ["Guadalajara Centro"]
}
```

#### `GET /api/postal-codes/search`
Busca códigos postales por criterios.

**Query Parameters:**
- `state` - Filtrar por estado
- `city` - Filtrar por ciudad
- `municipality` - Filtrar por municipio
- `colony` - Filtrar por colonia
- Máximo 100 resultados

**Ejemplo:**
```bash
curl "http://localhost:9000/api/postal-codes/search?state=Jalisco&city=Guadalajara&limit=3"
```

#### `GET /api/postal-codes`
Lista todos los códigos postales con paginación.

**Query Parameters:**
- `limit` (default: 100, max: 1000)
- `offset` (default: 0)

**Ejemplo:**
```bash
curl "http://localhost:9000/api/postal-codes?limit=10&offset=0"
```

### Health & Monitoring

#### `GET /health`
Health check completo con información del sistema.

#### `GET /healthz`
Liveness probe (Kubernetes) - respuesta simple.

#### `GET /ready`
Readiness probe (Kubernetes) - verifica si el servicio está listo.

#### `GET /metrics`
Métricas en formato Prometheus.

### Versiones

#### `GET /api/versions/latest`
Información de la última versión descargada.

#### `GET /api/versions`
Historial completo de versiones.

#### `GET /api/versions/:version`
Información de una versión específica.

---

## Comandos Principales

### Con Makefile (Recomendado)

```bash
make help           # Muestra todos los comandos disponibles
make build          # Construye la imagen Docker
make up             # Inicia el contenedor
make down           # Detiene y elimina el contenedor
make restart        # Reinicia el contenedor
make logs           # Muestra logs en tiempo real
make shell          # Abre shell dentro del contenedor
make check          # Verifica actualizaciones (sin descargar)
make download       # Fuerza descarga inmediata
make status         # Muestra estado del contenedor
make stats          # Muestra uso de recursos
make rebuild        # Reconstruye y reinicia (down + build + up)
make clean          # Limpia archivos temporales
make history        # Muestra historial de versiones (últimas 5)
make history-all    # Muestra historial completo
make history-latest # Muestra solo la última versión
make history-compare# Compara últimas 2 versiones
```

### Con Docker Compose

```bash
docker-compose build                              # Construir imagen
docker-compose up -d                              # Iniciar servicio
docker-compose down                               # Detener servicio
docker-compose logs -f                            # Ver logs
docker-compose exec sepomex-crawler /bin/sh      # Abrir shell
docker-compose restart                            # Reiniciar
```

### Con NPM (Local, sin Docker)

```bash
npm install                    # Instalar dependencias
npm start                      # Iniciar microservicio (API + Cron)
npm run start:api              # Solo API Server
npm run start:crawler          # Solo Crawler (una vez)
npm run cron                   # Solo Cron Scheduler
npm run check                  # Verificar actualizaciones
npm run download               # Forzar descarga
npm run history                # Ver historial
npm run dev                    # Modo desarrollo con nodemon
```

---

## Historial de Versiones

El sistema mantiene un historial completo de todas las versiones descargadas.

### Ver Historial

```bash
# Últimas 5 versiones
make history

# Historial completo
make history-all

# Solo última versión
make history-latest

# Comparar últimas 2 versiones
make history-compare
```

### Formato del Historial (`data/versions.json`)

```json
{
  "versions": [
    {
      "version": "20251117",
      "fileDate": "17/11/2025",
      "downloadDate": "2025-11-17T15:58:36.840Z",
      "fileSize": 2126672,
      "recordCount": 157284,
      "postalCodeCount": 31929,
      "fileName": "20251117.txt"
    }
  ],
  "lastUpdated": "2025-11-17T15:58:37.123Z"
}
```

---

## Configuración

### Variables de Entorno (Docker)

Edita `docker-compose.yml`:

```yaml
environment:
  - TZ=America/Mexico_City        # Zona horaria
  - NODE_ENV=production           # Ambiente
  - PORT=9000                     # Puerto del API
  - CRON_SCHEDULE=0 3 * * 1       # Lunes 3:00 AM
  - DOWNLOAD_TIMEOUT=300000       # Timeout: 5 minutos
```

### Configuración Local

Edita `src/config.js`:

```javascript
module.exports = {
  SEPOMEX_URL: 'https://www.correosdemexico.gob.mx/...',
  CRON_SCHEDULE: '0 3 * * 1',    // Lunes 3:00 AM
  DOWNLOAD_TIMEOUT: 300000,       // 5 minutos
  PORT: 9000,                     // Puerto API
  // ...
};
```

### Programación Cron

| Expresión | Descripción |
|-----------|-------------|
| `0 3 * * 1` | Lunes 3:00 AM (default) |
| `0 0 * * *` | Diario a medianoche |
| `0 */6 * * *` | Cada 6 horas |
| `0 9 1,15 * *` | Día 1 y 15 a las 9:00 AM |
| `0 0 * * 0` | Domingos a medianoche |

---

## Kubernetes

El proyecto incluye manifiestos de Kubernetes listos para producción.

### Archivos Kubernetes

```
k8s/
├── configmap.yaml      # Configuración (CRON_SCHEDULE, PORT, etc.)
├── pvc.yaml           # Persistent Volume Claim (10Gi)
├── deployment.yaml    # Deployment con 2 réplicas
├── service.yaml       # Service tipo LoadBalancer
├── cronjob.yaml       # CronJob para descargas automáticas
└── README.md          # Documentación de despliegue
```

### Desplegar en Kubernetes

```bash
# Crear namespace (opcional)
kubectl create namespace sepomex

# Aplicar manifiestos
kubectl apply -f k8s/

# Verificar despliegue
kubectl get all -n sepomex

# Ver logs
kubectl logs -f deployment/sepomex-crawler -n sepomex

# Escalar réplicas
kubectl scale deployment sepomex-crawler --replicas=3 -n sepomex
```

### Health Checks en Kubernetes

El Deployment incluye:

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 9000
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /ready
    port: 9000
  periodSeconds: 10
```

### Integración con Prometheus

```yaml
# Agregar anotaciones al Deployment
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "9000"
  prometheus.io/path: "/metrics"
```

Ver [k8s/README.md](k8s/README.md) para más detalles.

---

## Formato de Datos

### JSON Optimizado (O(1) Lookup)

Los datos se almacenan con el código postal como clave para búsqueda instantánea:

```json
{
  "06600": {
    "cp": "06600",
    "estado": "Ciudad de México",
    "municipio": "Cuauhtémoc",
    "ciudad": "Ciudad de México",
    "colonias": ["Juárez"]
  },
  "44100": {
    "cp": "44100",
    "estado": "Jalisco",
    "municipio": "Guadalajara",
    "ciudad": "Guadalajara",
    "colonias": ["Guadalajara Centro"]
  }
}
```

### TXT Original (SEPOMEX)

```
d_codigo|d_asenta|d_tipo_asenta|D_mnpio|d_estado|d_ciudad|...
06600|Juárez|Colonia|Cuauhtémoc|Ciudad de México|Ciudad de México|...
```

---

## Desarrollo

### Modificar Código

```bash
# 1. Editar archivos en src/
# 2. Reconstruir imagen
make rebuild

# 3. Verificar cambios
make logs
curl http://localhost:9000/health
```

### Agregar Nuevas Dependencias

```bash
# Instalar localmente
npm install nombre-paquete

# Reconstruir imagen Docker
make rebuild
```

### Testing Manual

```bash
# Ejecutar crawler una sola vez (sin cron)
docker exec sepomex-crawler node src/index.js

# Verificar sin descargar
docker exec sepomex-crawler node src/index.js --check-only

# Forzar descarga
docker exec sepomex-crawler node src/index.js --force-download
```

---

## Monitoreo con Prometheus

### Configurar Prometheus

Agregar a `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'sepomex-api'
    static_configs:
      - targets: ['localhost:9000']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

### Métricas Disponibles

- `http_requests_total` - Total de requests HTTP por método, ruta y status
- `http_request_duration_seconds` - Duración de requests (histograma)
- `postal_code_searches_total` - Total de búsquedas de códigos postales
- `crawler_runs_total` - Total de ejecuciones del crawler
- `process_resident_memory_bytes` - Uso de memoria RAM
- `process_cpu_seconds_total` - Uso de CPU
- `nodejs_*` - Métricas del runtime de Node.js

### Consultar Métricas

```bash
curl http://localhost:9000/metrics
```

---

## Logs

### Ver Logs en Tiempo Real

```bash
# Docker
make logs

# Local
tail -f logs/sepomex-$(date +%Y-%m).log
```

### Formato de Logs

```
[INFO] Iniciando API Server...
[OK] API Server corriendo en puerto 9000
[INFO] Health check: http://localhost:9000/health
[INFO] Metrics: http://localhost:9000/metrics
[OK] Microservicio iniciado completamente
[INFO] GET /health - 200 - 5ms
[INFO] GET /api/postal-codes/06600 - 200 - 2ms
```

**Niveles de log:**
- `[INFO]` - Información general
- `[OK]` - Operación exitosa
- `[WARN]` - Advertencia
- `[ERROR]` - Error

---

## Solución de Problemas

### Puerto 9000 ya está en uso

```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "8000:9000"  # Mapear a puerto 8000 del host

# O cambiar el puerto interno
environment:
  - PORT=8000
```

### API no responde

```bash
# Verificar que el contenedor está corriendo
docker ps | grep sepomex

# Ver logs de error
make logs

# Verificar health
curl http://localhost:9000/healthz
```

### Crawler no descarga

```bash
# Ejecutar manualmente
make download

# Ver logs detallados
make logs

# Verificar conectividad
make shell
curl -I https://www.correosdemexico.gob.mx/...
```

### Limpiar y Reiniciar

```bash
# Detener y limpiar todo
make down
make clean

# Reconstruir desde cero
make rebuild
```

---

## Seguridad

- ✅ Contenedor ejecuta como usuario no-root (UID 1001)
- ✅ Límites de recursos configurados (CPU/RAM)
- ✅ Helmet.js para seguridad HTTP
- ✅ CORS configurado
- ✅ Compresión de respuestas
- ✅ Healthcheck automático cada 30 segundos
- ✅ Logs rotados automáticamente (max 10MB, 3 archivos)

---

## Recursos del Sistema

### Uso de Memoria

- **API Server**: ~20-25 MB
- **Con datos cargados**: ~30-35 MB
- **Máximo configurado**: 512 MB

### Uso de CPU

- **Normal**: < 5%
- **Durante descarga**: ~15-20%
- **Máximo configurado**: 0.5 CPUs

### Disco

- **Imagen Docker**: ~150 MB
- **Datos**: ~10-15 MB por versión
- **Logs**: ~1-2 MB por mes

---

## Integración con Otros Servicios

### Angular / React

```javascript
// Fetch postal code
const response = await fetch('http://localhost:9000/api/postal-codes/06600');
const data = await response.json();
console.log(data);
```

### Python

```python
import requests

response = requests.get('http://localhost:9000/api/postal-codes/06600')
data = response.json()
print(data)
```

### PHP

```php
$response = file_get_contents('http://localhost:9000/api/postal-codes/06600');
$data = json_decode($response, true);
print_r($data);
```

---

## Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

## Soporte

Para problemas o preguntas:

1. **API**: Ver [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
2. **Kubernetes**: Ver [k8s/README.md](k8s/README.md)
3. **Issues**: https://github.com/forozco/sepomex-crawler/issues
4. **Logs**: `make logs` o `cat logs/*.log`

---

## Roadmap

- [ ] WebSocket para notificaciones en tiempo real
- [ ] Message Queue (RabbitMQ/Kafka) para eventos
- [ ] Service Mesh (Istio) para comunicación avanzada
- [ ] GraphQL API
- [ ] OpenAPI/Swagger documentation
- [ ] Tests automatizados
- [ ] CI/CD pipeline

---

**Desarrollado para automatizar la gestión de códigos postales SEPOMEX en México**

**Versión**: 2.0.0 | **Puerto**: 9000 | **Licencia**: MIT
