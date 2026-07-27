import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../server/uploads');
const regsDir = path.join(__dirname, '../registrations');

if (!fs.existsSync(regsDir)) {
  fs.mkdirSync(regsDir, { recursive: true });
}

const files = fs.readdirSync(uploadsDir);
let copied = 0;

for (const file of files) {
  if (file.endsWith('.pdf')) {
    const srcPath = path.join(uploadsDir, file);
    
    // Extract unitNo from "VIN__unitNo.pdf" or "unitNo.pdf"
    let unitNo = file;
    if (file.includes('__')) {
      unitNo = file.split('__')[1];
    }
    
    const destPath = path.join(regsDir, unitNo);
    fs.copyFileSync(srcPath, destPath);
    copied++;
  }
}

console.log(`Successfully copied ${copied} PDFs to ${regsDir}`);
