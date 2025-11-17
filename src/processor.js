/**
 * Procesador de archivos ZIP y conversión a JSON
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const iconv = require('iconv-lite');
const config = require('./config');
const logger = require('./logger');

class FileProcessor {
  /**
   * Extrae el archivo ZIP
   */
  extractZip(zipPath, outputDir) {
    try {
      logger.info(`Extrayendo ZIP: ${zipPath}`);

      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();

      let extractedFile = null;

      zipEntries.forEach(entry => {
        if (entry.entryName.endsWith('.txt')) {
          logger.info(`Encontrado archivo TXT: ${entry.entryName}`);
          zip.extractEntryTo(entry, outputDir, false, true);
          extractedFile = path.join(outputDir, entry.entryName);
        }
      });

      if (!extractedFile) {
        throw new Error('No se encontró archivo TXT en el ZIP');
      }

      logger.success('ZIP extraído correctamente');

      return extractedFile;
    } catch (error) {
      logger.error('Error extrayendo ZIP', error);
      throw error;
    }
  }

  /**
   * Convierte el archivo TXT a JSON
   */
  convertToJson(txtPath, outputJsonPath, version) {
    try {
      logger.info('Iniciando conversión TXT a JSON...');

      // Leer archivo con encoding correcto
      const content = fs.readFileSync(txtPath, config.TXT_ENCODING);
      const lines = content.split('\n');

      const postalCodesMap = {};
      let processedCount = 0;

      // Saltar primeras 2 líneas (header)
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split('|');
        if (parts.length < 15) continue;

        const codigoPostal = parts[0].trim();
        const colonia = parts[1].trim();
        const municipio = parts[3].trim();
        const estado = parts[4].trim();
        const ciudad = parts[5].trim();

        // Indexar por código postal
        if (!postalCodesMap[codigoPostal]) {
          postalCodesMap[codigoPostal] = {
            cp: codigoPostal,
            estado: estado,
            municipio: municipio,
            ciudad: ciudad || municipio,
            colonias: []
          };
        }

        // Agregar colonia (evitar duplicados)
        if (!postalCodesMap[codigoPostal].colonias.includes(colonia)) {
          postalCodesMap[codigoPostal].colonias.push(colonia);
        }

        processedCount++;

        if (processedCount % 10000 === 0) {
          logger.info(`Procesados ${processedCount.toLocaleString()} registros...`);
        }
      }

      const postalCodeCount = Object.keys(postalCodesMap).length;

      logger.success(`Total registros procesados: ${processedCount.toLocaleString()}`);
      logger.success(`Códigos postales únicos: ${postalCodeCount.toLocaleString()}`);

      // Asegurar que el directorio de salida existe
      const outputDir = path.dirname(outputJsonPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Guardar como JSON
      const jsonContent = JSON.stringify(postalCodesMap, null, 2);
      fs.writeFileSync(outputJsonPath, jsonContent, 'utf8');

      const fileSize = fs.statSync(outputJsonPath).size;
      const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

      logger.success(`Archivo JSON generado: ${fileSizeMB} MB`);

      return {
        recordCount: processedCount,
        postalCodeCount: postalCodeCount,
        fileSize: fileSize,
        filePath: outputJsonPath
      };
    } catch (error) {
      logger.error('Error convirtiendo a JSON', error);
      throw error;
    }
  }

  /**
   * Renombra el archivo TXT con formato de fecha
   */
  renameFile(originalPath, version) {
    try {
      const dir = path.dirname(originalPath);
      const newFileName = `${version}.txt`;
      const newPath = path.join(dir, newFileName);

      if (fs.existsSync(newPath) && newPath !== originalPath) {
        fs.unlinkSync(newPath);
      }

      if (newPath !== originalPath) {
        fs.renameSync(originalPath, newPath);
        logger.success(`Archivo renombrado a: ${newFileName}`);
      }

      return newPath;
    } catch (error) {
      logger.error('Error renombrando archivo', error);
      throw error;
    }
  }

  /**
   * Copia archivos al proyecto de Angular
   */
  async copyToAngularProject(txtPath, jsonPath) {
    try {
      const angularAssetsPath = path.join(__dirname, '../../../frontend/internet/src/assets');

      if (!fs.existsSync(angularAssetsPath)) {
        logger.warn('No se encontró el directorio de assets de Angular');
        return false;
      }

      // Copiar TXT
      const txtFileName = path.basename(txtPath);
      const txtDestPath = path.join(angularAssetsPath, txtFileName);
      fs.copyFileSync(txtPath, txtDestPath);
      logger.success(`Archivo TXT copiado a Angular: ${txtFileName}`);

      // Copiar JSON
      const jsonDestPath = path.join(angularAssetsPath, 'postal-codes.json');
      fs.copyFileSync(jsonPath, jsonDestPath);
      logger.success('Archivo JSON copiado a Angular: postal-codes.json');

      return true;
    } catch (error) {
      logger.error('Error copiando archivos a Angular', error);
      return false;
    }
  }
}

module.exports = new FileProcessor();
