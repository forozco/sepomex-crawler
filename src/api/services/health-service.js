/**
 * Servicio de health check
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../../config');

class HealthService {
  /**
   * Check completo del sistema
   */
  async check() {
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {}
    };

    // Check de archivos de datos
    checks.checks.dataFiles = this.checkDataFiles();

    // Check de memoria
    checks.checks.memory = this.checkMemory();

    // Check de disco
    checks.checks.disk = this.checkDisk();

    // Check de proceso
    checks.checks.process = this.checkProcess();

    // Determinar estado general
    const hasErrors = Object.values(checks.checks).some(c => c.status === 'unhealthy');
    checks.status = hasErrors ? 'unhealthy' : 'healthy';

    return checks;
  }

  /**
   * Verifica si el servicio está listo para recibir tráfico
   */
  async isReady() {
    const dataCheck = this.checkDataFiles();
    return dataCheck.status === 'healthy';
  }

  /**
   * Verifica la disponibilidad de archivos de datos
   */
  checkDataFiles() {
    try {
      const lastVersionFile = path.join(config.DATA_DIR, 'last-version.json');

      if (!fs.existsSync(lastVersionFile)) {
        return {
          status: 'unhealthy',
          message: 'No hay datos disponibles'
        };
      }

      const lastVersion = JSON.parse(fs.readFileSync(lastVersionFile, 'utf8'));
      const dataFile = path.join(config.DATA_DIR, `${lastVersion.version}.json`);

      if (!fs.existsSync(dataFile)) {
        return {
          status: 'unhealthy',
          message: 'Archivo de datos no encontrado',
          version: lastVersion.version
        };
      }

      const stats = fs.statSync(dataFile);

      return {
        status: 'healthy',
        version: lastVersion.version,
        fileSize: stats.size,
        lastModified: stats.mtime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }

  /**
   * Verifica el uso de memoria
   */
  checkMemory() {
    const used = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedPercent = ((totalMem - freeMem) / totalMem) * 100;

    return {
      status: usedPercent > 90 ? 'warning' : 'healthy',
      heapUsed: Math.round(used.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(used.heapTotal / 1024 / 1024) + ' MB',
      rss: Math.round(used.rss / 1024 / 1024) + ' MB',
      systemMemory: {
        total: Math.round(totalMem / 1024 / 1024) + ' MB',
        free: Math.round(freeMem / 1024 / 1024) + ' MB',
        usedPercent: Math.round(usedPercent) + '%'
      }
    };
  }

  /**
   * Verifica el espacio en disco
   */
  checkDisk() {
    try {
      const dataDir = config.DATA_DIR;
      const downloadsDir = config.DOWNLOADS_DIR;

      const dataDirExists = fs.existsSync(dataDir);
      const downloadsDirExists = fs.existsSync(downloadsDir);

      return {
        status: (dataDirExists && downloadsDirExists) ? 'healthy' : 'unhealthy',
        dataDir: {
          exists: dataDirExists,
          path: dataDir
        },
        downloadsDir: {
          exists: downloadsDirExists,
          path: downloadsDir
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }

  /**
   * Información del proceso
   */
  checkProcess() {
    return {
      status: 'healthy',
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: Math.round(process.uptime()) + 's',
      cpu: os.cpus()[0].model,
      cores: os.cpus().length
    };
  }
}

module.exports = new HealthService();
