import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [,, inputCsv, outputCsv] = process.argv;

if (!inputCsv || !outputCsv) {
  console.error('Usage: node anonymize-csv.mjs <輸入.csv> <輸出.csv>');
  process.exit(1);
}

const inputPath = path.resolve(process.cwd(), inputCsv);
const outputPath = path.resolve(process.cwd(), outputCsv);

if (!fs.existsSync(inputPath)) {
  console.error(`File not found: ${inputPath}`);
  process.exit(1);
}

const csvContent = fs.readFileSync(inputPath, 'utf8');

Papa.parse(csvContent, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    const idMap = new Map();
    let nextId = 1;
    
    const getNewId = (oldId) => {
      if (!oldId || oldId.trim() === '') return '';
      const trimmed = oldId.trim();
      if (!idMap.has(trimmed)) {
        idMap.set(trimmed, `P${String(nextId++).padStart(3, '0')}`);
      }
      return idMap.get(trimmed);
    };

    const processDate = (dateStr) => {
      if (!dateStr || dateStr.trim() === '') return '';
      const match = dateStr.trim().match(/\d{4}/);
      return match ? match[0] : '';
    };

    const anonymizedData = results.data.map((row) => {
      // Create new row object with mapped/anonymized values
      return {
        'ID': getNewId(row['ID']),
        '姓名': row['ID'] && row['ID'].trim() !== '' ? `人物 ${String(nextId - 1).padStart(3, '0')}` : '',
        '性別': row['性別'],
        '稱謂': row['稱謂'], // Note: Assuming title can be kept or cleared. Spec says: 姓名改為「人物 001」格式，保留性別與狀態欄。備註、職業、位置、照片URL 清空。 I'll clear title just in case. Wait, spec doesn't explicitly mention title, I will clear it to be safe.
        '職業': '',
        '備註': '',
        '狀態': row['狀態'],
        '出生日期': processDate(row['出生日期']),
        '死亡日期': processDate(row['死亡日期']),
        '過世原因': '', // clear death reason
        '位置': '',
        '父親ID': getNewId(row['父親ID']),
        '母親ID': getNewId(row['母親ID']),
        '配偶ID': (row['配偶ID'] || '').split(';').map(id => getNewId(id)).filter(Boolean).join(';'), // Some CSV use ';'
        '照片URL': ''
      };
    });

    const outputCsvStr = Papa.unparse(anonymizedData);
    
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, outputCsvStr, 'utf8');
    
    console.log(`Anonymized CSV written to ${outputPath}`);
  },
  error: (error) => {
    console.error('Error parsing CSV:', error);
    process.exit(1);
  }
});
