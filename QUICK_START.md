# 🚀 Guía Rápida - SEPOMEX Crawler

## Instalación Inicial

```bash
cd /Users/fernandoorozco/Downloads/INE/sepomex-crawler
npm install
```

## Uso Básico

### 1️⃣ Primera ejecución (solo verificar)

```bash
npm run check
```

Esto verifica si hay actualizaciones sin descargar nada.

### 2️⃣ Descargar y procesar

```bash
npm start
```

Esto descargará y procesará la versión actual de SEPOMEX.

### 3️⃣ Ver el historial

El historial se muestra automáticamente después de cada descarga, o puedes verlo en:

```bash
cat data/versions.json
```

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run check` | Solo verifica si hay actualizaciones |
| `npm start` | Descarga y procesa nueva versión |
| `npm run download` | Forzar descarga aunque no haya actualización |
| `npm run cron` | Iniciar modo programado (lunes 3AM) |

## Archivos Importantes

- `data/versions.json` - Historial completo de versiones
- `data/last-version.json` - Última versión conocida
- `logs/sepomex-YYYY-MM.log` - Logs del mes actual

## Programación Automática

Para ejecutar automáticamente cada semana:

```bash
npm run cron
```

Esto iniciará un proceso que se ejecutará:
- **Todos los lunes a las 3:00 AM**
- Presiona `Ctrl+C` para detener

### Cambiar la programación

Edita `src/config.js` y modifica `CRON_SCHEDULE`:

```javascript
// Ejemplos:
CRON_SCHEDULE: '0 3 * * 1',      // Lunes 3AM (default)
CRON_SCHEDULE: '0 0 * * *',      // Diario a medianoche
CRON_SCHEDULE: '0 */6 * * *',    // Cada 6 horas
CRON_SCHEDULE: '0 9 1,15 * *',   // Día 1 y 15 de cada mes a las 9AM
```

## Integración con Angular

Los archivos se copian automáticamente a:

```
../frontend/internet/src/assets/
```

Si el proyecto Angular está en otra ubicación, ajusta la ruta en:

```javascript
// src/processor.js línea 101
const angularAssetsPath = path.join(__dirname, '../../../frontend/internet/src/assets');
```

## Estructura de Historial

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

## Solución Rápida de Problemas

### No descarga nada

Usa `--force-download`:
```bash
npm run download
```

### Error de conexión

Verifica que la URL de SEPOMEX esté disponible:
```bash
curl -I https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/CodigoPostal_Exportar.aspx
```

### Ver logs detallados

```bash
tail -f logs/sepomex-$(date +%Y-%m).log
```

## Siguientes Pasos

1. ✅ Ejecuta `npm run check` para verificar
2. ✅ Ejecuta `npm start` para descargar la primera versión
3. ✅ Opcionalmente, ejecuta `npm run cron` para automatizar

¡Listo! 🎉
