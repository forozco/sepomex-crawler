/**
 * Configuración del crawler SEPOMEX
 */

module.exports = {
  // URL de SEPOMEX
  SEPOMEX_URL: 'https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/CodigoPostal_Exportar.aspx',

  // Directorios
  DOWNLOADS_DIR: './downloads',
  DATA_DIR: './data',
  LOGS_DIR: './logs',

  // Archivo de historial de versiones
  VERSIONS_FILE: './data/versions.json',

  // Archivo con última versión conocida
  LAST_VERSION_FILE: './data/last-version.json',

  // Programación (cron expression)
  // Por defecto: Todos los lunes a las 3:00 AM
  CRON_SCHEDULE: '0 3 * * 1',

  // Configuración de descarga
  DOWNLOAD_TIMEOUT: 300000, // 5 minutos
  MAX_RETRIES: 5,
  RETRY_DELAY: 2000, // 2 segundos inicial
  RETRY_MAX_DELAY: 60000, // 60 segundos máximo

  // Encoding del archivo TXT
  TXT_ENCODING: 'latin1',

  // Puerto de la API
  PORT: process.env.PORT || 9000
};
