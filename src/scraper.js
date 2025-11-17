/**
 * Web scraper para detectar y descargar archivos de SEPOMEX
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const logger = require('./logger');

class SepomexScraper {
  constructor() {
    this.baseUrl = config.SEPOMEX_URL;
  }

  /**
   * Espera un tiempo determinado (con exponential backoff)
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calcula el delay para el próximo retry usando exponential backoff
   */
  calculateBackoff(attempt) {
    const delay = Math.min(
      config.RETRY_DELAY * Math.pow(2, attempt),
      config.RETRY_MAX_DELAY
    );
    return delay;
  }

  /**
   * Ejecuta una función con reintentos automáticos
   */
  async withRetry(fn, operationName) {
    let lastError;

    for (let attempt = 0; attempt <= config.MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateBackoff(attempt - 1);
          logger.info(`Reintentando ${operationName} (intento ${attempt + 1}/${config.MAX_RETRIES + 1}) en ${delay / 1000}s...`);
          await this.sleep(delay);
        }

        return await fn();
      } catch (error) {
        lastError = error;

        const isRetryable =
          error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ENOTFOUND' ||
          error.code === 'ECONNRESET' ||
          (error.response && error.response.status >= 500);

        if (!isRetryable || attempt === config.MAX_RETRIES) {
          break;
        }

        logger.warn(`Error en ${operationName}: ${error.message} (intentando de nuevo...)`);
      }
    }

    throw lastError;
  }

  /**
   * Obtiene información de la página de SEPOMEX
   */
  async getPageInfo() {
    return this.withRetry(async () => {
      logger.info('Consultando página de SEPOMEX...');

      const response = await axios.get(this.baseUrl, {
        timeout: config.DOWNLOAD_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);

      // Extraer información de la página
      const pageInfo = {
        title: $('title').text().trim(),
        downloadLink: null,
        fileDate: null,
        updateInfo: null
      };

      // Extraer datos del formulario ASP.NET necesarios para el POST
      const viewState = $('#__VIEWSTATE').val();
      const viewStateGenerator = $('#__VIEWSTATEGENERATOR').val();
      const eventValidation = $('#__EVENTVALIDATION').val();

      // La descarga se hace mediante POST, no hay link directo
      pageInfo.downloadLink = this.baseUrl;
      pageInfo.formData = {
        __VIEWSTATE: viewState,
        __VIEWSTATEGENERATOR: viewStateGenerator,
        __EVENTVALIDATION: eventValidation,
        cboEdo: '00', // Todos los estados
        'rblTipo': 'txt', // Formato TXT
        'btnDescarga.x': '50', // Simular clic en el botón
        'btnDescarga.y': '20'
      };

      logger.info(`Formulario ASP.NET detectado con ViewState`);

      // Buscar fecha de actualización en el texto de la página
      const pageText = $('body').text();
      const datePatterns = [
        /actualiz.*?(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /fecha.*?(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /(\d{1,2}\/\d{1,2}\/\d{4})/g
      ];

      for (const pattern of datePatterns) {
        const match = pageText.match(pattern);
        if (match) {
          pageInfo.fileDate = match[1] || match[0];
          break;
        }
      }

      logger.success('Información de página obtenida');

      return pageInfo;
    }, 'consulta de página SEPOMEX');
  }

  /**
   * Descarga el archivo ZIP de códigos postales
   */
  async downloadFile(downloadUrl, outputPath, formData = null) {
    return this.withRetry(async () => {
      logger.info(`Descargando archivo desde: ${downloadUrl}`);

      const options = {
        url: downloadUrl,
        responseType: 'stream',
        timeout: config.DOWNLOAD_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      // Si hay formData, hacer POST, de lo contrario GET
      if (formData) {
        const qs = require('querystring');
        options.method = 'POST';
        options.data = qs.stringify(formData);
        logger.info('Enviando POST con datos del formulario ASP.NET');
      } else {
        options.method = 'GET';
      }

      const response = await axios(options);

      const writer = fs.createWriteStream(outputPath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          const stats = fs.statSync(outputPath);
          logger.success(`Archivo descargado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          resolve({ filePath: outputPath, fileSize: stats.size });
        });

        writer.on('error', (error) => {
          logger.error('Error escribiendo archivo', error);
          reject(error);
        });
      });
    }, 'descarga de archivo');
  }

  /**
   * Genera un nombre de archivo basado en la fecha
   */
  generateFileName(dateString) {
    // Intentar parsear la fecha
    let date;

    if (dateString) {
      // Formato dd/mm/yyyy
      const parts = dateString.split('/');
      if (parts.length === 3) {
        date = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }

    if (!date || isNaN(date.getTime())) {
      // Usar fecha actual si no se pudo parsear
      date = new Date();
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }

  /**
   * Verifica si hay una nueva versión disponible
   */
  async checkForUpdate(lastKnownVersion) {
    try {
      const pageInfo = await this.getPageInfo();

      if (!pageInfo.downloadLink) {
        logger.warn('No se encontró enlace de descarga');
        return { hasUpdate: false, pageInfo };
      }

      const currentVersion = this.generateFileName(pageInfo.fileDate);

      const hasUpdate = !lastKnownVersion || currentVersion !== lastKnownVersion;

      return {
        hasUpdate,
        currentVersion,
        pageInfo
      };
    } catch (error) {
      logger.error('Error verificando actualización', error);
      throw error;
    }
  }
}

module.exports = new SepomexScraper();
