import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const root = path.resolve(projectRoot, 'public/images');
const dirs = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort((a, b) => a.localeCompare(b, 'zh-CN'));

for (const d of dirs) {
  const p = path.join(root, d);
  const files = fs
    .readdirSync(p)
    .filter((f) => f.toLowerCase().endsWith('.webp'))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));

  console.log(`## ${d}\n`);
  for (const f of files) console.log(`/images/${d}/${f}`);
  console.log('');
}

