/**
 * Servicio para gestionar versiones
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config');

class VersionService {
  /**
   * Obtiene la última versión
   */
  async getLatest() {
    const lastVersionFile = path.join(config.DATA_DIR, 'last-version.json');

    if (!fs.existsSync(lastVersionFile)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(lastVersionFile, 'utf8'));
  }

  /**
   * Obtiene todas las versiones
   */
  async getAll() {
    const versionsFile = config.VERSIONS_FILE;

    if (!fs.existsSync(versionsFile)) {
      return {
        versions: [],
        total: 0
      };
    }

    const data = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));

    return {
      versions: data.versions || [],
      total: (data.versions || []).length,
      lastUpdated: data.lastUpdated
    };
  }

  /**
   * Obtiene una versión específica
   */
  async getByVersion(version) {
    const versionsFile = config.VERSIONS_FILE;

    if (!fs.existsSync(versionsFile)) {
      return null;
    }

    const data = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));
    const versionData = (data.versions || []).find(v => v.version === version);

    if (!versionData) {
      return null;
    }

    // Verificar si los archivos existen
    const files = {
      json: path.join(config.DATA_DIR, `${version}.json`),
      txt: path.join(config.DOWNLOADS_DIR, `${version}.txt`),
      zip: path.join(config.DOWNLOADS_DIR, `sepomex-${version}.zip`)
    };

    const filesExist = {
      json: fs.existsSync(files.json),
      txt: fs.existsSync(files.txt),
      zip: fs.existsSync(files.zip)
    };

    return {
      ...versionData,
      files: filesExist
    };
  }
}

module.exports = new VersionService();
