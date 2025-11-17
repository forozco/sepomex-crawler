#!/usr/bin/env node

/**
 * Aplicación principal que combina el crawler (cron) y la API REST
 */

const cron = require('node-cron');
const config = require('./config');
const logger = require('./logger');
const SepomexCrawler = require('./index');
const ApiServer = require('./api/server');
const postalCodeService = require('./api/services/postal-code-service');

class SepomexApp {
  constructor() {
    this.apiServer = null;
    this.cronTask = null;
  }

  /**
   * Inicia la aplicación completa
   */
  async start() {
    try {
      logger.section('SEPOMEX MICROSERVICE - INICIANDO');

      // Iniciar API Server
      await this.startApi();

      // Iniciar Cron Scheduler
      await this.startCron();

      logger.success('Microservicio iniciado completamente');

      // Manejar señales de terminación
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Error iniciando aplicación', error);
      process.exit(1);
    }
  }

  /**
   * Inicia el servidor API
   */
  async startApi() {
    logger.info('Iniciando API Server...');

    this.apiServer = new ApiServer();
    await this.apiServer.start();

    logger.success('API Server iniciado correctamente');
  }

  /**
   * Inicia el programador de tareas (cron)
   */
  async startCron() {
    logger.info('Iniciando Cron Scheduler...');

    const cronSchedule = process.env.CRON_SCHEDULE || config.CRON_SCHEDULE;

    if (!cron.validate(cronSchedule)) {
      throw new Error(`Expresión cron inválida: ${cronSchedule}`);
    }

    logger.info(`Programacion configurada: ${cronSchedule}`);
    logger.info('(Todos los lunes a las 3:00 AM por defecto)');

    this.cronTask = cron.schedule(cronSchedule, async () => {
      await this.runCrawler();
    }, {
      scheduled: true,
      timezone: "America/Mexico_City"
    });

    this.cronTask.start();

    logger.success('Cron Scheduler iniciado correctamente');
    logger.info('Esperando proxima ejecucion programada...');
  }

  /**
   * Ejecuta el crawler
   */
  async runCrawler() {
    logger.section('EJECUCION PROGRAMADA DEL CRAWLER');

    const crawler = new SepomexCrawler();

    try {
      const result = await crawler.run();

      if (result.success) {
        if (result.hasUpdate) {
          logger.success(`Nueva version ${result.version} descargada y procesada`);

          // Recargar datos en la API
          logger.info('Recargando datos en API Server...');
          await postalCodeService.reload();
          logger.success('Datos recargados en API Server');

          // Aquí podrías enviar notificaciones (WebSocket, email, etc.)
          this.notifyNewVersion(result.version);

        } else {
          logger.info('No hay actualizaciones disponibles');
        }
      } else {
        logger.error('La ejecución del crawler fallo');
      }

    } catch (error) {
      logger.error('Error en ejecucion del crawler', error);

      // Incrementar métrica de error si el API server está disponible
      if (this.apiServer && this.apiServer.crawlerRuns) {
        this.apiServer.crawlerRuns.inc({ status: 'error' });
      }
    }

    logger.info('Esperando proxima ejecucion...');
  }

  /**
   * Notifica sobre una nueva versión
   */
  notifyNewVersion(version) {
    logger.info(`Notificacion: Nueva version ${version} disponible`);

    // Incrementar métrica de crawler exitoso
    if (this.apiServer && this.apiServer.crawlerRuns) {
      this.apiServer.crawlerRuns.inc({ status: 'success' });
    }

    // Aquí podrías implementar:
    // - WebSocket broadcast
    // - Publicar en message queue (RabbitMQ/Kafka)
    // - Enviar email
    // - Llamar webhook
  }

  /**
   * Configura el cierre graceful de la aplicación
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.warn(`\nSeñal ${signal} recibida. Iniciando cierre graceful...`);

      try {
        // Detener cron
        if (this.cronTask) {
          this.cronTask.stop();
          logger.info('Cron Scheduler detenido');
        }

        // Detener API server
        if (this.apiServer) {
          await this.apiServer.stop();
          logger.info('API Server detenido');
        }

        logger.success('Cierre graceful completado');
        process.exit(0);

      } catch (error) {
        logger.error('Error durante cierre graceful', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  /**
   * Ejecuta el crawler manualmente (para testing o ejecución inmediata)
   */
  async runOnce() {
    logger.section('EJECUCION MANUAL DEL CRAWLER');

    await this.runCrawler();

    logger.info('Ejecucion manual completada');
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  const app = new SepomexApp();

  // Verificar argumentos de línea de comando
  const args = process.argv.slice(2);

  if (args.includes('--run-once')) {
    // Modo ejecución única (sin API ni cron)
    const crawler = new SepomexCrawler();
    const forceDownload = args.includes('--force-download');

    crawler.run({ forceDownload })
      .then(result => {
        if (result.success) {
          logger.success('Crawler ejecutado exitosamente');
          process.exit(0);
        } else {
          logger.error('Error ejecutando crawler');
          process.exit(1);
        }
      })
      .catch(error => {
        logger.error('Error fatal', error);
        process.exit(1);
      });

  } else {
    // Modo normal: API + Cron
    app.start();
  }
}

module.exports = SepomexApp;
