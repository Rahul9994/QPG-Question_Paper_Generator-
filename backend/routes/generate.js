import { Router } from 'express';

const router = Router();

// Default model — change via OPENROUTER_MODEL in .env
const DEFAULT_MODEL = 'openai/gpt-4o-mini';

router.post('/', async (req, res) => {
  const { topic, difficulty, count } = req.body;

  if (!topic || !difficulty || !count) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['topic', 'difficulty', 'count'],
    });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured' });
  }

  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  const systemPrompt =
    'You are a technical MCQ generator. Return ONLY valid JSON. No markdown. No explanation. No code fences. No preamble.';

  const userPrompt = `Generate ${count} ${difficulty}-level MCQ questions on: "${topic}"

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
- Explanations should be educational (1-3 sentences)
- Vary question styles: conceptual, code-based, best-practice
- Ensure ${count} total questions`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'QPG - AI Question Paper Generator',
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[OpenRouter HTTP Error]', response.status, errBody);
      return res.status(502).json({
        error: 'OpenRouter API request failed',
        message: `HTTP ${response.status}: ${errBody}`,
      });
    }

    const json = await response.json();

    // Handle OpenRouter error payloads
    if (json.error) {
      console.error('[OpenRouter API Error]', json.error);
      return res.status(502).json({
        error: 'OpenRouter returned an error',
        message: json.error.message || JSON.stringify(json.error),
      });
    }

    let rawText = json.choices?.[0]?.message?.content?.trim();

    if (!rawText) {
      return res.status(502).json({
        error: 'Empty response from OpenRouter',
        message: 'The model returned no content. Try again or use a different model.',
      });
    }

    // Strip any accidental markdown code fences
    rawText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Find JSON boundaries in case of any leading/trailing text
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      rawText = rawText.slice(jsonStart, jsonEnd + 1);
    }

    const parsed = JSON.parse(rawText);

    // Validate structure
    if (!parsed.title || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response structure from AI');
    }

    if (parsed.questions.length === 0) {
      throw new Error('AI returned no questions');
    }

    // Ensure IDs are sequential
    parsed.questions = parsed.questions.map((q, i) => ({ ...q, id: i + 1 }));

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('[Generate Error]', err.message);

    if (err instanceof SyntaxError) {
      return res.status(500).json({
        error: 'Failed to parse AI response as valid JSON',
        message: 'The model returned malformed data. Please try again.',
      });
    }

    res.status(500).json({
      error: 'Failed to generate questions',
      message: err.message || 'Unexpected error occurred',
    });
  }
});

export default router;
