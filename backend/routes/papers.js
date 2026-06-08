import { Router } from 'express';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '..', 'db.json');

const router = Router();

async function readDB() {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    const empty = { papers: [] };
    await writeDB(empty);
    return empty;
  }
}

async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/papers — return all papers (newest first)
router.get('/', async (_req, res) => {
  try {
    const db = await readDB();
    res.json({ success: true, data: db.papers });
  } catch (err) {
    console.error('[Papers GET Error]', err.message);
    res.status(500).json({ error: 'Failed to read papers', message: err.message });
  }
});

// POST /api/papers — save a new paper
router.post('/', async (req, res) => {
  try {
    const { title, topic, difficulty, count, questions } = req.body;

    if (!title || !topic || !difficulty || !count || !Array.isArray(questions)) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'topic', 'difficulty', 'count', 'questions'],
      });
    }

    const db = await readDB();

    const newPaper = {
      id: nanoid(),
      title,
      topic,
      difficulty,
      count: Number(count),
      questions,
      bestScore: null,
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    db.papers.unshift(newPaper); // newest first
    await writeDB(db);

    res.status(201).json({ success: true, data: newPaper });
  } catch (err) {
    console.error('[Papers POST Error]', err.message);
    res.status(500).json({ error: 'Failed to save paper', message: err.message });
  }
});

// PATCH /api/papers/:id — update best score + increment attempts
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;

    if (score === undefined || score === null) {
      return res.status(400).json({ error: 'score is required' });
    }

    const db = await readDB();
    const paper = db.papers.find((p) => p.id === id);

    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    paper.attempts = (paper.attempts || 0) + 1;
    if (paper.bestScore === null || score > paper.bestScore) {
      paper.bestScore = score;
    }

    await writeDB(db);
    res.json({ success: true, data: paper });
  } catch (err) {
    console.error('[Papers PATCH Error]', err.message);
    res.status(500).json({ error: 'Failed to update paper', message: err.message });
  }
});

// DELETE /api/papers/:id — remove a paper
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();
    const index = db.papers.findIndex((p) => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    db.papers.splice(index, 1);
    await writeDB(db);

    res.json({ success: true, message: `Paper ${id} deleted` });
  } catch (err) {
    console.error('[Papers DELETE Error]', err.message);
    res.status(500).json({ error: 'Failed to delete paper', message: err.message });
  }
});

export default router;
