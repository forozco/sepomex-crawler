/**
 * Gestor de versiones e historial de archivos SEPOMEX
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');
const logger = require('./logger');

class VersionManager {
  constructor() {
    this.versionsFile = config.VERSIONS_FILE;
    this.lastVersionFile = config.LAST_VERSION_FILE;
    this.ensureDataDir();
    this.initializeFiles();
  }

  ensureDataDir() {
    const dataDir = config.DATA_DIR;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  initializeFiles() {
    // Inicializar archivo de versiones si no existe
    if (!fs.existsSync(this.versionsFile)) {
      const initialData = {
        versions: [],
        lastUpdated: null
      };
      fs.writeFileSync(this.versionsFile, JSON.stringify(initialData, null, 2));
      logger.info('Archivo de versiones inicializado');
    }

    // Inicializar archivo de última versión si no existe
    if (!fs.existsSync(this.lastVersionFile)) {
      const initialData = {
        version: null,
        downloadDate: null,
        fileDate: null
      };
      fs.writeFileSync(this.lastVersionFile, JSON.stringify(initialData, null, 2));
      logger.info('Archivo de última versión inicializado');
    }
  }

  /**
   * Obtiene todas las versiones del historial
   */
  getAllVersions() {
    try {
      const data = fs.readFileSync(this.versionsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error leyendo archivo de versiones', error);
      return { versions: [], lastUpdated: null };
    }
  }

  /**
   * Obtiene la última versión conocida
   */
  getLastVersion() {
    try {
      const data = fs.readFileSync(this.lastVersionFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error leyendo última versión', error);
      return { version: null, downloadDate: null, fileDate: null };
    }
  }

  /**
   * Verifica si una versión ya existe en el historial
   */
  versionExists(version) {
    const data = this.getAllVersions();
    return data.versions.some(v => v.version === version);
  }

  /**
   * Agrega una nueva versión al historial
   */
  addVersion(versionInfo) {
    try {
      const data = this.getAllVersions();

      // Verificar si ya existe
      if (this.versionExists(versionInfo.version)) {
        logger.warn(`Versión ${versionInfo.version} ya existe en el historial`);
        return false;
      }

      // Agregar nueva versión
      const newVersion = {
        version: versionInfo.version,
        fileDate: versionInfo.fileDate,
        downloadDate: new Date().toISOString(),
        fileSize: versionInfo.fileSize,
        recordCount: versionInfo.recordCount,
        postalCodeCount: versionInfo.postalCodeCount,
        fileName: versionInfo.fileName
      };

      data.versions.unshift(newVersion); // Agregar al inicio
      data.lastUpdated = new Date().toISOString();

      // Guardar historial
      fs.writeFileSync(this.versionsFile, JSON.stringify(data, null, 2));

      // Actualizar última versión
      this.updateLastVersion(newVersion);

      logger.success(`Nueva versión agregada al historial: ${versionInfo.version}`);
      return true;
    } catch (error) {
      logger.error('Error agregando versión al historial', error);
      return false;
    }
  }

  /**
   * Actualiza el archivo de última versión
   */
  updateLastVersion(versionInfo) {
    try {
      const data = {
        version: versionInfo.version,
        downloadDate: versionInfo.downloadDate,
        fileDate: versionInfo.fileDate,
        fileSize: versionInfo.fileSize,
        recordCount: versionInfo.recordCount,
        postalCodeCount: versionInfo.postalCodeCount,
        fileName: versionInfo.fileName
      };

      fs.writeFileSync(this.lastVersionFile, JSON.stringify(data, null, 2));
      logger.info('Última versión actualizada');
    } catch (error) {
      logger.error('Error actualizando última versión', error);
    }
  }

  /**
   * Obtiene estadísticas del historial
   */
  getStats() {
    const data = this.getAllVersions();
    return {
      totalVersions: data.versions.length,
      firstVersion: data.versions[data.versions.length - 1]?.version || null,
      latestVersion: data.versions[0]?.version || null,
      lastUpdated: data.lastUpdated
    };
  }

  /**
   * Muestra el historial de versiones en consola
   */
  printHistory(limit = 10) {
    const data = this.getAllVersions();

    logger.section('HISTORIAL DE VERSIONES');

    if (data.versions.length === 0) {
      console.log('No hay versiones en el historial');
      return;
    }

    const versions = data.versions.slice(0, limit);

    console.log(`\nMostrando las últimas ${versions.length} versiones:\n`);

    versions.forEach((version, index) => {
      console.log(`${index + 1}. Versión: ${version.version}`);
      console.log(`   Fecha archivo: ${version.fileDate}`);
      console.log(`   Descargado: ${new Date(version.downloadDate).toLocaleString('es-MX')}`);
      console.log(`   Tamaño: ${(version.fileSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Registros: ${version.recordCount?.toLocaleString()}`);
      console.log(`   Códigos postales: ${version.postalCodeCount?.toLocaleString()}`);
      console.log(`   Archivo: ${version.fileName}`);
      console.log('');
    });

    if (data.versions.length > limit) {
      console.log(`... y ${data.versions.length - limit} versiones más`);
    }

    console.log(`Total de versiones: ${data.versions.length}`);
  }
}

module.exports = new VersionManager();
