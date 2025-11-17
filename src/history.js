#!/usr/bin/env node

/**
 * Visor de historial de versiones SEPOMEX
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');
const logger = require('./logger');

class HistoryViewer {
  constructor() {
    this.versionsFile = config.VERSIONS_FILE;
  }

  /**
   * Formatea bytes a formato legible
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formatea fecha
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Mexico_City'
    });
  }

  /**
   * Verifica si los archivos de una versión existen
   */
  checkVersionFiles(version) {
    const files = {
      json: path.join(config.DATA_DIR, `${version}.json`),
      txt: path.join(config.DOWNLOADS_DIR, `${version}.txt`),
      zip: path.join(config.DOWNLOADS_DIR, `sepomex-${version}.zip`)
    };

    const exists = {
      json: fs.existsSync(files.json),
      txt: fs.existsSync(files.txt),
      zip: fs.existsSync(files.zip)
    };

    return { files, exists };
  }

  /**
   * Muestra el historial completo
   */
  showHistory(limit = null) {
    try {
      logger.section('HISTORIAL COMPLETO DE VERSIONES SEPOMEX');

      if (!fs.existsSync(this.versionsFile)) {
        logger.warn('No hay historial de versiones aún');
        return;
      }

      const data = JSON.parse(fs.readFileSync(this.versionsFile, 'utf8'));
      const versions = data.versions || [];

      if (versions.length === 0) {
        logger.warn('El historial está vacío');
        return;
      }

      const versionsToShow = limit ? versions.slice(-limit) : versions;

      console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
      console.log('║                         HISTORIAL DE VERSIONES                           ║');
      console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

      console.log(`Total de versiones descargadas: ${versions.length}\n`);

      versionsToShow.reverse().forEach((v, index) => {
        const number = versions.length - index;
        const { files, exists } = this.checkVersionFiles(v.version);

        console.log('┌─────────────────────────────────────────────────────────────────────────┐');
        console.log(`│ #${number.toString().padStart(3, '0')} - Version: ${v.version.padEnd(50, ' ')} │`);
        console.log('├─────────────────────────────────────────────────────────────────────────┤');
        console.log(`│    Fecha del archivo:    ${(v.fileDate || 'N/A').padEnd(42, ' ')} │`);
        console.log(`│    Fecha de descarga:    ${this.formatDate(v.downloadDate).padEnd(42, ' ')} │`);
        console.log(`│    Tamaño descargado:    ${this.formatBytes(v.fileSize).padEnd(42, ' ')} │`);
        console.log(`│    Registros totales:    ${v.recordCount.toLocaleString('es-MX').padEnd(42, ' ')} │`);
        console.log(`│    Codigos postales:     ${v.postalCodeCount.toLocaleString('es-MX').padEnd(42, ' ')} │`);
        console.log('├─────────────────────────────────────────────────────────────────────────┤');
        console.log('│  Archivos disponibles:                                                  │');
        console.log(`│    ${exists.zip ? '[OK]' : '[--]'} ZIP:  ${files.zip.padEnd(57, ' ')} │`);
        console.log(`│    ${exists.txt ? '[OK]' : '[--]'} TXT:  ${files.txt.padEnd(57, ' ')} │`);
        console.log(`│    ${exists.json ? '[OK]' : '[--]'} JSON: ${files.json.padEnd(56, ' ')} │`);
        console.log('└─────────────────────────────────────────────────────────────────────────┘\n');
      });

      // Estadísticas generales
      const totalRecords = versions.reduce((sum, v) => sum + (v.recordCount || 0), 0);
      const totalSize = versions.reduce((sum, v) => sum + (v.fileSize || 0), 0);
      const avgPostalCodes = Math.round(versions.reduce((sum, v) => sum + (v.postalCodeCount || 0), 0) / versions.length);

      console.log('╔══════════════════════════════════════════════════════════════════════════╗');
      console.log('║                          ESTADÍSTICAS GENERALES                          ║');
      console.log('╠══════════════════════════════════════════════════════════════════════════╣');
      console.log(`║ Total de versiones:              ${versions.length.toString().padEnd(40, ' ')} ║`);
      console.log(`║ Registros procesados (total):    ${totalRecords.toLocaleString('es-MX').padEnd(40, ' ')} ║`);
      console.log(`║ Tamaño total descargado:         ${this.formatBytes(totalSize).padEnd(40, ' ')} ║`);
      console.log(`║ Promedio códigos postales:       ${avgPostalCodes.toLocaleString('es-MX').padEnd(40, ' ')} ║`);
      console.log(`║ Última actualización:            ${this.formatDate(data.lastUpdated).padEnd(40, ' ')} ║`);
      console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

    } catch (error) {
      logger.error('Error mostrando historial', error);
    }
  }

  /**
   * Muestra estadísticas comparativas
   */
  showComparison() {
    try {
      logger.section('COMPARACION DE VERSIONES');

      if (!fs.existsSync(this.versionsFile)) {
        logger.warn('No hay historial de versiones aún');
        return;
      }

      const data = JSON.parse(fs.readFileSync(this.versionsFile, 'utf8'));
      const versions = data.versions || [];

      if (versions.length < 2) {
        logger.warn('Se necesitan al menos 2 versiones para comparar');
        return;
      }

      console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
      console.log('║                      EVOLUCIÓN DE LOS DATOS                              ║');
      console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

      const latest = versions[versions.length - 1];
      const previous = versions[versions.length - 2];

      const recordDiff = latest.recordCount - previous.recordCount;
      const postalCodeDiff = latest.postalCodeCount - previous.postalCodeCount;
      const sizeDiff = latest.fileSize - previous.fileSize;

      console.log(`Comparación: ${previous.version} → ${latest.version}\n`);

      console.log('┌─────────────────────────────────────────────────────────────────────────┐');
      console.log('│ Métrica              │ Anterior      │ Actual        │ Diferencia      │');
      console.log('├─────────────────────────────────────────────────────────────────────────┤');
      console.log(`│ Registros            │ ${previous.recordCount.toLocaleString('es-MX').padEnd(13)} │ ${latest.recordCount.toLocaleString('es-MX').padEnd(13)} │ ${(recordDiff >= 0 ? '+' : '') + recordDiff.toLocaleString('es-MX').padEnd(15)} │`);
      console.log(`│ Códigos postales     │ ${previous.postalCodeCount.toLocaleString('es-MX').padEnd(13)} │ ${latest.postalCodeCount.toLocaleString('es-MX').padEnd(13)} │ ${(postalCodeDiff >= 0 ? '+' : '') + postalCodeDiff.toLocaleString('es-MX').padEnd(15)} │`);
      console.log(`│ Tamaño archivo       │ ${this.formatBytes(previous.fileSize).padEnd(13)} │ ${this.formatBytes(latest.fileSize).padEnd(13)} │ ${(sizeDiff >= 0 ? '+' : '') + this.formatBytes(Math.abs(sizeDiff)).padEnd(15)} │`);
      console.log('└─────────────────────────────────────────────────────────────────────────┘\n');

    } catch (error) {
      logger.error('Error mostrando comparación', error);
    }
  }

  /**
   * Muestra la última versión
   */
  showLatest() {
    try {
      if (!fs.existsSync(this.versionsFile)) {
        logger.warn('No hay historial de versiones aún');
        return;
      }

      const data = JSON.parse(fs.readFileSync(this.versionsFile, 'utf8'));
      const versions = data.versions || [];

      if (versions.length === 0) {
        logger.warn('El historial está vacío');
        return;
      }

      const latest = versions[versions.length - 1];
      const { files, exists } = this.checkVersionFiles(latest.version);

      logger.section('ULTIMA VERSION DISPONIBLE');

      console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
      console.log(`║ Version: ${latest.version.padEnd(63, ' ')} ║`);
      console.log('╠══════════════════════════════════════════════════════════════════════════╣');
      console.log(`║ Fecha del archivo:    ${(latest.fileDate || 'N/A').padEnd(49, ' ')} ║`);
      console.log(`║ Fecha de descarga:    ${this.formatDate(latest.downloadDate).padEnd(49, ' ')} ║`);
      console.log(`║ Tamaño:               ${this.formatBytes(latest.fileSize).padEnd(49, ' ')} ║`);
      console.log(`║ Registros:            ${latest.recordCount.toLocaleString('es-MX').padEnd(49, ' ')} ║`);
      console.log(`║ Codigos postales:     ${latest.postalCodeCount.toLocaleString('es-MX').padEnd(49, ' ')} ║`);
      console.log('╠══════════════════════════════════════════════════════════════════════════╣');
      console.log('║ Archivos:                                                                ║');
      console.log(`║   ${exists.zip ? '[OK]' : '[--]'} ZIP:  ${path.basename(files.zip).padEnd(57, ' ')} ║`);
      console.log(`║   ${exists.txt ? '[OK]' : '[--]'} TXT:  ${path.basename(files.txt).padEnd(57, ' ')} ║`);
      console.log(`║   ${exists.json ? '[OK]' : '[--]'} JSON: ${path.basename(files.json).padEnd(56, ' ')} ║`);
      console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

    } catch (error) {
      logger.error('Error mostrando última versión', error);
    }
  }
}

// CLI
if (require.main === module) {
  const viewer = new HistoryViewer();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'compare':
    case 'comp':
      viewer.showComparison();
      break;
    case 'latest':
    case 'last':
      viewer.showLatest();
      break;
    case 'full':
    case 'all':
      viewer.showHistory();
      break;
    default:
      // Por defecto muestra las últimas 5 versiones
      const limit = parseInt(args[0]) || 5;
      viewer.showHistory(limit);
  }
}

module.exports = HistoryViewer;
