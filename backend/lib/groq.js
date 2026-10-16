// Groq client with automatic model selection.
//
// Instead of hard-coding one model name (Groq retires models often), we read
// the live model list for the configured key, drop anything that isn't a chat
// LLM, rank the rest, and fall through the ranking when a model is rate
// limited, retired, or returns unusable output.

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const MODELS_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 60 * 1000;
const MAX_MODELS_PER_REQUEST = 4;

// Best-first ranking for structured MCQ generation. Entries are prefixes, so a
// newer point release of a family (qwen3.6 → qwen3.8) is picked up without a
// code change.
const RANKING = [
  'openai/gpt-oss-120b',
  'minimaxai/minimax-m',
  'qwen/qwen3',
  'moonshotai/kimi-k',
  'llama-3.3-70b',
  'meta-models/muse-spark',
  'meta-llama/llama-4-maverick',
  'deepseek-r1-distill-llama-70b',
  'openai/gpt-oss-20b',
  'meta-llama/llama-4-scout',
  'llama-3.1-8b',
];

// Used only when the model list can't be fetched (network blip etc.).
const STATIC_FALLBACK = ['openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'openai/gpt-oss-20b'];

// Speech, audio, moderation and tool-orchestration systems — not chat LLMs.
const NON_CHAT = /(whisper|tts|orpheus|playai|guard|safeguard|embed|compound|allam)/i;

export class GroqError extends Error {
  constructor(message, status = 502, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let modelsCache = { at: 0, models: null };
const cooldowns = new Map(); // model id → epoch ms when usable again
const retired = new Set();
let lastSuccess = null;

export function isConfigured() {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.GROQ_API_KEY.trim()}`,
    'Content-Type': 'application/json',
  };
}

async function fetchModels() {
  if (modelsCache.models && Date.now() - modelsCache.at < MODELS_TTL_MS) {
    return modelsCache.models;
  }
  const res = await fetch(`${GROQ_BASE}/models`, {
    headers: headers(),
    signal: AbortSignal.timeout(15000),
  });
  if (res.status === 401) throw new GroqError('GROQ_API_KEY was rejected by Groq (401). Check the key in backend/.env.', 401);
  if (!res.ok) throw new GroqError(`Could not list Groq models (HTTP ${res.status})`, 502);
  const json = await res.json();
  modelsCache = { at: Date.now(), models: json.data || [] };
  return modelsCache.models;
}

function versionAfter(id, prefix) {
  // 'qwen/qwen3' + '.8-27b' → 8, 'minimaxai/minimax-m' + '2.7' → 2.7; only compared within a family.
  const m = id.slice(prefix.length).match(/^\.?(\d+(?:\.\d+)?)/);
  return m ? Math.min(parseFloat(m[1]) * 10, 99) : 0;
}

export function scoreModel(model) {
  const id = model.id.toLowerCase();
  const rank = RANKING.findIndex((p) => id.startsWith(p));
  if (rank !== -1) {
    return (RANKING.length - rank) * 100 + versionAfter(id, RANKING[rank]);
  }
  // Unknown (probably newer) model: rank by parameter count, penalise small tiers.
  const size = id.match(/(\d+(?:\.\d+)?)b\b/);
  let score = size ? Math.min(Math.log2(parseFloat(size[1])) * 90, 850) : 350;
  if (/(instant|mini|nano|lite|small)/.test(id)) score -= 150;
  return score;
}

export function rankModels(models) {
  return models
    .filter((m) => m.active !== false && !NON_CHAT.test(m.id) && !retired.has(m.id))
    .sort((a, b) => scoreModel(b) - scoreModel(a))
    .map((m) => m.id);
}

/** Ordered list of models to try. GROQ_MODEL (optional) pins a model to the front. */
export async function getPlan() {
  let ranked;
  try {
    ranked = rankModels(await fetchModels());
  } catch (err) {
    if (err.status === 401) throw err;
    ranked = STATIC_FALLBACK.filter((id) => !retired.has(id));
  }

  const pinned = process.env.GROQ_MODEL?.trim();
  if (pinned) ranked = [pinned, ...ranked.filter((id) => id !== pinned)];

  const now = Date.now();
  const ready = ranked.filter((id) => (cooldowns.get(id) || 0) <= now);
  return ready.length ? ready : ranked;
}

export async function getStatus() {
  if (!isConfigured()) return { provider: 'groq', configured: false, model: null, candidates: [] };
  const plan = await getPlan();
  const model = lastSuccess && plan.includes(lastSuccess) ? lastSuccess : plan[0] || null;
  return {
    provider: 'groq',
    configured: true,
    model,
    label: model ? prettyName(model) : null,
    source: process.env.GROQ_MODEL?.trim() ? 'pinned' : 'auto',
    candidates: plan.slice(0, 6),
  };
}

export function prettyName(id) {
  const name = id.split('/').pop();
  return name
    .split('-')
    .filter((t) => t && t !== 'instruct' && !/^\d{4}$/.test(t))
    .map((t) => {
      if (/^\d+(\.\d+)?b$/i.test(t)) return t.toUpperCase();
      if (/^(gpt|oss)$/i.test(t)) return t.toUpperCase();
      return t.charAt(0).toUpperCase() + t.slice(1);
    })
    .join(' ')
    .replace('GPT OSS', 'GPT-OSS');
}

// Per-family knobs so reasoning models don't leak their thinking into the JSON.
function familyParams(id) {
  if (id.startsWith('openai/gpt-oss')) return { reasoning_effort: 'low', include_reasoning: false };
  if (/(qwen3|deepseek-r1|minimax)/i.test(id)) return { reasoning_format: 'hidden' };
  return {};
}

async function callModel(model, { system, user, maxTokens }, { json, tuned }) {
  const body = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_completion_tokens: maxTokens,
    ...(json && { response_format: { type: 'json_object' } }),
    ...(tuned && familyParams(model)),
  };

  try {
    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const payload = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, payload, retryAfter: Number(res.headers.get('retry-after')) || 0 };
  } catch (err) {
    return { status: 0, ok: false, payload: { error: { message: err.message } } };
  }
}

function extractContent(payload) {
  let text = payload?.choices?.[0]?.message?.content || '';
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) text = text.slice(start, end + 1);
  return text;
}

/**
 * Ask the best available model for JSON. `validate` receives the parsed object
 * and must return the cleaned result or throw — a throw moves on to the next model.
 */
export async function generateJSON({ system, user, maxTokens = 6000, validate = (x) => x }) {
  if (!isConfigured()) {
    throw new GroqError('GROQ_API_KEY is not configured. Add it to backend/.env and restart the server.', 500);
  }

  const plan = (await getPlan()).slice(0, MAX_MODELS_PER_REQUEST);
  const failures = [];

  for (const model of plan) {
    for (const variant of [{ json: true, tuned: true }, { json: false, tuned: false }]) {
      const r = await callModel(model, { system, user, maxTokens }, variant);
      const message = r.payload?.error?.message || `HTTP ${r.status}`;
      const code = r.payload?.error?.code || '';

      if (r.ok) {
        try {
          const data = validate(JSON.parse(extractContent(r.payload)));
          lastSuccess = model;
          return { data, model };
        } catch (err) {
          failures.push(`${model}: ${err.message}`);
          break;
        }
      }

      if (r.status === 401) throw new GroqError('GROQ_API_KEY was rejected by Groq (401). Check the key in backend/.env.', 401);

      if (r.status === 404 || /decommission|not found|does not exist/i.test(message) || code === 'model_decommissioned') {
        retired.add(model);
        failures.push(`${model}: unavailable`);
        break;
      }
      if (r.status === 429) {
        cooldowns.set(model, Date.now() + Math.max(r.retryAfter, 20) * 1000);
        failures.push(`${model}: rate limited`);
        break;
      }
      // A 400 on the tuned/JSON-mode request is usually an unsupported
      // parameter or a json_validate_failed — retry the same model plainly.
      if (r.status === 400 && variant.json) continue;

      failures.push(`${model}: ${message}`);
      break;
    }
  }

  throw new GroqError('All Groq models failed to produce a valid paper. Please try again.', 502, failures);
}
