const KEYS = {
  DARK_MODE: 'qpg_dark_mode',
  ACTIVE_PAPER: 'qpg_active_paper',
  QUIZ_RESULTS: 'qpg_quiz_results',
  ARCHIVE: 'qpg_archive',
};

// ─── Archive (every composed paper, newest first) ──────────
// Kept per browser, so visitors of a public deployment each have their own.
export function getArchive() {
  try {
    const raw = localStorage.getItem(KEYS.ARCHIVE);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeArchive(list) {
  try {
    localStorage.setItem(KEYS.ARCHIVE, JSON.stringify(list));
  } catch {
    // ignore quota errors
  }
}

function newId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function addToArchive({ title, topic, difficulty, count, questions }) {
  const paper = {
    id: newId(),
    title,
    topic,
    difficulty,
    count: Number(count),
    questions,
    bestScore: null,
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  writeArchive([paper, ...getArchive()]);
  return paper;
}

/** Count an attempt and keep the best score. Returns the updated paper. */
export function recordAttempt(id, score) {
  let updated = null;
  writeArchive(
    getArchive().map((p) => {
      if (p.id !== id) return p;
      updated = {
        ...p,
        attempts: (p.attempts || 0) + 1,
        bestScore: p.bestScore === null || score > p.bestScore ? score : p.bestScore,
      };
      return updated;
    })
  );
  return updated;
}

export function removeFromArchive(id) {
  writeArchive(getArchive().filter((p) => p.id !== id));
}

// ─── Dark Mode ─────────────────────────────────────────────
export function getDarkMode() {
  try {
    const stored = localStorage.getItem(KEYS.DARK_MODE);
    if (stored !== null) return stored === 'true';
    // Default: detect system preference
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  } catch {
    return true;
  }
}

export function setDarkMode(value) {
  try {
    localStorage.setItem(KEYS.DARK_MODE, String(value));
  } catch {
    // ignore
  }
}

// ─── Active Paper (paper being quizzed) ────────────────────
export function getActivePaper() {
  try {
    const raw = localStorage.getItem(KEYS.ACTIVE_PAPER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActivePaper(paper) {
  try {
    localStorage.setItem(KEYS.ACTIVE_PAPER, JSON.stringify(paper));
  } catch {
    // ignore quota errors
  }
}

export function clearActivePaper() {
  try {
    localStorage.removeItem(KEYS.ACTIVE_PAPER);
  } catch {
    // ignore
  }
}

// ─── Quiz Results (latest attempt) ────────────────────────
export function getQuizResults() {
  try {
    const raw = localStorage.getItem(KEYS.QUIZ_RESULTS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setQuizResults(results) {
  try {
    localStorage.setItem(KEYS.QUIZ_RESULTS, JSON.stringify(results));
  } catch {
    // ignore
  }
}

export function clearQuizResults() {
  try {
    localStorage.removeItem(KEYS.QUIZ_RESULTS);
  } catch {
    // ignore
  }
}
