import fs from 'fs';

export function writeFileIfNotExists(filePath: string, content: string) {
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping existing file: ${filePath}`);
    return;
  }
  fs.writeFileSync(filePath, content, { encoding: 'utf8' });
  console.log(`✅ Created: ${filePath}`);
}
