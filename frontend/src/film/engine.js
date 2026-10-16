// WebGL2 renderer for the hero reel: a "black silk" light field behind
// additive gold particles that morph between formations on the reel timeline.

import { DURATION, FPS, morphAt, flareAt, fillAt } from './reel.js';
import { dust, sphere, paper, mastery } from './formations.js';

const TAU = Math.PI * 2;

const QUAD_VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const SILK_FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uLoop;
uniform float uFrame;
uniform vec2 uFocus;
uniform float uGlow;
uniform vec3 uFlare;
out vec4 outColor;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = r * p * 2.02 + 3.1; a *= 0.5; }
  return v;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  // The warp travels around a circle, so frame 900 meets frame 0 seamlessly.
  vec2 c = vec2(cos(uLoop), sin(uLoop));
  vec2 q = vec2(fbm(p * 1.3 + c * 0.55), fbm(p * 1.3 + vec2(4.7, 1.9) - c * 0.55));
  float f = fbm(p * 1.1 + q * 1.9 + c.yx * 0.35);
  float folds = sin(f * 10.0 + p.x * 1.5 - p.y * 2.0);
  float sheen = pow(0.5 + 0.5 * folds, 10.0);
  float body = smoothstep(0.25, 0.85, f);

  vec3 ink = vec3(0.018, 0.016, 0.015);
  vec3 gold = vec3(0.86, 0.68, 0.40);
  vec3 hot = vec3(1.0, 0.9, 0.72);

  float d = length((p - uFocus) * vec2(0.8, 1.0));
  float pool = exp(-d * d * 2.4);
  float spread = smoothstep(1.7, 0.1, d);

  vec3 col = ink;
  col += gold * body * 0.05 * spread * uGlow;
  col += mix(gold, hot, sheen) * sheen * 0.17 * spread * uGlow;
  col += gold * pool * 0.09 * uGlow;

  // Anamorphic flare: long horizontal streak + hot core
  vec2 fp = p - uFlare.xy;
  float streak = exp(-abs(fp.y) * 95.0) * exp(-abs(fp.x) * 0.85);
  float core = exp(-length(fp) * 13.0);
  col += (vec3(1.0, 0.85, 0.6) * streak * 0.6 + hot * core * 0.55) * uFlare.z;

  float v = smoothstep(1.35, 0.2, length(p * vec2(0.78, 1.0)));
  col *= mix(0.22, 1.0, v);
  col += (hash(gl_FragCoord.xy + fract(uFrame * 0.618) * 317.0) - 0.5) * 0.03;

  outColor = vec4(col, 1.0);
}`;

const PARTICLE_VERT = `#version 300 es
precision highp float;
in vec3 aF0; in vec3 aF1; in vec3 aF2; in vec3 aF3;
in vec4 aSeed;   // x stagger · y size · z hue · w phase
in float aArc;   // draw order on the score ring, -1 elsewhere
uniform mat4 uProj;
uniform mat4 uView;
uniform float uFrom, uTo, uProg;
uniform float uLoop, uDpr, uScale, uFill, uFocal, uIntensity;
uniform vec2 uOffset;
out vec3 vColor;
out float vAlpha;

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0, -s, 0, 1, 0, s, 0, c); }

vec3 shape(float i) {
  if (i < 0.5) {
    return aF0 + vec3(sin(uLoop + aSeed.w * 6.28), cos(2.0 * uLoop + aSeed.w * 4.0), sin(uLoop + aSeed.w * 9.0)) * 0.14;
  }
  if (i < 1.5) return rotY(2.0 * uLoop) * aF1;
  if (i < 2.5) return aF2 + vec3(0.0, sin(uLoop * 2.0 + aF2.x * 2.0) * 0.012, 0.0);
  return aF3;
}

void main() {
  float local = clamp((uProg - aSeed.x * 0.35) / 0.65, 0.0, 1.0);
  local = local * local * (3.0 - 2.0 * local);
  vec3 p = mix(shape(uFrom), shape(uTo), local);

  // Swirl while in flight
  float flight = sin(local * 3.14159);
  p += vec3(sin(aSeed.w * 30.0 + uLoop * 2.0), cos(aSeed.w * 21.0 - uLoop * 2.0), sin(aSeed.w * 17.0)) * flight * 0.38;
  p = rotY(flight * (aSeed.x - 0.5) * 1.4) * p;

  vec4 view = uView * vec4(p * uScale, 1.0);
  vec4 clip = uProj * view;
  clip.xy += uOffset * clip.w;
  gl_Position = clip;

  float depth = -view.z;
  float blur = abs(depth - uFocal);
  float size = mix(1.2, 3.2, aSeed.y * aSeed.y) * (4.8 / depth) * (1.0 + blur * 0.9);
  gl_PointSize = clamp(size * 3.0 * uDpr, 1.0, 72.0);

  vec3 deep = vec3(0.62, 0.43, 0.2), mid = vec3(0.95, 0.77, 0.47), hi = vec3(1.0, 0.96, 0.86);
  vec3 col = mix(deep, mid, aSeed.z);
  col = mix(col, hi, step(0.93, aSeed.z));

  float twinkle = 0.72 + 0.28 * sin(uLoop * 3.0 + aSeed.w * 40.0);
  float inRing = (uFrom > 2.5 ? 1.0 - local : 0.0) + (uTo > 2.5 ? local : 0.0);
  float drawn = aArc < 0.0 ? 1.0 : mix(0.14, 1.25, step(aArc, uFill));
  float alpha = twinkle * mix(1.0, drawn, inRing) / (1.0 + blur * 1.3);
  alpha *= smoothstep(0.6, 1.6, depth);

  vColor = col;
  vAlpha = alpha * uIntensity;
}`;

const PARTICLE_FRAG = `#version 300 es
precision highp float;
in vec3 vColor;
in float vAlpha;
out vec4 outColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r2 = dot(d, d) * 4.0;
  float a = (exp(-r2 * 18.0) + exp(-r2 * 3.5) * 0.3) * vAlpha;
  if (a < 0.003) discard;
  outColor = vec4(vColor * a, 1.0);
}`;

// ── tiny matrix helpers (column-major) ──────────────────────────
function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function lookAt(eye, target, up) {
  let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
  let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
  let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
  l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return new Float32Array([
    xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1,
  ]);
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
  return sh;
}

function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const uniforms = {};
  const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const { name } = gl.getActiveUniform(p, i);
    uniforms[name] = gl.getUniformLocation(p, name);
  }
  return { p, u: uniforms };
}

/**
 * createFilm(canvas, { onFrame }) → controller, or null without WebGL2.
 * onFrame(t) is called once per rendered frame with the reel time in seconds.
 */
export function createFilm(canvas, { onFrame, still = false } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;

  let silk, dots;
  try {
    silk = program(gl, QUAD_VERT, SILK_FRAG);
    dots = program(gl, PARTICLE_VERT, PARTICLE_FRAG);
  } catch (err) {
    console.warn('[film] shader error', err);
    return null;
  }

  // Full-screen quad
  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(silk.p, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  // Particles
  const w = window.innerWidth;
  const N = w >= 1200 ? 12000 : w >= 700 ? 9000 : 6000;
  const ring = mastery(N);
  const seeds = new Float32Array(N * 4);
  for (let i = 0; i < N * 4; i++) seeds[i] = Math.random();

  const dotVao = gl.createVertexArray();
  gl.bindVertexArray(dotVao);
  const attr = (name, data, size) => {
    const loc = gl.getAttribLocation(dots.p, name);
    if (loc < 0) return;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  attr('aF0', dust(N), 3);
  attr('aF1', sphere(N), 3);
  attr('aF2', paper(N), 3);
  attr('aF3', ring.points, 3);
  attr('aSeed', seeds, 4);
  attr('aArc', ring.arc, 1);
  gl.bindVertexArray(null);

  // ── sizing & adaptive quality ─────────────────────────────────
  let dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  let width = 1, height = 1;
  const layout = { scale: 0.76, offset: [0.36, 0.08] };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));
    canvas.width = width;
    canvas.height = height;
    const aspect = rect.width / Math.max(rect.height, 1);
    if (aspect < 0.85) { layout.scale = 0.35; layout.offset = [0, 0.56]; }
    else if (aspect < 1.25) { layout.scale = 0.66; layout.offset = [0.15, 0.25]; }
    else { layout.scale = 0.76; layout.offset = [0.36, 0.08]; }
  }

  const ro = new ResizeObserver(() => { resize(); if (still || !running) renderAt(lastT); });
  ro.observe(canvas);
  resize();

  // ── pointer parallax (smoothed) ───────────────────────────────
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

  function renderAt(t) {
    lastT = t;
    const loop = (t / DURATION) * TAU;
    const aspect = width / height;
    const { from, to, prog } = morphAt(t);
    const flare = flareAt(t);

    pointer.sx += (pointer.x - pointer.sx) * 0.05;
    pointer.sy += (pointer.y - pointer.sy) * 0.05;

    const dist = 4.75 + 0.4 * Math.cos(loop);
    const yaw = 0.22 * Math.sin(loop) + pointer.sx * 0.2;
    const pitch = 0.12 * Math.sin(loop * 2) + pointer.sy * 0.12;
    const eye = [Math.sin(yaw) * dist, Math.sin(pitch) * dist, Math.cos(yaw) * dist];

    const focus = [layout.offset[0] * 0.5 * aspect, layout.offset[1] * 0.5];
    const glow = 0.8 - 0.2 * Math.cos(loop);

    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    gl.useProgram(silk.p);
    gl.uniform2f(silk.u.uRes, width, height);
    gl.uniform1f(silk.u.uLoop, loop);
    gl.uniform1f(silk.u.uFrame, Math.floor(t * FPS));
    gl.uniform2f(silk.u.uFocus, focus[0], focus[1]);
    gl.uniform1f(silk.u.uGlow, glow);
    gl.uniform3f(silk.u.uFlare, focus[0] + flare.x * 0.9 * aspect * 0.5, focus[1] + 0.02, flare.strength);
    gl.bindVertexArray(quadVao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(dots.p);
    gl.uniformMatrix4fv(dots.u.uProj, false, perspective(0.56, aspect, 0.1, 50));
    gl.uniformMatrix4fv(dots.u.uView, false, lookAt(eye, [0, 0, 0], [0, 1, 0]));
    gl.uniform1f(dots.u.uFrom, from);
    gl.uniform1f(dots.u.uTo, to);
    gl.uniform1f(dots.u.uProg, prog);
    gl.uniform1f(dots.u.uLoop, loop);
    gl.uniform1f(dots.u.uDpr, dpr * Math.min(height / dpr / 900, 1.25));
    gl.uniform1f(dots.u.uScale, layout.scale);
    gl.uniform1f(dots.u.uFill, fillAt(t));
    gl.uniform1f(dots.u.uFocal, dist);
    gl.uniform1f(dots.u.uIntensity, N > 9000 ? 0.62 : 0.75);
    gl.uniform2f(dots.u.uOffset, layout.offset[0], layout.offset[1]);
    gl.bindVertexArray(dotVao);
    gl.drawArrays(gl.POINTS, 0, N);
    gl.bindVertexArray(null);

    onFrame?.(t);
  }

  // ── playback (capped at 60fps, pauses offscreen) ──────────────
  let raf = 0;
  let running = false;
  let clockStart = 0;
  let pausedAt = 0;
  let lastFrame = 0;
  let lastT = 8.8;
  const intervals = [];

  function tick(now) {
    raf = requestAnimationFrame(tick);
    const frameMs = 1000 / FPS;
    if (now - lastFrame < frameMs - 1.5) return;

    if (lastFrame) {
      intervals.push(now - lastFrame);
      if (intervals.length > 90) {
        intervals.shift();
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        if (avg > 24 && dpr > 0.75) { dpr = Math.max(0.75, dpr - 0.25); resize(); intervals.length = 0; }
      }
    }
    lastFrame = now;
    renderAt(((now - clockStart) / 1000) % DURATION);
  }

  function play() {
    if (running || still) return;
    running = true;
    clockStart = performance.now() - pausedAt * 1000;
    lastFrame = 0;
    raf = requestAnimationFrame(tick);
  }

  function pause() {
    if (!running) return;
    running = false;
    pausedAt = lastT;
    cancelAnimationFrame(raf);
  }

  const onLost = (e) => { e.preventDefault(); pause(); };
  canvas.addEventListener('webglcontextlost', onLost);

  if (still) renderAt(lastT);

  return {
    play,
    pause,
    renderAt,
    get playing() { return running; },
    setPointer(x, y) { pointer.x = x; pointer.y = y; },
    destroy() {
      pause();
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
