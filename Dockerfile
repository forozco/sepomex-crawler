# Dockerfile para SEPOMEX Crawler
FROM node:20-alpine

# Metadata
LABEL maintainer="SEPOMEX Crawler"
LABEL description="Crawler automatizado para códigos postales de SEPOMEX"
LABEL version="1.0.0"

# Instalar dependencias del sistema
RUN apk add --no-cache \
    tzdata \
    curl \
    bash

# Establecer timezone a Mexico City
ENV TZ=America/Mexico_City
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar el código de la aplicación
COPY src/ ./src/

# Crear directorios necesarios
RUN mkdir -p data downloads logs

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 sepomex && \
    adduser -D -u 1001 -G sepomex sepomex && \
    chown -R sepomex:sepomex /app

# Cambiar a usuario no-root
USER sepomex

# Volumes para persistencia de datos
VOLUME ["/app/data", "/app/downloads", "/app/logs"]

# Puerto (aunque no se usa, lo dejamos por si en el futuro se agrega API)
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=1h --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('OK')" || exit 1

# Comando por defecto: ejecutar en modo cron
CMD ["node", "src/cron.js"]
