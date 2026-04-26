import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import mammoth from 'mammoth';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env') });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DOCS_DIR = join(__dirname, 'docs');
const REGISTRY_PATH = join(__dirname, 'file-registry.json');

const SUPPORTED = new Set(['.txt', '.pdf', '.docx']);

const files = readdirSync(DOCS_DIR).filter(f => SUPPORTED.has(extname(f).toLowerCase()));

if (!files.length) {
  console.error('No supported files (.txt, .pdf, .docx) found in backend/docs/');
  process.exit(1);
}

// Load existing registry to detect already-uploaded files
const existingRegistry = existsSync(REGISTRY_PATH)
  ? JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'))
  : {};

console.log(`Found ${files.length} files in docs/:\n${files.map(f => `  - ${f}`).join('\n')}\n`);

const registry = {};
const results = { uploaded: [], skipped: [], failed: [] };

for (const filename of files) {
  const filePath = join(DOCS_DIR, filename);
  const ext = extname(filename).toLowerCase();
  process.stdout.write(`Uploading ${filename} ... `);

  try {
    let fileBlob;
    let mimeType;

    if (ext === '.txt') {
      fileBlob = readFileSync(filePath);
      mimeType = 'text/plain';
    } else if (ext === '.pdf') {
      fileBlob = readFileSync(filePath);
      mimeType = 'application/pdf';
    } else if (ext === '.docx') {
      // Convert DOCX to plain text via mammoth, then upload as text/plain
      const result = await mammoth.extractRawText({ path: filePath });
      fileBlob = Buffer.from(result.value, 'utf-8');
      mimeType = 'text/plain';
    }

    const uploadName = ext === '.docx'
      ? filename.replace(/\.docx$/i, '.txt')
      : filename;

    const file = await client.beta.files.upload(
      { file: new File([fileBlob], uploadName, { type: mimeType }) },
      { headers: { 'anthropic-beta': 'files-api-2025-04-14' } }
    );

    registry[filename] = {
      file_id: file.id,
      uploaded_at: new Date().toISOString(),
      mime_type: mimeType,
    };

    console.log(`OK — ${file.id}`);
    results.uploaded.push(filename);

  } catch (err) {
    console.log(`FAILED — ${err.message}`);
    results.failed.push({ filename, error: err.message });
    // Keep old entry if available so the registry stays functional
    if (existingRegistry[filename]) {
      registry[filename] = existingRegistry[filename];
    }
  }
}

writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));

console.log('\n─────────────────────────────────────────');
console.log(`✅  Uploaded : ${results.uploaded.length} file(s)`);
if (results.skipped.length) console.log(`⏭  Skipped  : ${results.skipped.join(', ')}`);
if (results.failed.length) {
  console.log(`❌  Failed   : ${results.failed.length} file(s)`);
  results.failed.forEach(f => console.log(`    • ${f.filename}: ${f.error}`));
}
console.log('\nRegistry saved to backend/file-registry.json');
console.log(JSON.stringify(registry, null, 2));
