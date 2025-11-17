const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Mock the logger to suppress output during tests
jest.mock('../src/logger', () => ({
  info: jest.fn(),
  success: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  section: jest.fn(),
}));

const processor = require('../src/processor');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const TEST_ZIP_PATH = path.join(FIXTURES_DIR, 'test.zip');
const EXTRACT_DIR = path.join(FIXTURES_DIR, 'extracted');
const EXPECTED_TXT_PATH = path.join(EXTRACT_DIR, 'test.txt');

// Create a dummy zip file for testing
beforeAll(() => {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }
  if (!fs.existsSync(EXTRACT_DIR)) {
    fs.mkdirSync(EXTRACT_DIR, { recursive: true });
  }

  const zip = new AdmZip();
  zip.addFile('test.txt', Buffer.from('hello world'));
  zip.addFile('another.file', Buffer.from('some other data'));
  zip.writeZip(TEST_ZIP_PATH);
});

// Clean up created files
afterAll(() => {
  fs.unlinkSync(TEST_ZIP_PATH);
  fs.rmSync(EXTRACT_DIR, { recursive: true, force: true });
});

describe('FileProcessor', () => {
  describe('extractZip', () => {
    it('should extract only the .txt file from a zip archive', () => {
      const extractedTxtPath = processor.extractZip(TEST_ZIP_PATH, EXTRACT_DIR);

      // Check that the returned path is correct
      expect(extractedTxtPath).toBe(EXPECTED_TXT_PATH);

      // Check that the .txt file exists
      expect(fs.existsSync(extractedTxtPath)).toBe(true);

      // Check that the content is correct
      const content = fs.readFileSync(extractedTxtPath, 'utf-8');
      expect(content).toBe('hello world');

      // Check that other files were not extracted
      const otherFilePath = path.join(EXTRACT_DIR, 'another.file');
      expect(fs.existsSync(otherFilePath)).toBe(false);
    });

    it('should throw an error if no .txt file is found', () => {
        const zip = new AdmZip();
        zip.addFile('no-txt-here.dat', Buffer.from('data'));
        const badZipPath = path.join(FIXTURES_DIR, 'bad.zip');
        zip.writeZip(badZipPath);

        expect(() => {
            processor.extractZip(badZipPath, EXTRACT_DIR);
        }).toThrow('No se encontró archivo TXT en el ZIP');

        fs.unlinkSync(badZipPath);
    });
  });
});
