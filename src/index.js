#!/usr/bin/env node

/**
 * Script principal del crawler SEPOMEX
 * Descarga, procesa y mantiene historial de códigos postales
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');
const logger = require('./logger');
const scraper = require('./scraper');
const processor = require('./processor');
const versionManager = require('./version-manager');

class SepomexCrawler {
  constructor() {
    this.downloadsDir = config.DOWNLOADS_DIR;
    this.dataDir = config.DATA_DIR;
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.downloadsDir, this.dataDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Ejecuta el proceso completo de descarga y procesamiento
   */
  async run(options = {}) {
    try {
      logger.section('SEPOMEX CRAWLER - INICIO');

      const lastVersion = versionManager.getLastVersion();

      logger.info('Verificando actualizaciones...');

      const updateCheck = await scraper.checkForUpdate(lastVersion.version);

      if (!updateCheck.hasUpdate && !options.forceDownload) {
        logger.success('No hay nuevas versiones disponibles');
        logger.info(`Última versión conocida: ${lastVersion.version}`);
        logger.info(`Descargada el: ${lastVersion.downloadDate ? new Date(lastVersion.downloadDate).toLocaleString('es-MX') : 'N/A'}`);

        if (options.checkOnly) {
          versionManager.printHistory(5);
        }

        return {
          success: true,
          hasUpdate: false,
          version: lastVersion.version
        };
      }

      if (options.checkOnly) {
        logger.info(`Nueva versión disponible: ${updateCheck.currentVersion}`);
        logger.info('Use --force-download para descargar');
        return {
          success: true,
          hasUpdate: true,
          version: updateCheck.currentVersion
        };
      }

      logger.success(`Nueva versión detectada: ${updateCheck.currentVersion}`);

      // Paso 1: Descargar ZIP
      logger.section('PASO 1: DESCARGA');

      const zipFileName = `sepomex-${updateCheck.currentVersion}.zip`;
      const zipPath = path.join(this.downloadsDir, zipFileName);

      const downloadResult = await scraper.downloadFile(
        updateCheck.pageInfo.downloadLink,
        zipPath,
        updateCheck.pageInfo.formData
      );

      // Paso 2: Extraer ZIP
      logger.section('PASO 2: EXTRACCION');

      const txtPath = processor.extractZip(zipPath, this.downloadsDir);

      // Paso 3: Renombrar archivo TXT
      logger.section('PASO 3: RENOMBRADO');

      const renamedTxtPath = processor.renameFile(txtPath, updateCheck.currentVersion);

      // Paso 4: Convertir a JSON
      logger.section('PASO 4: CONVERSION A JSON');

      const jsonPath = path.join(this.dataDir, `${updateCheck.currentVersion}.json`);

      const conversionResult = processor.convertToJson(
        renamedTxtPath,
        jsonPath,
        updateCheck.currentVersion
      );

      // Paso 5: Agregar al historial
      logger.section('PASO 5: ACTUALIZACION DE HISTORIAL');

      const versionInfo = {
        version: updateCheck.currentVersion,
        fileDate: updateCheck.pageInfo.fileDate,
        fileSize: downloadResult.fileSize,
        recordCount: conversionResult.recordCount,
        postalCodeCount: conversionResult.postalCodeCount,
        fileName: `${updateCheck.currentVersion}.txt`
      };

      versionManager.addVersion(versionInfo);

      // Paso 6: Copiar a proyecto Angular (opcional)
      logger.section('PASO 6: COPIA A PROYECTO ANGULAR');

      await processor.copyToAngularProject(renamedTxtPath, jsonPath);

      // Resumen final
      logger.section('PROCESO COMPLETADO');

      console.log(`
RESUMEN DE LA OPERACION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Version:              ${updateCheck.currentVersion}
  Fecha del archivo:    ${updateCheck.pageInfo.fileDate || 'N/A'}
  Tamaño descargado:    ${(downloadResult.fileSize / 1024 / 1024).toFixed(2)} MB
  Registros procesados: ${conversionResult.recordCount.toLocaleString()}
  Codigos postales:     ${conversionResult.postalCodeCount.toLocaleString()}

  Archivos generados:
     - TXT: ${path.basename(renamedTxtPath)}
     - JSON: ${path.basename(jsonPath)}
     - ZIP: ${zipFileName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);

      versionManager.printHistory(5);

      return {
        success: true,
        hasUpdate: true,
        version: updateCheck.currentVersion,
        files: {
          txt: renamedTxtPath,
          json: jsonPath,
          zip: zipPath
        }
      };

    } catch (error) {
      logger.error('❌ Error en el proceso del crawler', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    checkOnly: args.includes('--check-only'),
    forceDownload: args.includes('--force-download')
  };

  const crawler = new SepomexCrawler();

  crawler.run(options).then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    logger.error('Error fatal', error);
    process.exit(1);
  });
}

module.exports = SepomexCrawler;
