// Point clouds the particles fly between. Each formation returns exactly `n`
// points (Float32Array, xyz). The mastery formation also returns `arc`, the
// order in which the score ring and check mark "draw" on.

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (r) => (r() + r() + r() - 1.5) / 1.5;

function shuffleInPlace(arr, stride, r, extra) {
  const count = arr.length / stride;
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    for (let k = 0; k < stride; k++) {
      const a = i * stride + k, b = j * stride + k;
      [arr[a], arr[b]] = [arr[b], arr[a]];
    }
    if (extra) [extra[i], extra[j]] = [extra[j], extra[i]];
  }
}

// ── 0 · Dust ────────────────────────────────────────────────────
export function dust(n, seed = 11) {
  const r = rng(seed);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    out[i * 3] = gauss(r) * 4.6;
    out[i * 3 + 1] = gauss(r) * 2.6;
    out[i * 3 + 2] = -2.8 + r() * 4.0;
  }
  return out;
}

// ── 1 · Sphere with orbital rings ──────────────────────────────
export function sphere(n, seed = 23) {
  const r = rng(seed);
  const out = new Float32Array(n * 3);
  const shell = Math.floor(n * 0.72);
  const ringA = Math.floor(n * 0.18);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < shell; i++) {
    const y = 1 - (2 * (i + 0.5)) / shell;
    const rad = Math.sqrt(1 - y * y);
    const th = i * golden;
    const R = 1.05 + gauss(r) * 0.012;
    out[i * 3] = Math.cos(th) * rad * R;
    out[i * 3 + 1] = y * R;
    out[i * 3 + 2] = Math.sin(th) * rad * R;
  }

  const ring = (start, count, R, tiltX, tiltZ) => {
    for (let k = 0; k < count; k++) {
      const a = r() * Math.PI * 2;
      const rr = R + gauss(r) * 0.014;
      let x = Math.cos(a) * rr, y = gauss(r) * 0.01, z = Math.sin(a) * rr;
      // tilt around X then Z
      let y2 = y * Math.cos(tiltX) - z * Math.sin(tiltX);
      let z2 = y * Math.sin(tiltX) + z * Math.cos(tiltX);
      let x3 = x * Math.cos(tiltZ) - y2 * Math.sin(tiltZ);
      let y3 = x * Math.sin(tiltZ) + y2 * Math.cos(tiltZ);
      const i = start + k;
      out[i * 3] = x3; out[i * 3 + 1] = y3; out[i * 3 + 2] = z2;
    }
  };
  ring(shell, ringA, 1.42, 1.2, 0.25);
  ring(shell + ringA, n - shell - ringA, 1.62, -0.55, -0.6);

  shuffleInPlace(out, 3, r);
  return out;
}

// ── 2 · The question paper ─────────────────────────────────────
// Built from strokes (lines, circles, discs) sampled evenly by length.
export function paper(n, seed = 37) {
  const r = rng(seed);
  const strokes = [];
  const W = 0.71, H = 1.0;

  const line = (x0, y0, x1, y1, density = 1, z = 0) =>
    strokes.push({ kind: 'line', x0, y0, x1, y1, z, density, len: Math.hypot(x1 - x0, y1 - y0) });
  const circle = (cx, cy, rad, density = 1) =>
    strokes.push({ kind: 'circle', cx, cy, rad, density, len: Math.PI * 2 * rad });
  const disc = (cx, cy, rad, density = 1) =>
    strokes.push({ kind: 'disc', cx, cy, rad, density, len: Math.PI * rad * rad * 40 });
  const words = (x0, x1, y, density = 1) => {
    let x = x0;
    while (x < x1) {
      const w = Math.min(0.05 + r() * 0.16, x1 - x);
      if (w > 0.02) line(x, y, x + w, y, density);
      x += w + 0.035;
    }
  };

  // Front page border + two sheets peeking out behind it
  line(-W, H, W, H, 1.3); line(W, H, W, -H, 1.3); line(W, -H, -W, -H, 1.3); line(-W, -H, -W, H, 1.3);
  for (const k of [1, 2]) {
    const o = 0.065 * k, z = -0.11 * k;
    line(W + o, H - o, W + o, -H - o, 0.55, z);
    line(W + o, -H - o, -W + o, -H - o, 0.55, z);
  }

  // Header: title, serial mark, rule
  line(-0.56, 0.83, 0.2, 0.83, 1.8); line(-0.56, 0.8, 0.05, 0.8, 1.4);
  circle(0.5, 0.82, 0.07, 1.6);
  line(-0.6, 0.68, 0.6, 0.68, 0.7);

  // Four questions: two rows of "text", then A–D answer bubbles in a 2×2 grid
  const filled = [1, 3, 0, 2];
  for (let q = 0; q < 4; q++) {
    const y0 = 0.52 - q * 0.37;
    words(-0.6, 0.58, y0, 1.0);
    words(-0.6, 0.12 + r() * 0.3, y0 - 0.07, 1.0);
    for (let o = 0; o < 4; o++) {
      const cx = o % 2 === 0 ? -0.56 : 0.06;
      const cy = y0 - 0.17 - Math.floor(o / 2) * 0.08;
      circle(cx, cy, 0.026, 1.6);
      if (o === filled[q]) disc(cx, cy, 0.02, 1.2);
      line(cx + 0.06, cy, cx + 0.2 + r() * 0.2, cy, 0.8);
    }
  }
  line(-0.06, -0.93, 0.06, -0.93, 1.2);

  const total = strokes.reduce((s, st) => s + st.len * st.density, 0);
  const out = new Float32Array(n * 3);
  let i = 0;
  strokes.forEach((st, si) => {
    const count = si === strokes.length - 1 ? n - i : Math.round((st.len * st.density / total) * n);
    for (let k = 0; k < count && i < n; k++, i++) {
      let x, y, z = (st.z || 0) + gauss(r) * 0.008;
      if (st.kind === 'line') {
        const u = r();
        x = st.x0 + (st.x1 - st.x0) * u + gauss(r) * 0.004;
        y = st.y0 + (st.y1 - st.y0) * u + gauss(r) * 0.004;
      } else if (st.kind === 'circle') {
        const a = r() * Math.PI * 2;
        x = st.cx + Math.cos(a) * st.rad; y = st.cy + Math.sin(a) * st.rad;
      } else {
        const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * st.rad;
        x = st.cx + Math.cos(a) * rr; y = st.cy + Math.sin(a) * rr;
      }
      out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
    }
  });

  // Tilt the stack so it reads as an object in space
  const ry = 0.24, rx = -0.1;
  for (let k = 0; k < n; k++) {
    let x = out[k * 3], y = out[k * 3 + 1], z = out[k * 3 + 2];
    const x1 = x * Math.cos(ry) + z * Math.sin(ry);
    const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
    const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
    const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
    out[k * 3] = x1; out[k * 3 + 1] = y2; out[k * 3 + 2] = z2;
  }

  shuffleInPlace(out, 3, r);
  return out;
}

// ── 3 · Score ring + check mark ────────────────────────────────
export function mastery(n, seed = 53) {
  const r = rng(seed);
  const out = new Float32Array(n * 3);
  const arc = new Float32Array(n).fill(-1);
  const ringN = Math.floor(n * 0.58);
  const innerN = Math.floor(n * 0.07);
  const checkN = Math.floor(n * 0.25);
  let i = 0;

  for (let k = 0; k < ringN; k++, i++) {
    const u = r();
    const a = u * Math.PI * 2;
    const R = 1.1 + gauss(r) * 0.03;
    out[i * 3] = Math.sin(a) * R;
    out[i * 3 + 1] = Math.cos(a) * R;
    out[i * 3 + 2] = gauss(r) * 0.03;
    arc[i] = u;
  }
  for (let k = 0; k < innerN; k++, i++) {
    const a = r() * Math.PI * 2;
    out[i * 3] = Math.sin(a) * 0.97;
    out[i * 3 + 1] = Math.cos(a) * 0.97;
    out[i * 3 + 2] = gauss(r) * 0.01;
  }
  const pts = [[-0.42, 0.02], [-0.12, -0.3], [0.46, 0.34]];
  const l1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
  const l2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
  for (let k = 0; k < checkN; k++, i++) {
    const u = r();
    const d = u * (l1 + l2);
    let x, y;
    if (d < l1) {
      const s = d / l1;
      x = pts[0][0] + (pts[1][0] - pts[0][0]) * s; y = pts[0][1] + (pts[1][1] - pts[0][1]) * s;
    } else {
      const s = (d - l1) / l2;
      x = pts[1][0] + (pts[2][0] - pts[1][0]) * s; y = pts[1][1] + (pts[2][1] - pts[1][1]) * s;
    }
    out[i * 3] = x + gauss(r) * 0.022;
    out[i * 3 + 1] = y + gauss(r) * 0.022;
    out[i * 3 + 2] = gauss(r) * 0.03;
    arc[i] = 1.0 + u * 0.3;
  }
  for (; i < n; i++) {
    const a = r() * Math.PI * 2, b = Math.acos(2 * r() - 1);
    const R = 1.3 + r() * 0.7;
    out[i * 3] = Math.sin(b) * Math.cos(a) * R;
    out[i * 3 + 1] = Math.sin(b) * Math.sin(a) * R;
    out[i * 3 + 2] = Math.cos(b) * R * 0.4;
  }

  shuffleInPlace(out, 3, r, arc);
  return { points: out, arc };
}
