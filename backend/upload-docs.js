import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env') });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DOCS_DIR = join(__dirname, 'docs');
const REGISTRY_PATH = join(__dirname, 'file-registry.json');

const files = readdirSync(DOCS_DIR).filter(f => extname(f) === '.txt');

if (!files.length) {
  console.error('No .txt files found in backend/docs/');
  process.exit(1);
}

console.log(`Found ${files.length} files to upload:\n${files.map(f => `  - ${f}`).join('\n')}\n`);

const registry = {};

for (const filename of files) {
  const filePath = join(DOCS_DIR, filename);
  const content = readFileSync(filePath);

  process.stdout.write(`Uploading ${filename} ... `);

  const file = await client.beta.files.upload(
    {
      file: new File([content], filename, { type: 'text/plain' }),
    },
    {
      headers: { 'anthropic-beta': 'files-api-2025-04-14' },
    }
  );

  registry[filename] = {
    file_id: file.id,
    uploaded_at: new Date().toISOString(),
  };

  console.log(`OK — ${file.id}`);
}

writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
console.log(`\nRegistry saved to backend/file-registry.json`);
console.log(JSON.stringify(registry, null, 2));
