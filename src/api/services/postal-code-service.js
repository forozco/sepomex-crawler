/**
 * Servicio para consultar códigos postales
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config');
const logger = require('../../logger');

class PostalCodeService {
  constructor() {
    this.cache = null;
    this.cacheVersion = null;
    this.loadLatestData();
  }

  /**
   * Carga los datos más recientes en memoria
   */
  loadLatestData() {
    try {
      const lastVersionFile = path.join(config.DATA_DIR, 'last-version.json');

      if (!fs.existsSync(lastVersionFile)) {
        logger.warn('No hay datos de códigos postales disponibles');
        return;
      }

      const lastVersion = JSON.parse(fs.readFileSync(lastVersionFile, 'utf8'));
      const dataFile = path.join(config.DATA_DIR, `${lastVersion.version}.json`);

      if (!fs.existsSync(dataFile)) {
        logger.warn(`Archivo de datos no encontrado: ${dataFile}`);
        return;
      }

      this.cache = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      this.cacheVersion = lastVersion.version;

      logger.success(`Datos cargados en memoria: versión ${this.cacheVersion}`);
      logger.info(`Total códigos postales en cache: ${Object.keys(this.cache).length}`);
    } catch (error) {
      logger.error('Error cargando datos de códigos postales', error);
    }
  }

  /**
   * Obtiene un código postal por su código
   */
  async getByCode(code) {
    if (!this.cache) {
      this.loadLatestData();
    }

    if (!this.cache) {
      throw new Error('Datos no disponibles');
    }

    // Normalizar código postal
    const normalizedCode = code.toString().padStart(5, '0');

    return this.cache[normalizedCode] || null;
  }

  /**
   * Busca códigos postales por criterios
   */
  async search(criteria) {
    if (!this.cache) {
      this.loadLatestData();
    }

    if (!this.cache) {
      throw new Error('Datos no disponibles');
    }

    const results = [];
    const { state, city, municipality, colony } = criteria;

    for (const [code, data] of Object.entries(this.cache)) {
      let match = true;

      if (state && !data.estado.toLowerCase().includes(state.toLowerCase())) {
        match = false;
      }

      if (city && !data.ciudad.toLowerCase().includes(city.toLowerCase())) {
        match = false;
      }

      if (municipality && !data.municipio.toLowerCase().includes(municipality.toLowerCase())) {
        match = false;
      }

      if (colony) {
        const hasColony = data.colonias.some(c =>
          c.toLowerCase().includes(colony.toLowerCase())
        );
        if (!hasColony) {
          match = false;
        }
      }

      if (match) {
        results.push(data);
      }

      // Limitar resultados para no sobrecargar
      if (results.length >= 100) {
        break;
      }
    }

    return results;
  }

  /**
   * Obtiene todos los códigos postales con paginación
   */
  async getAll(limit = 100, offset = 0) {
    if (!this.cache) {
      this.loadLatestData();
    }

    if (!this.cache) {
      throw new Error('Datos no disponibles');
    }

    const allCodes = Object.values(this.cache);
    const total = allCodes.length;
    const data = allCodes.slice(offset, offset + limit);

    return {
      total,
      limit,
      offset,
      count: data.length,
      data
    };
  }

  /**
   * Obtiene estadísticas de los datos
   */
  async getStats() {
    if (!this.cache) {
      this.loadLatestData();
    }

    if (!this.cache) {
      return null;
    }

    const states = new Set();
    const cities = new Set();
    const municipalities = new Set();
    let totalColonies = 0;

    for (const data of Object.values(this.cache)) {
      states.add(data.estado);
      cities.add(data.ciudad);
      municipalities.add(data.municipio);
      totalColonies += data.colonias.length;
    }

    return {
      version: this.cacheVersion,
      totalPostalCodes: Object.keys(this.cache).length,
      totalStates: states.size,
      totalCities: cities.size,
      totalMunicipalities: municipalities.size,
      totalColonies,
      cacheLoaded: true
    };
  }

  /**
   * Recarga los datos desde disco
   */
  async reload() {
    logger.info('Recargando datos de códigos postales...');
    this.loadLatestData();
    return this.getStats();
  }
}

module.exports = new PostalCodeService();
