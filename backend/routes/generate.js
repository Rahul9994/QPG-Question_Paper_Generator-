import { Router } from 'express';
import { generateJSON, GroqError, prettyName } from '../lib/groq.js';

const router = Router();

const LETTERS = ['A', 'B', 'C', 'D'];

// A public deployment shares one Groq key, so cap generations per visitor.
// In-memory: per server instance, which is enough to stop casual abuse.
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = Number(process.env.GENERATE_LIMIT_PER_15MIN) || 12;
const hits = new Map(); // ip → timestamps

function rateLimit(req, res, next) {
  const now = Date.now();
  const ip = req.ip || 'unknown';
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    const retryIn = Math.ceil((RATE_WINDOW_MS - (now - recent[0])) / 60000);
    res.set('Retry-After', String(retryIn * 60));
    return res.status(429).json({
      error: 'Too many papers',
      message: `You've composed ${RATE_MAX} papers in the last 15 minutes. Please try again in about ${retryIn} min.`,
    });
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  next();
}

// Clean up the model's paper; throws if it isn't usable so the next model is tried.
function normalizePaper(parsed, count) {
  if (!parsed || typeof parsed.title !== 'string' || !Array.isArray(parsed.questions)) {
    throw new Error('Invalid response structure from AI');
  }

  const questions = parsed.questions
    .map((q) => {
      let options = q?.options;
      if (Array.isArray(options)) {
        options = Object.fromEntries(options.slice(0, 4).map((text, i) => [LETTERS[i], String(text)]));
      }
      const correct = String(q?.correct ?? '').trim().charAt(0).toUpperCase();
      if (!q?.question || !options || !LETTERS.every((l) => options[l]) || !LETTERS.includes(correct)) {
        return null;
      }
      return {
        question: String(q.question).trim(),
        options: Object.fromEntries(LETTERS.map((l) => [l, String(options[l]).trim()])),
        correct,
        explanation: String(q.explanation || '').trim(),
      };
    })
    .filter(Boolean)
    .slice(0, count)
    .map((q, i) => ({ id: i + 1, ...q }));

  if (questions.length < Math.ceil(count * 0.6)) {
    throw new Error(`Only ${questions.length}/${count} usable questions`);
  }

  return { title: parsed.title.trim(), questions };
}

router.post('/', rateLimit, async (req, res) => {
  const { difficulty, count } = req.body;
  const topic = String(req.body.topic || '').trim().slice(0, 120);

  if (!topic || !difficulty || !count) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['topic', 'difficulty', 'count'],
    });
  }

  if (!['easy', 'medium', 'hard'].includes(String(difficulty).toLowerCase())) {
    return res.status(400).json({ error: 'Invalid difficulty', message: 'Difficulty must be easy, medium or hard.' });
  }

  const n = Math.min(Math.max(parseInt(count, 10) || 10, 1), 20);

  const systemPrompt =
    'You are a technical MCQ generator. Return ONLY valid JSON. No markdown. No explanation. No code fences. No preamble.';

  const userPrompt = `Generate ${n} ${difficulty}-level MCQ questions on: "${topic}"

Return ONLY this exact JSON structure (no markdown, no extra text):
{
  "title": "descriptive quiz title here",
  "questions": [
    {
      "id": 1,
      "question": "clear question text here",
      "options": {
        "A": "option A text",
        "B": "option B text",
        "C": "option C text",
        "D": "option D text"
      },
      "correct": "A",
      "explanation": "concise explanation of why this answer is correct"
    }
  ]
}

Rules:
- Make questions practical and scenario-based
- Ensure all 4 options are plausible but only 1 is correct
- The "correct" field must be one of: "A", "B", "C", or "D"
- Vary which letter is correct across questions
- Explanations should be educational (1-3 sentences)
- Vary question styles: conceptual, code-based, best-practice
- Ensure ${n} total questions`;

  try {
    const { data, model } = await generateJSON({
      system: systemPrompt,
      user: userPrompt,
      // Kept under Groq's free-tier per-request token budget.
      maxTokens: Math.min(1200 + n * 300, 7000),
      validate: (parsed) => normalizePaper(parsed, n),
    });

    res.json({ success: true, data, model: { id: model, label: prettyName(model) } });
  } catch (err) {
    const status = err instanceof GroqError ? err.status : 500;
    console.error('[Generate Error]', err.message, err.details || '');
    res.status(status).json({
      error: 'Failed to generate questions',
      message: err.message || 'Unexpected error occurred',
      attempts: err.details,
    });
  }
});

export default router;
