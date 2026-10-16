// The hero reel: a 15-second, 60fps motion-graphics film rendered live in WebGL.
// Everything time-based is a function of `t` (0 → DURATION) so any frame can be
// reproduced exactly, and the last frame flows straight into the first.

export const DURATION = 15;
export const FPS = 60;
export const TOTAL_FRAMES = DURATION * FPS;

// Formations: 0 dust · 1 sphere · 2 question paper · 3 score ring + check
export const SEGMENTS = [
  { t0: 0.0,  t1: 2.2,  from: 0, to: 0 },
  { t0: 2.2,  t1: 3.8,  from: 0, to: 1 },
  { t0: 3.8,  t1: 6.0,  from: 1, to: 1 },
  { t0: 6.0,  t1: 7.6,  from: 1, to: 2 },
  { t0: 7.6,  t1: 10.0, from: 2, to: 2 },
  { t0: 10.0, t1: 11.6, from: 2, to: 3 },
  { t0: 11.6, t1: 13.4, from: 3, to: 3 },
  { t0: 13.4, t1: 15.0, from: 3, to: 0 },
];

export const CHAPTERS = [
  { at: 0.0,  n: 'I',   title: 'Noise',        line: 'Every question begins as noise.' },
  { at: 2.2,  n: 'II',  title: 'Intelligence', line: 'An engine gives it form.' },
  { at: 6.0,  n: 'III', title: 'Composition',  line: 'Composed into a paper.' },
  { at: 10.0, n: 'IV',  title: 'Mastery',      line: 'Mastered by you.' },
  { at: 13.4, n: 'V',   title: 'Return',       line: 'And then, again.' },
];

const FLARES = [0.0, 2.2, 6.0, 10.0, 13.4];

const smooth = (x) => x * x * (3 - 2 * x);
const clamp01 = (x) => Math.min(Math.max(x, 0), 1);

export function morphAt(t) {
  const seg = SEGMENTS.find((s) => t >= s.t0 && t < s.t1) || SEGMENTS[SEGMENTS.length - 1];
  const prog = seg.from === seg.to ? 1 : clamp01((t - seg.t0) / (seg.t1 - seg.t0));
  return { from: seg.from, to: seg.to, prog };
}

export function chapterAt(t) {
  let idx = 0;
  CHAPTERS.forEach((c, i) => { if (t >= c.at) idx = i; });
  return idx;
}

/** Anamorphic light sweep at the top of each chapter → { x (-1..1), strength }. */
export function flareAt(t) {
  for (const ts of FLARES) {
    // Wrap so the sweep at 0s also covers the tail of the previous loop.
    let dt = t - ts;
    if (dt < -1) dt += DURATION;
    const u = (dt + 0.25) / 1.7;
    if (u >= 0 && u <= 1) {
      const s = Math.sin(u * Math.PI);
      return { x: -1.15 + 2.3 * smooth(u), strength: s * s };
    }
  }
  return { x: 0, strength: 0 };
}

/** Score-ring fill (0 → 1.3: ring first, then the check mark draws). */
export function fillAt(t) {
  if (t < 10.7) return 0;
  if (t > 13.4) return 1.3;
  const u = clamp01((t - 10.7) / 1.9);
  return 1.3 * (1 - Math.pow(1 - u, 3));
}

/** "HH:MM:SS:FF" at 60fps. */
export function timecode(t) {
  const frame = Math.min(Math.floor(t * FPS), TOTAL_FRAMES - 1);
  const s = Math.floor(frame / FPS);
  const f = frame % FPS;
  return `00:00:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}
