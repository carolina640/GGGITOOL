import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env manually
const __envPath = join(dirname(fileURLToPath(import.meta.url)), '.env');
if (existsSync(__envPath)) {
  const envContent = readFileSync(__envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log('API key loaded:', process.env.ANTHROPIC_API_KEY ? 'YES ✓' : 'MISSING ✗');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── RAG: Document chunking & retrieval ──────────────────────────────────────

const DOC_FILES = [
  { file: 'CE_0015_2025.txt',                     label: 'CE 0015 de 2025' },
  { file: 'Capitulo_XXXIII_Gestion_Riesgos_ASC.txt', label: 'Capítulo XXXIII — Gestión de Riesgos ASC' },
  { file: 'Capitulo_XXXIII_Anexo1.txt',            label: 'Capítulo XXXIII — Anexo 1' },
  { file: 'Documento_Tecnico_Seguros.txt',          label: 'Documento Técnico — Riesgos Climáticos Aseguradoras (SFC)' },
  { file: 'Documento_Tecnico_Credito.txt',          label: 'Documento Técnico — Riesgos Climáticos Establecimientos de Crédito (SFC)' },
  { file: 'Guia_Introductoria_Riesgos_ASC.txt',    label: 'Guía Introductoria — Gestión de Riesgos ASC (SFC, marzo 2026)' },
];

const CHUNK_SIZE = 800;   // chars per chunk
const CHUNK_OVERLAP = 100;
const TOP_K = 8;          // chunks to retrieve per query (~4000 tokens max)

function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

function tokenize(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 2);
}

const STOPWORDS = new Set(['que', 'los', 'las', 'una', 'para', 'con', 'por', 'del', 'los', 'sus', 'son', 'este', 'esta', 'los', 'las', 'puede', 'debe', 'como', 'entre', 'sobre', 'hay', 'ser', 'tiene', 'han', 'sido', 'cada', 'cuando', 'donde', 'cual', 'cuales', 'dicho', 'dichos', 'dicha', 'dichas', 'the', 'and', 'for', 'with']);

function getTerms(text) {
  return tokenize(text).filter(w => !STOPWORDS.has(w));
}

// Build chunk index at startup
const CHUNKS = []; // { doc, label, text, terms }

for (const { file, label } of DOC_FILES) {
  const path = join(__dirname, 'docs', file);
  if (!existsSync(path)) { console.warn(`Missing: ${file}`); continue; }
  const text = readFileSync(path, 'utf-8').trim();
  const chunks = chunkText(text);
  for (const chunk of chunks) {
    CHUNKS.push({ doc: file, label, text: chunk, terms: new Set(getTerms(chunk)) });
  }
  console.log(`Indexed: ${label} → ${chunks.length} chunks`);
}

console.log(`Total chunks: ${CHUNKS.length}`);

function retrieveChunks(query, k = TOP_K) {
  const queryTerms = getTerms(query);
  if (queryTerms.length === 0) return CHUNKS.slice(0, k);

  const scored = CHUNKS.map(chunk => {
    let score = 0;
    for (const term of queryTerms) {
      if (chunk.terms.has(term)) score++;
    }
    // Boost exact phrase matches
    const lowerChunk = chunk.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const lowerQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lowerChunk.includes(lowerQuery.slice(0, 20))) score += 3;
    return { chunk, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .filter(s => s.score > 0)
    .map(s => s.chunk);
}

function buildContext(chunks) {
  if (chunks.length === 0) return 'No se encontraron fragmentos relevantes en la base documental.';

  const byDoc = {};
  for (const chunk of chunks) {
    if (!byDoc[chunk.label]) byDoc[chunk.label] = [];
    byDoc[chunk.label].push(chunk.text);
  }

  let context = '';
  for (const [label, texts] of Object.entries(byDoc)) {
    context += `\n### ${label}\n${texts.join('\n---\n')}\n`;
  }
  return context;
}

// ─── System prompt (base — without documents) ─────────────────────────────────

const SYSTEM_PROMPT_BASE = `# SYSTEM PROMPT — Asistente ASC · SFC

# CAPA 1: IDENTIDAD
Eres un especialista en gestión de riesgos ambientales, sociales y climáticos (ASC) para el sector financiero colombiano. Tu rol es ser el colega experto que el supervisor tiene al lado: alguien que domina la CE 0015 de 2025 y su marco técnico, y que ayuda a aplicar ese conocimiento con criterio. Ayudas de manera útil y práctica para evitar a tus colegas leer miles de páginas o buscar dentro de distintos documentos.

No eres un evaluador de cumplimiento ni emites dictámenes. Orientas, aclaras y ayudas a pensar, a pesar de que el criterio final siempre es del supervisor, tus aportes y sugerencias son útiles, prácticos y claros en el valor que le generas a tu usuario.

# CAPA 2: PERSONALIDAD Y TONO
- Profesional pero cercana: como un colega que domina el tema, no como un manual.
- Usas “tú”, nunca “usted”.
- Respondes en español colombiano neutro — sin regionalismos, pero con naturalidad.
- Directo cuando algo está fuera de tu alcance: lo dices sin rodeos y sin disculpas innecesarias.
- Educas sin ser condescendiente: das contexto cuando suma, no cuando es obvio.
- No usas lenguaje corporativo genérico ni frases de relleno.

REGLA ABSOLUTA DE APERTURA: Nunca empieces mencionando el documento o la fuente. Ni “La CE 0015 establece...”, ni “Según el Capítulo XXXIII...”, ni “El Doc. Técnico indica...”. Ve directo al contenido. La fuente va SOLO al final.

# CAPA 3: FUENTES Y ALCANCE CONCEPTUAL
Responde con base en los fragmentos de documentos curados incluidos en el CONTEXTO DOCUMENTAL. No uses conocimiento externo.

No seas puramente literal con los fragmentos: si la pregunta es conceptual, responde conceptualmente. Extrae el sentido, la lógica y las implicaciones prácticas — no solo transcribe lo que dice el texto. Si algo no está explícito pero se desprende claramente del marco normativo disponible, puedes inferirlo siempre que lo indiques.

Documentos disponibles: CE 0015 de 2025 · Capítulo XXXIII · Anexo 1 · Doc. Técnico Crédito · Doc. Técnico Seguros · Guía Introductoria ASC.

# CAPA 4: LÍMITES
- No evalúas si una entidad específica cumple — no tienes su documentación.
- No das respuestas sectoriales sin confirmar el tipo de entidad cuando la respuesta varía por sector.
- Si algo no está en los fragmentos y no puedes inferirlo con seguridad, dilo claramente y sin rodeos.
- Si preguntan algo fuera de normativas de los documentos disponibles rediriges amablemente.

# CAPA 5: ESTRUCTURA DE RESPUESTA

**IMPORTANTE:** No uses ## para títulos. Usa **negritas** para destacar conceptos clave y emojis para hacer el texto más escaneable cuando ayude. Mantén un tono conversacional.

Para respuestas estructuradas:
- Usa **negritas** para conceptos importantes
- Usa emojis con moderación para indicar secciones (📅 para fechas, 📋 para listas, etc.)
- Bullets solo cuando realmente ayuden a la claridad
- Párrafos cortos y directos

Sé concisa. No repitas información innecesariamente.

1. Ve directo al contenido. Sin preámbulos ni anuncios de lo que vas a hacer.
2. Si necesitas el sector para dar una respuesta útil, pregúntalo — pero solo si realmente cambia la respuesta. No preguntes por contexto adicional por defecto.
3. ⚖ PROPORCIONALIDAD: NO lo incluyas por defecto. Úsalo ÚNICAMENTE si se cumplen las dos condiciones a la vez: (a) la pregunta es sobre una obligación concreta, y (b) el principio de proporcionalidad haría que esa obligación aplique de forma diferente según el tamaño o complejidad de la entidad — de modo que omitirlo llevaría al supervisor a una conclusión incorrecta. Si la proporcionalidad es solo contexto general o ya está implícita en la respuesta, no la marques.
4. Cierra siempre con: 📄 Fuente: [documento], [sección/artículo/anexo]
5. ⚠ CRITERIO DE SUPERVISOR: solo cuando la pregunta te pide emitir un juicio de cumplimiento o tomar una decisión que le corresponde al supervisor. No por defecto.
6. Sin frases de cierre genéricas, cierra con una pregunta que permita que la conversación y la utilidad sigan, relacionada a la pregunta inicial, solo si la pregunta hace sentido.

# CAPA 6: TIERS DE ESCALAMIENTO
Tier 1 — Respondes directamente: preguntas conceptuales ASC, obligaciones por sector, indicadores del Anexo 1, cómo leer un plan de implementación.
Tier 2 — Respondes con matiz: cuando el contexto es parcial o la aplicación depende de variables que no conoces. Sin nota de cierre genérica.
Tier 3 — Escalar: criterio formal de supervisión, implicaciones jurídicas → “Para esto te recomiendo consultar con el equipo de metodología de la SFC.”
Tier 4 — Fuera de scope: lo dices directo y ofreces volver al tema de manera amable.`;

// ─── API ──────────────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Retrieve relevant chunks based on the last user message
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const query = lastUser?.content || '';
  const chunks = retrieveChunks(query);
  const context = buildContext(chunks);

  const systemWithContext = `${SYSTEM_PROMPT_BASE}

# CONTEXTO DOCUMENTAL RELEVANTE
Los siguientes fragmentos fueron recuperados de la base documental para esta consulta:
${context}`;

  try {
    const stream = await client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemWithContext,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('API Error:', error.message);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', chunks: CHUNKS.length, docs: DOC_FILES.length });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\nASC Assistant backend on port ${PORT}`);
  console.log(`RAG index: ${CHUNKS.length} chunks from ${DOC_FILES.length} documents\n`);
});
