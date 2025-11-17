# ✅ SEPOMEX Crawler - Dockerizado Completamente

## 🎉 ¡Instalación Docker Completada!

El proyecto SEPOMEX Crawler ahora está **100% dockerizado** y listo para usar.

## 📦 Archivos Docker Creados

```
sepomex-crawler/
├── Dockerfile                    # Imagen Docker optimizada
├── docker-compose.yml            # Orquestación completa
├── .dockerignore                 # Exclusiones de build
├── Makefile                      # Comandos facilitados
├── start.sh                      # Script interactivo
├── DOCKER.md                     # Documentación completa
└── .github/workflows/            # CI/CD con GitHub Actions
    └── docker-build.yml
```

## 🚀 Inicio Inmediato

### Opción 1: Script Interactivo (Más Fácil)

```bash
cd /Users/fernandoorozco/Downloads/INE/sepomex-crawler
./start.sh
```

El script te mostrará un menú con todas las opciones.

### Opción 2: Comandos Directos

```bash
# Construir imagen
make build

# Iniciar crawler automático
make up

# Ver logs en tiempo real
make logs

# Ver todos los comandos
make help
```

## 🎯 Características Docker

### ✅ Optimizaciones

- **Imagen base**: Node.js 20 Alpine (ligera)
- **Multi-stage**: No, single stage optimizado
- **Tamaño**: ~150-200 MB
- **Usuario no-root**: Seguridad mejorada (uid 1001)
- **Timezone**: America/Mexico_City
- **Healthcheck**: Cada hora
- **Auto-restart**: Configurado

### ✅ Volúmenes Persistentes

```yaml
volumes:
  - ./data:/app/data          # Historial y versiones
  - ./downloads:/app/downloads # Archivos descargados
  - ./logs:/app/logs          # Logs mensuales
```

### ✅ Recursos Limitados

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'      # 50% de 1 CPU
      memory: 512M     # 512 MB RAM máximo
```

### ✅ Logging Rotado

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"    # Máximo 10MB por archivo
    max-file: "3"      # Mantener 3 archivos
```

## 📝 Comandos Makefile

| Comando | Descripción |
|---------|-------------|
| `make help` | Muestra todos los comandos disponibles |
| `make build` | Construye la imagen Docker |
| `make up` | Inicia el contenedor en background |
| `make down` | Detiene y elimina el contenedor |
| `make restart` | Reinicia el contenedor |
| `make logs` | Muestra logs en tiempo real |
| `make shell` | Abre shell dentro del contenedor |
| `make check` | Verifica actualizaciones (manual) |
| `make download` | Fuerza descarga (manual) |
| `make status` | Muestra estado del contenedor |
| `make stats` | Muestra uso de recursos |
| `make clean` | Limpia archivos temporales |
| `make rebuild` | Reconstruye completamente |

## 🔄 Flujo de Trabajo

### Modo Automático (Recomendado)

```bash
make build
make up
```

El crawler se ejecutará **automáticamente todos los lunes a las 3:00 AM**.

### Ejecución Manual

```bash
# Solo verificar si hay actualizaciones
make check

# Forzar descarga inmediata
make download
```

### Ver Progreso

```bash
# Logs en tiempo real
make logs

# Estado del contenedor
make status

# Uso de recursos
make stats
```

## 📊 Verificar Historial

```bash
# Ver historial de versiones
cat data/versions.json

# Ver última versión
cat data/last-version.json

# Ver logs del mes actual
cat logs/sepomex-$(date +%Y-%m).log
```

## 🔧 Personalización

### Cambiar Programación

Edita `docker-compose.yml`:

```yaml
environment:
  - CRON_SCHEDULE=0 0 * * *  # Cambiar a diario medianoche
```

Luego:

```bash
make rebuild
```

### Modificar Código

```bash
# 1. Editar archivos en src/
vim src/config.js

# 2. Reconstruir
make rebuild
```

## 🐛 Troubleshooting Rápido

### Contenedor no inicia

```bash
make logs
```

### Error de permisos

```bash
chmod -R 755 data downloads logs
make rebuild
```

### Limpiar todo

```bash
make down
make clean
docker system prune -f
make build
make up
```

## 📖 Documentación Completa

- **General**: [README.md](README.md)
- **Docker**: [DOCKER.md](DOCKER.md) ⭐
- **Local**: [QUICK_START.md](QUICK_START.md)

## 🌟 Ventajas de Docker

1. ✅ **Portabilidad**: Funciona en cualquier sistema con Docker
2. ✅ **Aislamiento**: No contamina el sistema host
3. ✅ **Consistencia**: Mismo comportamiento en dev/prod
4. ✅ **Fácil deploy**: Un solo comando para iniciar
5. ✅ **Auto-recuperación**: Se reinicia si falla
6. ✅ **Recursos limitados**: No consume todo el sistema
7. ✅ **Logs centralizados**: Fácil monitoreo
8. ✅ **Backups simples**: Solo respaldar data/

## 🎯 Próximos Pasos

1. ✅ Ejecuta `./start.sh` para empezar
2. ✅ Selecciona opción 1 (modo automático)
3. ✅ Espera al lunes 3AM o fuerza descarga con opción 3
4. ✅ Verifica el historial con opción 5

## 💡 Tips

- Usa `make help` para recordar comandos
- Ejecuta `make logs` regularmente para monitorear
- Haz backup de `data/` periódicamente
- Lee [DOCKER.md](DOCKER.md) para configuración avanzada

---

**¡Todo listo para usar! 🚀**

Para iniciar ahora mismo:

```bash
./start.sh
```

O:

```bash
make build && make up && make logs
```
