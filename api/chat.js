import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── RAG ─────────────────────────────────────────────────────────────────────

const DOC_FILES = [
  { file: 'CE_0015_2025.txt',                        label: 'CE 0015 de 2025' },
  { file: 'Capitulo_XXXIII_Gestion_Riesgos_ASC.txt', label: 'Capítulo XXXIII — Gestión de Riesgos ASC' },
  { file: 'Capitulo_XXXIII_Anexo1.txt',               label: 'Capítulo XXXIII — Anexo 1' },
  { file: 'Documento_Tecnico_Seguros.txt',             label: 'Documento Técnico — Riesgos Climáticos Aseguradoras (SFC)' },
  { file: 'Documento_Tecnico_Credito.txt',             label: 'Documento Técnico — Riesgos Climáticos Establecimientos de Crédito (SFC)' },
  { file: 'Guia_Introductoria_Riesgos_ASC.txt',       label: 'Guía Introductoria — Gestión de Riesgos ASC (SFC, marzo 2026)' },
];

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const TOP_K = 8;

function chunkText(text) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

const STOPWORDS = new Set(['que','los','las','una','para','con','por','del','sus','son','este','esta','puede','debe','como','entre','sobre','hay','ser','tiene','han','sido','cada','cuando','donde','cual','the','and','for','with']);

function getTerms(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
}

// Build index once per cold start
const CHUNKS = [];
const docsDir = join(process.cwd(), 'backend', 'docs');

for (const { file, label } of DOC_FILES) {
  const path = join(docsDir, file);
  if (!existsSync(path)) continue;
  const text = readFileSync(path, 'utf-8').trim();
  for (const chunk of chunkText(text)) {
    CHUNKS.push({ label, text: chunk, terms: new Set(getTerms(chunk)) });
  }
}

function retrieveChunks(query) {
  const queryTerms = getTerms(query);
  if (!queryTerms.length) return CHUNKS.slice(0, TOP_K);
  const lowerQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return CHUNKS
    .map(c => {
      let score = queryTerms.filter(t => c.terms.has(t)).length;
      if (c.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(lowerQuery.slice(0,20))) score += 3;
      return { c, score };
    })
    .sort((a,b) => b.score - a.score)
    .slice(0, TOP_K)
    .filter(s => s.score > 0)
    .map(s => s.c);
}

function buildContext(chunks) {
  if (!chunks.length) return 'No se encontraron fragmentos relevantes.';
  const byDoc = {};
  for (const chunk of chunks) {
    if (!byDoc[chunk.label]) byDoc[chunk.label] = [];
    byDoc[chunk.label].push(chunk.text);
  }
  return Object.entries(byDoc).map(([label, texts]) => `### ${label}\n${texts.join('\n---\n')}`).join('\n\n');
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT_BASE = `# SYSTEM PROMPT — Asistente ASC · SFC

# CAPA 1: IDENTIDAD
Eres un especialista en gestión de riesgos ambientales, sociales y climáticos (ASC) para el sector financiero colombiano. Tu rol es ser el colega experto que el supervisor tiene al lado: alguien que domina la CE 0015 de 2025 y su marco técnico, y que ayuda a aplicar ese conocimiento con criterio. Ayudas de manera útil y práctica para evitar a tus colegas leer miles de páginas o buscar dentro de distintos documentos.

No eres un evaluador de cumplimiento ni emites dictámenes. Orientas, aclaras y ayudas a pensar, a pesar de que el criterio final siempre es del supervisor, tus aportes y sugerencias son útiles, prácticos y claros en el valor que le generas a tu usuario.

# CAPA 2: PERSONALIDAD Y TONO
- Profesional pero cercana: como un colega que domina el tema, no como un manual.
- Usas "tú", nunca "usted".
- Respondes en español colombiano neutro — sin regionalismos, pero con naturalidad.
- Directo cuando algo está fuera de tu alcance: lo dices sin rodeos y sin disculpas innecesarias.
- Educas sin ser condescendiente: das contexto cuando suma, no cuando es obvio.
- No usas lenguaje corporativo genérico ni frases de relleno.

REGLA ABSOLUTA DE APERTURA: Nunca empieces mencionando el documento o la fuente. Ni "La CE 0015 establece...", ni "Según el Capítulo XXXIII...", ni "El Doc. Técnico indica...". Ve directo al contenido. La fuente va SOLO al final.

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
Tier 3 — Escalar: criterio formal de supervisión, implicaciones jurídicas → "Para esto te recomiendo consultar con el equipo de metodología de la SFC."
Tier 4 — Fuera de scope: lo dices directo y ofreces volver al tema de manera amable.`;

// ─── Handler — returns JSON (Vercel doesn't support true SSE streaming) ───────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const chunks = retrieveChunks(lastUser?.content || '');
  const context = buildContext(chunks);

  const system = `${SYSTEM_PROMPT_BASE}\n\n# CONTEXTO DOCUMENTAL RELEVANTE\n${context}`;

  try {
    // Accumulate full response — Vercel buffers SSE, so we return plain JSON
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1500,
      system,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const text = response.content[0]?.text || '';
    return res.status(200).json({ text });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
