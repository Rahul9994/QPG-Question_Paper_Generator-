const KEYS = {
  DARK_MODE: 'qpg_dark_mode',
  ACTIVE_PAPER: 'qpg_active_paper',
  QUIZ_RESULTS: 'qpg_quiz_results',
};

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
