# 🚀 SEPOMEX Crawler

Crawler automatizado para descargar y procesar códigos postales de SEPOMEX (Servicio Postal Mexicano).

## 📋 Características

- ✅ Descarga automática de códigos postales desde SEPOMEX
- ✅ Detección de nuevas versiones
- ✅ Conversión de TXT a JSON optimizado
- ✅ Historial completo de versiones
- ✅ Programación automática (cron)
- ✅ Logs detallados
- ✅ Integración con proyecto Angular
- ✅ **Contenedor Docker incluido**

## 🐳 Inicio Rápido con Docker (Recomendado)

### Opción 1: Script interactivo

```bash
./start.sh
```

El script te guiará por todas las opciones disponibles.

### Opción 2: Makefile

```bash
# Ver todos los comandos
make help

# Construir y ejecutar
make build
make up

# Ver logs
make logs
```

### Opción 3: Docker Compose

```bash
# Construir
docker-compose build

# Iniciar (modo automático)
docker-compose up -d

# Ver logs
docker-compose logs -f
```

📖 **Documentación completa de Docker**: Ver [DOCKER.md](DOCKER.md)

## 💻 Instalación Local (Sin Docker)

```bash
cd /Users/fernandoorozco/Downloads/INE/sepomex-crawler
npm install
```

### Uso local

```bash
npm run check      # Verificar actualizaciones
npm start          # Descargar y procesar
npm run download   # Forzar descarga
npm run cron       # Modo programado
```

📖 **Guía rápida local**: Ver [QUICK_START.md](QUICK_START.md)

## 📁 Estructura del Proyecto

```
sepomex-crawler/
├── 🐳 Docker
│   ├── Dockerfile              # Imagen Docker
│   ├── docker-compose.yml      # Orquestación
│   ├── .dockerignore           # Archivos excluidos
│   ├── Makefile                # Comandos facilitados
│   ├── start.sh                # Script interactivo
│   └── DOCKER.md               # Documentación Docker
│
├── 📝 Código
│   ├── src/
│   │   ├── index.js            # Script principal
│   │   ├── cron.js             # Programador automático
│   │   ├── config.js           # Configuración
│   │   ├── logger.js           # Sistema de logs
│   │   ├── scraper.js          # Web scraper
│   │   ├── processor.js        # Procesador de archivos
│   │   └── version-manager.js  # Gestor de historial
│   │
│   ├── data/
│   │   ├── versions.json       # 📋 HISTORIAL COMPLETO
│   │   ├── last-version.json   # Última versión
│   │   └── *.json              # Archivos procesados
│   │
│   ├── downloads/              # Archivos descargados
│   │   ├── *.zip               # ZIPs de SEPOMEX
│   │   └── *.txt               # TXTs extraídos
│   │
│   └── logs/                   # Logs mensuales
│       └── sepomex-*.log
│
└── 📖 Documentación
    ├── README.md               # Este archivo
    ├── DOCKER.md               # Guía Docker completa
    ├── QUICK_START.md          # Inicio rápido local
    └── .env.example            # Ejemplo configuración
```

## 🔄 Proceso Automático

1. **Verificación**: Consulta página de SEPOMEX
2. **Detección**: Compara versión actual vs última conocida
3. **Descarga**: Descarga ZIP si hay actualización
4. **Extracción**: Extrae TXT del ZIP
5. **Conversión**: Convierte a JSON optimizado (búsqueda O(1))
6. **Historial**: Registra nueva versión
7. **Copia**: Copia archivos al proyecto Angular

## 📊 Historial de Versiones

Ejemplo de `data/versions.json`:

```json
{
  "versions": [
    {
      "version": "20241114",
      "fileDate": "14/11/2024",
      "downloadDate": "2024-11-16T19:45:00.000Z",
      "fileSize": 15728640,
      "recordCount": 155888,
      "postalCodeCount": 32012,
      "fileName": "20241114.txt"
    }
  ],
  "lastUpdated": "2024-11-16T19:45:00.000Z"
}
```

## 📦 Formato de Datos

JSON optimizado para búsqueda O(1):

```json
{
  "06800": {
    "cp": "06800",
    "estado": "Ciudad de México",
    "municipio": "Cuauhtémoc",
    "ciudad": "Ciudad de México",
    "colonias": ["Centro", "Juárez", "Roma Norte"]
  }
}
```

## ⚙️ Configuración

### Docker

Edita `docker-compose.yml`:

```yaml
environment:
  - TZ=America/Mexico_City
  - CRON_SCHEDULE=0 3 * * 1     # Lunes 3AM
  - DOWNLOAD_TIMEOUT=300000     # 5 minutos
```

### Local

Edita `src/config.js`:

```javascript
module.exports = {
  SEPOMEX_URL: 'https://...',
  CRON_SCHEDULE: '0 3 * * 1',
  // ...
};
```

## 🕐 Programación (Cron)

Ejemplos de expresiones cron:

| Expresión | Descripción |
|-----------|-------------|
| `0 3 * * 1` | Lunes 3:00 AM (default) |
| `0 0 * * *` | Diario a medianoche |
| `0 */6 * * *` | Cada 6 horas |
| `0 9 1,15 * *` | Día 1 y 15 a las 9AM |

## 🔗 Integración con Angular

### Automática (configurada)

Los archivos se copian automáticamente a:

```
../frontend/internet/src/assets/
├── YYYYMMDD.txt
└── postal-codes.json
```

### Manual con Docker

```bash
# Copiar desde contenedor
docker cp sepomex-crawler:/app/data/20241114.txt ../frontend/internet/src/assets/
docker cp sepomex-crawler:/app/data/20241114.json ../frontend/internet/src/assets/postal-codes.json
```

## 📝 Comandos Principales

### Con Docker (Makefile)

```bash
make help       # Ver todos los comandos
make build      # Construir imagen
make up         # Iniciar contenedor
make down       # Detener contenedor
make logs       # Ver logs en tiempo real
make shell      # Abrir shell
make check      # Verificar actualizaciones
make download   # Forzar descarga
make stats      # Ver uso de recursos
```

### Con Docker Compose

```bash
docker-compose build              # Construir
docker-compose up -d              # Iniciar
docker-compose down               # Detener
docker-compose logs -f            # Ver logs
docker-compose exec sepomex-crawler /bin/sh  # Shell
```

### Con Docker Exec (alternativa)

```bash
# Forzar descarga manual (sin usar Makefile)
docker exec sepomex-crawler node src/index.js --force-download

# Solo verificar actualizaciones
docker exec sepomex-crawler node src/index.js --check-only
```

**Nota**: Estos comandos ejecutan el crawler directamente dentro del contenedor que ya está corriendo. Son útiles para pruebas manuales o cuando necesitas una descarga inmediata sin esperar al cron programado.

### Local (NPM)

```bash
npm run check      # Solo verificar
npm start          # Descargar y procesar
npm run download   # Forzar descarga
npm run cron       # Modo programado
```

## 📋 Logs

### Ver logs en tiempo real

```bash
# Docker
make logs

# Local
tail -f logs/sepomex-$(date +%Y-%m).log
```

### Formato de logs

```
[2024-11-16T19:45:00.000Z] [INFO] Verificando actualizaciones...
[2024-11-16T19:45:05.000Z] [SUCCESS] Nueva versión detectada: 20241114
[2024-11-16T19:50:00.000Z] [SUCCESS] Conversión completada
```

## 🐛 Solución de Problemas

### Docker no inicia

```bash
# Ver logs de error
docker-compose logs sepomex-crawler

# Verificar permisos
chmod -R 755 data downloads logs
```

### Error de conexión a SEPOMEX

```bash
# Verificar desde el contenedor
make shell
curl -I https://www.correosdemexico.gob.mx/...
```

### Limpiar y reiniciar

```bash
make down
make clean
make rebuild
```

### Ver más troubleshooting

Ver [DOCKER.md](DOCKER.md#-troubleshooting) para soluciones detalladas.

## 🔒 Seguridad

- ✅ Contenedor ejecuta como usuario no-root (uid 1001)
- ✅ Límites de recursos configurados (CPU/RAM)
- ✅ Logs rotados automáticamente
- ✅ Healthcheck cada hora

## 📈 Producción

### Despliegue

```bash
# Iniciar con auto-restart
docker-compose up -d
```

El contenedor se reinicia automáticamente si falla o si el servidor se reinicia.

### Backup

```bash
# Backup de historial
tar -czf sepomex-backup-$(date +%Y%m%d).tar.gz data/

# Restaurar
tar -xzf sepomex-backup-YYYYMMDD.tar.gz
```

## 🛠️ Desarrollo

### Modificar código

```bash
# 1. Editar archivos en src/
# 2. Reconstruir imagen
make rebuild
```

### Testing

```bash
# Ejecutar verificación sin contenedor permanente
docker-compose run --rm sepomex-crawler node src/index.js --check-only
```

## 📚 Documentación

- [README.md](README.md) - Este archivo (overview general)
- [DOCKER.md](DOCKER.md) - Guía completa de Docker
- [QUICK_START.md](QUICK_START.md) - Inicio rápido sin Docker
- [.env.example](.env.example) - Variables de entorno

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT

## 👥 Soporte

Para problemas o preguntas:

1. Revisa [DOCKER.md](DOCKER.md) para Docker
2. Revisa [QUICK_START.md](QUICK_START.md) para uso local
3. Verifica los logs: `make logs` o `cat logs/*.log`

---

**Hecho con ❤️ para automatizar la actualización de códigos postales SEPOMEX**
