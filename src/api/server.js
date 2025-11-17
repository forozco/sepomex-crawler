/**
 * API REST Server para consultar datos de códigos postales SEPOMEX
 */

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const promClient = require('prom-client');
const config = require('../config');
const logger = require('../logger');
const postalCodeService = require('./services/postal-code-service');
const versionService = require('./services/version-service');
const healthService = require('./services/health-service');

class ApiServer {
  constructor() {
    this.app = express();
    this.port = config.PORT;
    this.register = new promClient.Registry();

    this.setupMiddleware();
    this.setupMetrics();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Seguridad
    this.app.use(helmet());

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Compresión
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      });
      next();
    });
  }

  setupMetrics() {
    // Métricas por defecto de Node.js
    promClient.collectDefaultMetrics({ register: this.register });

    // Métricas personalizadas
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register]
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register]
    });

    this.postalCodeSearches = new promClient.Counter({
      name: 'postal_code_searches_total',
      help: 'Total number of postal code searches',
      labelNames: ['type'],
      registers: [this.register]
    });

    this.crawlerRuns = new promClient.Counter({
      name: 'crawler_runs_total',
      help: 'Total number of crawler executions',
      labelNames: ['status'],
      registers: [this.register]
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      const health = await healthService.check();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    });

    // Liveness probe (Kubernetes)
    this.app.get('/healthz', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    // Readiness probe (Kubernetes)
    this.app.get('/ready', async (req, res) => {
      const isReady = await healthService.isReady();
      res.status(isReady ? 200 : 503).json({ ready: isReady });
    });

    // Métricas de Prometheus
    this.app.get('/metrics', async (req, res) => {
      res.set('Content-Type', this.register.contentType);
      res.end(await this.register.metrics());
    });

    // API Info
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'SEPOMEX Crawler API',
        version: '1.0.0',
        description: 'API para consultar códigos postales de SEPOMEX',
        endpoints: {
          health: '/health',
          metrics: '/metrics',
          postalCodes: {
            byCode: '/api/postal-codes/:code',
            search: '/api/postal-codes/search',
            all: '/api/postal-codes'
          },
          versions: {
            latest: '/api/versions/latest',
            all: '/api/versions',
            specific: '/api/versions/:version'
          }
        }
      });
    });

    // Códigos postales
    // Buscar códigos postales (debe estar ANTES del :code route)
    this.app.get('/api/postal-codes/search', async (req, res, next) => {
      try {
        const end = this.httpRequestDuration.startTimer();
        this.postalCodeSearches.inc({ type: 'search' });

        const { state, city, municipality, colony } = req.query;
        const results = await postalCodeService.search({
          state,
          city,
          municipality,
          colony
        });

        this.httpRequestTotal.inc({ method: 'GET', route: '/api/postal-codes/search', status_code: 200 });
        end({ method: 'GET', route: '/api/postal-codes/search', status_code: 200 });

        res.json({
          count: results.length,
          results
        });
      } catch (error) {
        next(error);
      }
    });

    // Consultar código postal específico (debe estar DESPUÉS de /search)
    this.app.get('/api/postal-codes/:code', async (req, res, next) => {
      try {
        const end = this.httpRequestDuration.startTimer();
        this.postalCodeSearches.inc({ type: 'by_code' });

        const { code } = req.params;
        const data = await postalCodeService.getByCode(code);

        if (!data) {
          return res.status(404).json({
            error: 'Código postal no encontrado',
            code
          });
        }

        this.httpRequestTotal.inc({ method: 'GET', route: '/api/postal-codes/:code', status_code: 200 });
        end({ method: 'GET', route: '/api/postal-codes/:code', status_code: 200 });

        res.json(data);
      } catch (error) {
        next(error);
      }
    });

    this.app.get('/api/postal-codes', async (req, res, next) => {
      try {
        const end = this.httpRequestDuration.startTimer();

        const { limit = 100, offset = 0 } = req.query;
        const data = await postalCodeService.getAll(parseInt(limit), parseInt(offset));

        this.httpRequestTotal.inc({ method: 'GET', route: '/api/postal-codes', status_code: 200 });
        end({ method: 'GET', route: '/api/postal-codes', status_code: 200 });

        res.json(data);
      } catch (error) {
        next(error);
      }
    });

    // Versiones
    this.app.get('/api/versions/latest', async (req, res, next) => {
      try {
        const latest = await versionService.getLatest();
        res.json(latest);
      } catch (error) {
        next(error);
      }
    });

    this.app.get('/api/versions', async (req, res, next) => {
      try {
        const versions = await versionService.getAll();
        res.json(versions);
      } catch (error) {
        next(error);
      }
    });

    this.app.get('/api/versions/:version', async (req, res, next) => {
      try {
        const { version } = req.params;
        const data = await versionService.getByVersion(version);

        if (!data) {
          return res.status(404).json({
            error: 'Versión no encontrada',
            version
          });
        }

        res.json(data);
      } catch (error) {
        next(error);
      }
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint no encontrado',
        path: req.path
      });
    });
  }

  setupErrorHandling() {
    this.app.use((err, req, res, next) => {
      logger.error('Error en API', err);

      this.httpRequestTotal.inc({
        method: req.method,
        route: req.path,
        status_code: err.statusCode || 500
      });

      res.status(err.statusCode || 500).json({
        error: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        logger.success(`API Server corriendo en puerto ${this.port}`);
        logger.info(`Health check: http://localhost:${this.port}/health`);
        logger.info(`Metrics: http://localhost:${this.port}/metrics`);
        logger.info(`API Info: http://localhost:${this.port}/api`);
        resolve();
      }).on('error', reject);
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            logger.info('API Server detenido');
            resolve();
          }
        });
      });
    }
  }

  getMetricsRegistry() {
    return this.register;
  }
}

module.exports = ApiServer;
