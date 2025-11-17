#!/usr/bin/env node

/**
 * Programador de tareas (cron) para ejecución automática
 */

const cron = require('node-cron');
const config = require('./config');
const logger = require('./logger');
const SepomexCrawler = require('./index');

logger.section('SEPOMEX CRAWLER - MODO CRON');

logger.info(`Programacion configurada: ${config.CRON_SCHEDULE}`);
logger.info('(Todos los lunes a las 3:00 AM por defecto)');
logger.info('\nEsperando proxima ejecucion...\n');

// Validar expresión cron
if (!cron.validate(config.CRON_SCHEDULE)) {
  logger.error('Expresión cron inválida en la configuración');
  process.exit(1);
}

// Programar tarea
const task = cron.schedule(config.CRON_SCHEDULE, async () => {
  logger.section('EJECUCION PROGRAMADA INICIADA');

  const crawler = new SepomexCrawler();

  try {
    const result = await crawler.run();

    if (result.success) {
      if (result.hasUpdate) {
        logger.success(`Nueva versión ${result.version} descargada y procesada`);
      } else {
        logger.info('No hay actualizaciones disponibles');
      }
    } else {
      logger.error('La ejecución programada falló');
    }
  } catch (error) {
    logger.error('Error en ejecución programada', error);
  }

  logger.info('\nEsperando proxima ejecucion...\n');
}, {
  scheduled: true,
  timezone: "America/Mexico_City"
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  logger.warn('\nDeteniendo programador de tareas...');
  task.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.warn('\nDeteniendo programador de tareas...');
  task.stop();
  process.exit(0);
});

logger.info('Programador de tareas iniciado');
logger.info('Presiona Ctrl+C para detener\n');

// Mantener el proceso vivo
task.start();
