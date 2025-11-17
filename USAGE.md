# Guía de Uso - SEPOMEX Crawler

## 📋 Ver Historial de Versiones

El crawler ahora incluye un potente sistema de historial para ver todas las versiones descargadas.

### Comandos de Historial

#### Con Docker (Make)

```bash
# Ver las últimas 5 versiones
make history

# Ver historial completo
make history-all

# Ver solo la última versión
make history-latest

# Comparar las últimas 2 versiones
make history-compare
```

#### Con Docker (directo)

```bash
# Ver las últimas 5 versiones
docker exec sepomex-crawler node src/history.js

# Ver historial completo
docker exec sepomex-crawler node src/history.js all

# Ver solo la última versión
docker exec sepomex-crawler node src/history.js latest

# Comparar las últimas 2 versiones
docker exec sepomex-crawler node src/history.js compare

# Ver últimas N versiones (ejemplo: 10)
docker exec sepomex-crawler node src/history.js 10
```

#### Local (NPM)

```bash
# Ver las últimas 5 versiones
npm run history

# Ver historial completo
npm run history:all

# Ver solo la última versión
npm run history:latest

# Comparar las últimas 2 versiones
npm run history:compare
```

### Ejemplo de Salida

#### Última Versión

```
╔══════════════════════════════════════════════════════════════════════════╗
║ Versión: 20251116                                                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Fecha del archivo:    16/11/2024                                        ║
║ Fecha de descarga:    16/11/2025, 04:09:22 p.m.                         ║
║ Tamaño:               2.03 MB                                           ║
║ Registros:            157,284                                           ║
║ Códigos postales:     31,929                                            ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Archivos:                                                                ║
║   ✅ ZIP:  sepomex-20251116.zip                                        ║
║   ✅ TXT:  20251116.txt                                                ║
║   ✅ JSON: 20251116.json                                               ║
╚══════════════════════════════════════════════════════════════════════════╝
```

#### Historial Completo

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         HISTORIAL DE VERSIONES                           ║
╚══════════════════════════════════════════════════════════════════════════╝

Total de versiones descargadas: 3

┌─────────────────────────────────────────────────────────────────────────┐
│ #003 - Versión: 20251116                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ 📅 Fecha del archivo:    16/11/2024                                 │
│ 📥 Fecha de descarga:    16/11/2025, 04:09:22 p.m.                  │
│ 📦 Tamaño descargado:    2.03 MB                                    │
│ 📊 Registros totales:    157,284                                    │
│ 📮 Códigos postales:     31,929                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ 📁 Archivos disponibles:                                                │
│    ✅ ZIP:  downloads/sepomex-20251116.zip                              │
│    ✅ TXT:  downloads/20251116.txt                                      │
│    ✅ JSON: data/20251116.json                                          │
└─────────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════╗
║                          ESTADÍSTICAS GENERALES                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Total de versiones:              3                                        ║
║ Registros procesados (total):    471,852                                  ║
║ Tamaño total descargado:         6.09 MB                                  ║
║ Promedio códigos postales:       31,929                                   ║
║ Última actualización:            16/11/2025, 04:09:22 p.m.                ║
╚══════════════════════════════════════════════════════════════════════════╝
```

#### Comparación entre Versiones

```
╔══════════════════════════════════════════════════════════════════════════╗
║                      EVOLUCIÓN DE LOS DATOS                              ║
╚══════════════════════════════════════════════════════════════════════════╝

Comparación: 20251109 → 20251116

┌─────────────────────────────────────────────────────────────────────────┐
│ Métrica              │ Anterior      │ Actual        │ Diferencia      │
├─────────────────────────────────────────────────────────────────────────┤
│ Registros            │ 157,100       │ 157,284       │ +184            │
│ Códigos postales     │ 31,900        │ 31,929        │ +29             │
│ Tamaño archivo       │ 2.02 MB       │ 2.03 MB       │ +10 KB          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📁 Organización de Archivos

### Estructura Actual

```
sepomex-crawler/
├── data/                      # JSON procesados
│   ├── 20251116.json         # ← JSON con formato legible (con indentación)
│   ├── versions.json         # Historial completo
│   └── last-version.json     # Última versión conocida
│
├── downloads/                 # Archivos originales
│   ├── sepomex-20251116.zip  # ← ZIP original descargado
│   └── 20251116.txt          # ← TXT extraído del ZIP
│
└── logs/                      # Logs mensuales
    └── sepomex-2025-11.log
```

### Archivos Generados

Por cada versión descargada se generan 3 archivos:

1. **ZIP Original** (`downloads/sepomex-YYYYMMDD.zip`)
   - Archivo descargado directamente de SEPOMEX
   - Se conserva para respaldo

2. **TXT Extraído** (`downloads/YYYYMMDD.txt`)
   - Archivo de texto plano extraído del ZIP
   - Formato delimitado por pipes (|)
   - Encoding: latin1

3. **JSON Procesado** (`data/YYYYMMDD.json`)
   - Formato optimizado para búsqueda O(1)
   - Con indentación para legibilidad
   - Indexado por código postal

### Formato del JSON

El JSON está formateado con indentación (pretty-print) para facilitar su lectura:

```json
{
  "06800": {
    "cp": "06800",
    "estado": "Ciudad de México",
    "municipio": "Cuauhtémoc",
    "ciudad": "Ciudad de México",
    "colonias": [
      "Centro",
      "Juárez",
      "Roma Norte"
    ]
  },
  "64000": {
    "cp": "64000",
    "estado": "Nuevo León",
    "municipio": "Monterrey",
    "ciudad": "Monterrey",
    "colonias": [
      "Centro"
    ]
  }
}
```

## 🔍 Búsqueda de Archivos

### Encontrar Versiones Específicas

```bash
# Listar todos los ZIPs descargados
ls -lh downloads/*.zip

# Listar todos los JSON procesados
ls -lh data/*.json

# Ver contenido del directorio de descargas
docker exec sepomex-crawler ls -lh /app/downloads

# Ver contenido del directorio de datos
docker exec sepomex-crawler ls -lh /app/data
```

### Copiar Archivos del Contenedor

```bash
# Copiar JSON de una versión específica
docker cp sepomex-crawler:/app/data/20251116.json ./20251116.json

# Copiar ZIP original
docker cp sepomex-crawler:/app/downloads/sepomex-20251116.zip ./sepomex-20251116.zip

# Copiar TXT extraído
docker cp sepomex-crawler:/app/downloads/20251116.txt ./20251116.txt

# Copiar el historial completo
docker cp sepomex-crawler:/app/data/versions.json ./versions.json
```

## 📊 Comandos de Gestión

### Ver Estado

```bash
# Ver estado del contenedor
docker ps -a | grep sepomex

# Ver uso de recursos
make stats
# o
docker stats sepomex-crawler --no-stream

# Ver logs en tiempo real
make logs
# o
docker logs -f sepomex-crawler
```

### Descargas Manuales

```bash
# Forzar descarga (aunque no haya actualización)
make download

# Solo verificar si hay actualizaciones (no descarga)
make check
```

### Limpieza

```bash
# Limpiar archivos temporales (mantiene el historial)
make clean

# Ver todos los comandos disponibles
make help
```

## 🔄 Workflow Típico

### 1. Verificar si hay actualizaciones

```bash
make check
```

### 2. Ver la última versión disponible

```bash
make history-latest
```

### 3. Forzar descarga si es necesario

```bash
make download
```

### 4. Ver historial completo

```bash
make history-all
```

### 5. Comparar con versión anterior

```bash
make history-compare
```

### 6. Copiar archivos para usar en tu aplicación

```bash
# Copiar el JSON más reciente
docker cp sepomex-crawler:/app/data/$(docker exec sepomex-crawler cat /app/data/last-version.json | jq -r .version).json ./postal-codes.json
```

## 📈 Monitoreo Automático

El contenedor corre en modo CRON y ejecuta automáticamente:

- **Frecuencia**: Todos los lunes a las 3:00 AM (configurable)
- **Acción**: Verifica actualizaciones y descarga si hay cambios
- **Logs**: Guarda todo en `logs/sepomex-YYYY-MM.log`

### Ver Configuración del Cron

```bash
# Ver la configuración actual
docker exec sepomex-crawler cat /app/src/config.js | grep CRON_SCHEDULE
```

### Cambiar Programación

Edita `docker-compose.yml`:

```yaml
environment:
  - CRON_SCHEDULE=0 0 * * *  # Diario a medianoche
```

Luego reinicia:

```bash
make rebuild
```

## 💡 Tips

1. **Siempre usa `make history-latest`** para ver la versión más reciente antes de copiar archivos

2. **El JSON está formateado** para facilitar su lectura y debug

3. **Los archivos originales (ZIP y TXT) se conservan** en `downloads/` para respaldo

4. **Revisa el historial regularmente** con `make history-all` para ver tendencias

5. **Usa `make history-compare`** para ver qué cambió entre versiones

---

**¿Necesitas más ayuda?** Consulta el [README.md](README.md) principal o usa `make help` para ver todos los comandos disponibles.
