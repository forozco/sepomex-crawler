/**
 * Sistema de logging con salida a consola y archivo
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

class Logger {
  constructor() {
    this.logsDir = config.LOGS_DIR;
    this.ensureLogsDir();
  }

  ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  getLogFileName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return path.join(this.logsDir, `sepomex-${year}-${month}.log`);
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level}] ${message}`;

    if (data) {
      logMessage += '\n' + JSON.stringify(data, null, 2);
    }

    return logMessage;
  }

  writeToFile(message) {
    try {
      const logFile = this.getLogFileName();
      fs.appendFileSync(logFile, message + '\n');
    } catch (error) {
      console.error('Error escribiendo en archivo de log:', error);
    }
  }

  info(message, data = null) {
    const formattedMessage = this.formatMessage('INFO', message, data);
    console.log(`[INFO] ${message}`);
    if (data) console.log(data);
    this.writeToFile(formattedMessage);
  }

  success(message, data = null) {
    const formattedMessage = this.formatMessage('SUCCESS', message, data);
    console.log(`[OK] ${message}`);
    if (data) console.log(data);
    this.writeToFile(formattedMessage);
  }

  warn(message, data = null) {
    const formattedMessage = this.formatMessage('WARN', message, data);
    console.warn(`[WARN] ${message}`);
    if (data) console.warn(data);
    this.writeToFile(formattedMessage);
  }

  error(message, error = null) {
    const formattedMessage = this.formatMessage('ERROR', message, error ? {
      message: error.message,
      stack: error.stack
    } : null);
    console.error(`[ERROR] ${message}`);
    if (error) console.error(error);
    this.writeToFile(formattedMessage);
  }

  section(title) {
    const separator = '═'.repeat(60);
    console.log('\n' + separator);
    console.log(title);
    console.log(separator);
    this.writeToFile(`\n${separator}\n${title}\n${separator}`);
  }
}

module.exports = new Logger();
