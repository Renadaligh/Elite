/**
 * Plato Table: a small, self-contained 2D pool engine drawn on one <canvas>.
 *
 * - The simulation always runs in one landscape "world" (TW x TH). The view maps it to the screen:
 *   landscape (optionally mirrored for LTR) or portrait (rotated), so the break goes along the long axis in every layout.
 * - Everything about the look lives in a TableSkin, so seasonal skins (ludo, chess, ...) can be added later
 *   without touching the physics or the interaction.
 */

export const TW = 880;
export const TH = 660;
const RAIL = 40;
const BR = 18; // ball radius
const PR = 30; // pocket radius
const MINX = RAIL + BR, MAXX = TW - RAIL - BR, MINY = RAIL + BR, MAXY = TH - RAIL - BR;

export const POCKETS = [
  { x: RAIL * 0.72, y: RAIL * 0.72 }, { x: TW / 2, y: RAIL * 0.5 }, { x: TW - RAIL * 0.72, y: RAIL * 0.72 },
  { x: RAIL * 0.72, y: TH - RAIL * 0.72 }, { x: TW / 2, y: TH - RAIL * 0.5 }, { x: TW - RAIL * 0.72, y: TH - RAIL * 0.72 },
];

export type Mode = 'landscape' | 'portrait';

export interface TableSkin {
  railFill: string; railEdge: string; railGlow: string;
  feltIn: string; feltOut: string;
  diamond: string; pocket: string; pocketRim: string;
  /** Faint centre logo. */
  drawWatermark?: (ctx: CanvasRenderingContext2D, cx: number, cy: number, o: { logo: CanvasImageSource | null; logoW: number; logoH: number; rtl: boolean }) => void;
}

const FONT = 'Tajawal, Outfit, system-ui, sans-serif';

/** The default skin: Plato blue felt, violet rails, neon edge, and the Plato brand lockup (same as the header) in the middle. */
export const PLATO_SKIN: TableSkin = {
  railFill: '#1d1450', railEdge: '#5b86ff', railGlow: 'rgba(80,130,255,.65)',
  feltIn: '#2f5fe0', feltOut: '#14256a',
  diamond: 'rgba(214,226,255,.75)', pocket: '#04051a', pocketRim: 'rgba(110,160,255,.55)',
  drawWatermark(ctx, cx, cy, o) {
    const K = 1.3;
    ctx.save();
    ctx.globalAlpha = 0.2; ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
    if (o.logo && o.logoH) { const h = 118 * K, w = (h * o.logoW) / o.logoH; ctx.drawImage(o.logo, cx - w / 2, cy - 112 * K, w, h); }
    // "plato | بالعربية", ordered like the header (mirrored in RTL)
    ctx.textAlign = 'left';
    ctx.font = `500 ${54 * K}px Ubuntu, sans-serif`; const w1 = ctx.measureText('plato').width;
    ctx.font = `700 ${42 * K}px ${FONT}`; const w2 = ctx.measureText('بالعربية').width;
    const gap = 18 * K, total = w1 + gap * 2 + 2 + w2;
    let x = cx - total / 2;
    const y = cy + 62 * K;
    const parts: ('p' | 'd' | 'a')[] = o.rtl ? ['a', 'd', 'p'] : ['p', 'd', 'a'];
    for (const k of parts) {
      if (k === 'p') { ctx.font = `500 ${54 * K}px Ubuntu, sans-serif`; ctx.fillText('plato', x, y); x += w1; }
      else if (k === 'a') { ctx.font = `700 ${42 * K}px ${FONT}`; ctx.fillText('بالعربية', x, y); x += w2; }
      else { ctx.globalAlpha = 0.14; ctx.fillRect(x + gap, y - 22 * K, 2, 44 * K); ctx.globalAlpha = 0.2; x += gap * 2 + 2; }
    }
    ctx.restore();
  },
};

/** Light-mode skin: airy white rails and a lighter felt, so the table does not weigh down a pale page. */
export const PLATO_LIGHT_SKIN: TableSkin = {
  ...PLATO_SKIN,
  railFill: '#e3eaff', railEdge: '#3d6bff', railGlow: 'rgba(61,107,255,.3)',
  feltIn: '#5e90ff', feltOut: '#2f5fe0',
  diamond: '#3d56b8', pocket: '#1b2a78', pocketRim: 'rgba(61,107,255,.7)',
};

export interface BallDef {
  key: string;
  label: string;
  num?: number;
  /** [highlight, base, shade] */
  colors: [string, string, string];
  kind: 'section' | 'game';
}

export interface PoolOptions {
  canvas: HTMLCanvasElement;
  skin?: TableSkin;
  /** Apex of the rack first (the first ball hit), then the rest. */
  balls: BallDef[];
  /** URL of the brand cube (alpha mask) used by the skin's watermark. */
  logoSrc?: string;
  rtl: boolean;
  mode: Mode;
  reduced: boolean;
  onSelect: (def: BallDef) => void;
  onSettled: () => void;
  /** Plain (unlabelled) balls potted so far, and how many there are. */
  onProgress?: (done: number, total: number) => void;
}

interface Sink { t: number; fx: number; fy: number; px: number; py: number }
interface Ball { key: string; cue: boolean; x: number; y: number; vx: number; vy: number; hidden: boolean; sink?: Sink; respawnAt: number; pop: number; plain?: { num: number; colors: [string, string, string] } }

const mix = (hex: string, t: number, to: number) => {
  const n = parseInt(hex.slice(1), 16), ch = (sh: number) => Math.round(((n >> sh) & 255) * (1 - t) + to * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
/** Ordinary balls: they only roll and fall in. Colours differ from the labelled ones so those stay easy to spot. */
const PLAIN = ['#ff8a2a', '#1fb36b', '#b0304a', '#262a3a', '#16b0b8', '#ff6fb5', '#a3d82a', '#8a5a2b', '#3a4fc8', '#9aa3bb'];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

export class PoolTable {
  private o: PoolOptions;
  private ctx: CanvasRenderingContext2D;
  private skin: TableSkin;
  private defs = new Map<string, BallDef>();
  private balls: Ball[] = [];
  private cue!: Ball;
  private time = 0;
  private phase: 'intro' | 'break' | 'live' = 'intro';
  private introT = 0;
  private breakT = 0;
  private calm = 0;
  private stickD = 14;
  private stickA = 1;
  private shot = { x: -1, y: 0 };
  private labelA = 0;
  private cssW = 0; private cssH = 0; private s = 1; private dpr = 1;
  private raf = 0; private last = 0; private running = false;
  private hoverBall: Ball | null = null;
  private aim: { x: number; y: number } | null = null;
  private mouseOn = false;
  private logo: HTMLCanvasElement | null = null;
  private done = 0;
  private total = 0;
  private rackAt = 0;

  constructor(o: PoolOptions) {
    this.o = o;
    this.ctx = o.canvas.getContext('2d')!;
    this.skin = o.skin ?? PLATO_SKIN;
    this.setDefs(o.balls);
    this.reset();
    if (o.logoSrc && typeof Image !== 'undefined') {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const x = c.getContext('2d'); if (!x) return;
        x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
        this.logo = c;
      };
      img.src = o.logoSrc;
    }
  }

  /* ───────── public API ───────── */

  setDefs(defs: BallDef[]) { defs.forEach((d) => this.defs.set(d.key, d)); }
  /** True once the break is over and the table accepts taps. */
  isLive() { return this.phase === 'live'; }
  setLook(rtl: boolean) { this.o.rtl = rtl; }
  /** Re-rack all balls and break again. */
  restart() { this.reset(); }
  /** Swap the table theme (for example dark / light); takes effect on the next frame. */
  setSkin(skin: TableSkin) { this.skin = skin; }

  layout(cssW: number, mode: Mode, dpr: number) {
    this.o.mode = mode;
    this.dpr = dpr;
    this.cssW = cssW;
    const vw = mode === 'portrait' ? TH : TW, vh = mode === 'portrait' ? TW : TH;
    this.s = cssW / vw;
    this.cssH = vh * this.s;
    const c = this.o.canvas;
    c.width = Math.ceil(cssW * dpr); c.height = Math.ceil(this.cssH * dpr);
    c.style.width = `${cssW}px`; c.style.height = `${this.cssH}px`;
    if (!this.running) this.draw();
  }

  start() {
    if (this.running) return;
    this.running = true; this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  destroy() { this.stop(); }

  /** Pointer helpers: coordinates are client pixels. */
  hover(cx: number, cy: number, isMouse: boolean) {
    this.mouseOn = isMouse;
    if (!isMouse || this.phase !== 'live') { this.hoverBall = null; this.aim = null; this.o.canvas.style.cursor = ''; return; }
    const p = this.toView(cx, cy);
    const b = this.hit(p.x, p.y);
    this.hoverBall = b;
    this.aim = b ? null : this.unproj(p.x, p.y);
    this.o.canvas.style.cursor = b ? 'pointer' : 'crosshair';
  }
  leave() { this.hoverBall = null; this.aim = null; this.o.canvas.style.cursor = ''; }

  tap(cx: number, cy: number) {
    if (this.phase !== 'live') return;
    const p = this.toView(cx, cy);
    const b = this.hit(p.x, p.y);
    if (b) { this.sinkBall(b); return; }
    const w = this.unproj(p.x, p.y);
    if (w.x < RAIL || w.x > TW - RAIL || w.y < RAIL || w.y > TH - RAIL) return;
    const dx = w.x - this.cue.x, dy = w.y - this.cue.y, d = Math.hypot(dx, dy);
    if (d < 8) return;
    const sp = clamp(d * 3.4, 480, 1500);
    this.cue.vx = (dx / d) * sp; this.cue.vy = (dy / d) * sp;
  }

  /* ───────── setup ───────── */

  private reset() {
    this.balls = [];
    this.done = 0; this.rackAt = 0;
    const defs = this.o.balls;
    const dx = BR * 1.74 + 0.6, dy = BR + 0.4;
    const x0 = TW * 0.36, cy = TH / 2;
    // Full 15-ball triangle, apex toward the cue. The apex is today's game, so it is the first ball hit.
    const slots: [number, number][] = [];
    for (let r = 0; r < 5; r++) for (let k = 0; k <= r; k++) slots.push([x0 - r * dx, cy + (k - r / 2) * 2 * dy]);
    const specialSlots = [2, 4, 8, 13];
    const put = (key: string, i: number, plain?: Ball['plain']) => this.balls.push({ key, cue: false, x: slots[i][0], y: slots[i][1], vx: 0, vy: 0, hidden: false, respawnAt: 0, pop: 1, plain });
    if (defs[0]) put(defs[0].key, 0);
    defs.slice(1).forEach((d, i) => put(d.key, specialSlots[i] ?? 1));
    let n = 0;
    for (let i = 1; i < slots.length; i++) {
      if (specialSlots.slice(0, Math.max(0, defs.length - 1)).includes(i)) continue;
      const base = PLAIN[n % PLAIN.length];
      put(`p${n + 5}`, i, { num: n + 5, colors: [mix(base, 0.45, 255), base, mix(base, 0.45, 0)] });
      n++;
    }
    this.total = n;
    this.cue = { key: '_cue', cue: true, x: TW * 0.74, y: cy + 5, vx: 0, vy: 0, hidden: false, respawnAt: 0, pop: 1 };
    this.balls.push(this.cue);
    this.o.onProgress?.(0, this.total);
    const apex = this.balls[0];
    const ax = apex.x - this.cue.x, ay = apex.y + 3 - this.cue.y, al = Math.hypot(ax, ay);
    this.shot = { x: ax / al, y: ay / al };
    this.phase = 'intro'; this.introT = 0; this.breakT = 0; this.calm = 0; this.stickD = 14; this.stickA = 1; this.labelA = 0;
    if (this.o.reduced) {
      this.launch();
      for (let i = 0; i < 900; i++) { this.physics(1 / 120); this.breakT += 1 / 120; }
      this.settle();
      this.labelA = 1;
    }
  }

  /* ───────── loop ───────── */

  private frame = (now: number) => {
    if (!this.running) return;
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0;
    this.last = now;
    this.step(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };

  private launch() {
    const sp = 1750;
    this.cue.vx = this.shot.x * sp; this.cue.vy = this.shot.y * sp;
    this.phase = 'break'; this.breakT = 0; this.calm = 0;
  }

  private settle() {
    this.balls.forEach((b) => { b.vx = 0; b.vy = 0; });
    this.phase = 'live';
    this.o.onSettled();
  }

  private step(dt: number) {
    this.time += dt;
    if (this.phase === 'intro') {
      this.introT += dt;
      const t = this.introT - 0.45; // short beat before the cue moves
      if (t > 0) {
        if (t < 0.95) this.stickD = 14 + 82 * smooth(t / 0.95);
        else if (t < 1.1) this.stickD = 96;
        else if (t < 1.2) this.stickD = 96 - 88 * ((t - 1.1) / 0.1);
        else { this.stickD = 8; this.launch(); }
      }
    } else {
      if (this.stickA > 0) this.stickA = Math.max(0, this.stickA - dt * 2.6);
      this.physics(dt);
      if (this.phase === 'break') {
        this.breakT += dt;
        const fast = this.balls.some((b) => Math.hypot(b.vx, b.vy) > 12);
        this.calm = fast ? 0 : this.calm + dt;
        if (this.calm > 0.3 || this.breakT > 5.2) this.settle();
      }
    }
    if (this.phase === 'live' && this.total > 0 && this.done >= this.total) {
      if (!this.rackAt) this.rackAt = this.time + 1.6;
      else if (this.time >= this.rackAt) { this.reset(); return; }
    }
    const moving = this.balls.some((b) => Math.hypot(b.vx, b.vy) > 25);
    const target = this.phase === 'live' && !moving ? 1 : 0;
    this.labelA += (target - this.labelA) * Math.min(1, dt * 5);
    // Respawn pocketed balls.
    for (const b of this.balls) {
      if (b.hidden && b.respawnAt && this.time >= b.respawnAt) this.respawn(b);
      if (b.pop < 1) b.pop = Math.min(1, b.pop + dt * 3);
      if (b.sink) {
        b.sink.t += dt / 0.8;
        const k = Math.pow(Math.min(b.sink.t, 1), 1.7);
        b.x = b.sink.fx + (b.sink.px - b.sink.fx) * k; b.y = b.sink.fy + (b.sink.py - b.sink.fy) * k;
        if (b.sink.t >= 1) {
          b.sink = undefined; b.hidden = true;
          if (b.plain) { this.done++; this.o.onProgress?.(this.done, this.total); }
          else { b.respawnAt = this.time + 1.4; const d = this.defs.get(b.key); if (d) this.o.onSelect(d); }
        }
      }
    }
  }

  private physics(dt: number) {
    const act = this.balls.filter((b) => !b.hidden && !b.sink);
    let vmax = 0;
    for (const b of act) vmax = Math.max(vmax, Math.hypot(b.vx, b.vy));
    const n = clamp(Math.ceil((vmax * dt) / (BR * 0.5)), 1, 10);
    const h = dt / n;
    const extra = this.phase === 'break' && this.breakT > 3.2 ? 1 + (this.breakT - 3.2) * 2.2 : 1;
    for (let k = 0; k < n; k++) {
      for (const b of act) {
        b.x += b.vx * h; b.y += b.vy * h;
        if (this.phase === 'live' && (b.vx !== 0 || b.vy !== 0) && this.potted(b)) continue;
        // While playing, the cushion opens at each pocket mouth so a ball can roll in.
        if (!(this.phase === 'live' && this.nearPocket(b))) {
          if (b.x < MINX) { b.x = MINX; b.vx = Math.abs(b.vx) * 0.92; } else if (b.x > MAXX) { b.x = MAXX; b.vx = -Math.abs(b.vx) * 0.92; }
          if (b.y < MINY) { b.y = MINY; b.vy = Math.abs(b.vy) * 0.92; } else if (b.y > MAXY) { b.y = MAXY; b.vy = -Math.abs(b.vy) * 0.92; }
        }
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > 0) {
          const s2 = sp * Math.exp(-0.5 * h) - 470 * extra * h;
          if (s2 < 4) { b.vx = 0; b.vy = 0; } else { b.vx *= s2 / sp; b.vy *= s2 / sp; }
        }
      }
      for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) {
        const a = act[i], c = act[j];
        if (a.sink || c.sink) continue;
        const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy);
        if (d >= BR * 2 || d === 0) continue;
        const nx = dx / d, ny = dy / d, ov = (BR * 2 - d) / 2;
        a.x -= nx * ov; a.y -= ny * ov; c.x += nx * ov; c.y += ny * ov;
        const vn = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny;
        if (vn > 0) { const j2 = vn * 0.98; a.vx -= j2 * nx; a.vy -= j2 * ny; c.vx += j2 * nx; c.vy += j2 * ny; }
      }
    }
  }

  /** A ball that reaches a pocket mouth during play falls in (sections open, the cue ball comes back). */
  private potted(b: Ball) {
    for (const p of POCKETS) {
      if (Math.hypot(p.x - b.x, p.y - b.y) < PR + 4) { this.sinkBall(b, p); return true; }
    }
    return false;
  }

  private nearPocket(b: Ball) {
    return POCKETS.some((p) => Math.hypot(p.x - b.x, p.y - b.y) < PR + BR + 10);
  }

  private sinkBall(b: Ball, pocket?: { x: number; y: number }) {
    if (b.sink || b.hidden) return;
    let best = pocket ?? POCKETS[0], bd = Infinity;
    if (!pocket) for (const p of POCKETS) { const d = Math.hypot(p.x - b.x, p.y - b.y); if (d < bd) { bd = d; best = p; } }
    b.vx = 0; b.vy = 0;
    b.sink = { t: 0, fx: b.x, fy: b.y, px: best.x, py: best.y };
    this.hoverBall = null; this.aim = null;
  }

  private respawn(b: Ball) {
    const tries: [number, number][] = b.cue ? [[TW * 0.72, TH / 2 + 5]] : [[TW / 2, TH / 2]];
    for (let i = 0; i < 24; i++) { const a = i * 0.9, r = 40 + i * 12; tries.push([TW / 2 + Math.cos(a) * r, TH / 2 + Math.sin(a) * r * 0.8]); }
    for (const [x, y] of tries) {
      if (x < MINX || x > MAXX || y < MINY || y > MAXY) continue;
      if (this.balls.every((o) => o === b || o.hidden || Math.hypot(o.x - x, o.y - y) > BR * 2.4)) { b.x = x; b.y = y; break; }
    }
    b.vx = 0; b.vy = 0; b.hidden = false; b.respawnAt = 0; b.pop = 0;
  }

  /* ───────── view mapping ───────── */

  private vw() { return this.o.mode === 'portrait' ? TH : TW; }
  private vh() { return this.o.mode === 'portrait' ? TW : TH; }
  private proj(x: number, y: number) {
    if (this.o.mode === 'portrait') return { x: y, y: x };
    return { x: this.o.rtl ? x : TW - x, y };
  }
  private unproj(sx: number, sy: number) {
    if (this.o.mode === 'portrait') return { x: sy, y: sx };
    return { x: this.o.rtl ? sx : TW - sx, y: sy };
  }
  private toView(cx: number, cy: number) {
    const r = this.o.canvas.getBoundingClientRect();
    return { x: ((cx - r.left) / r.width) * this.vw(), y: ((cy - r.top) / r.height) * this.vh() };
  }
  private hit(sx: number, sy: number): Ball | null {
    const minR = 24 / this.s; // keeps a 44px touch target
    let best: Ball | null = null, bd = Infinity;
    for (const b of this.balls) {
      if (b.cue || b.plain || b.hidden || b.sink) continue;
      const p = this.proj(b.x, b.y), d = Math.hypot(p.x - sx, p.y - sy);
      if (d <= Math.max(BR, minR) && d < bd) { bd = d; best = b; }
    }
    return best;
  }

  /* ───────── drawing ───────── */

  private rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  private draw() {
    const c = this.ctx, k = this.dpr * this.s, sk = this.skin;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.o.canvas.width, this.o.canvas.height);

    // 1) table, in world space (mapped by the view matrix)
    const m = this.o.mode === 'portrait' ? [0, 1, 1, 0, 0, 0] : this.o.rtl ? [1, 0, 0, 1, 0, 0] : [-1, 0, 0, 1, TW, 0];
    c.setTransform(k * m[0], k * m[1], k * m[2], k * m[3], k * m[4], k * m[5]);
    c.save();
    c.shadowColor = sk.railGlow; c.shadowBlur = 22;
    this.rr(c, 3, 3, TW - 6, TH - 6, 38); c.fillStyle = sk.railFill; c.fill();
    c.shadowBlur = 0; c.lineWidth = 3; c.strokeStyle = sk.railEdge; c.stroke();
    c.restore();
    this.rr(c, 3, 3, TW - 6, TH - 6, 38);
    c.save(); c.clip();
    const g = c.createRadialGradient(TW / 2, TH / 2, 40, TW / 2, TH / 2, TW * 0.62);
    g.addColorStop(0, sk.feltIn); g.addColorStop(1, sk.feltOut);
    this.rr(c, RAIL, RAIL, TW - RAIL * 2, TH - RAIL * 2, 10); c.fillStyle = g; c.fill();
    c.lineWidth = 2; c.strokeStyle = 'rgba(160,190,255,.25)'; c.stroke();
    // diamonds
    c.fillStyle = sk.diamond;
    const dia = (x: number, y: number) => { c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + 3.6, y); c.lineTo(x, y + 5); c.lineTo(x - 3.6, y); c.closePath(); c.fill(); };
    for (const f of [0.18, 0.34, 0.66, 0.82]) { dia(TW * f, RAIL / 2); dia(TW * f, TH - RAIL / 2); }
    for (const f of [0.3, 0.5, 0.7]) { dia(RAIL / 2, TH * f); dia(TW - RAIL / 2, TH * f); }
    // pockets
    for (const p of POCKETS) {
      c.beginPath(); c.arc(p.x, p.y, PR, 0, 7); c.fillStyle = sk.pocket; c.fill();
      c.lineWidth = 3; c.strokeStyle = sk.pocketRim; c.stroke();
    }
    c.restore();

    // cue stick
    if (this.stickA > 0.01) {
      c.save(); c.globalAlpha = this.stickA;
      const ux = this.shot.x, uy = this.shot.y, nx = -uy, ny = ux;
      const tx = this.cue.x - ux * (BR + this.stickD), ty = this.cue.y - uy * (BR + this.stickD);
      const ex = tx - ux * 400, ey = ty - uy * 400;
      const sg = c.createLinearGradient(tx, ty, ex, ey);
      sg.addColorStop(0, '#f5e6c4'); sg.addColorStop(0.25, '#d9b87a'); sg.addColorStop(1, '#6b44e0');
      c.beginPath(); c.moveTo(tx + nx * 3, ty + ny * 3); c.lineTo(ex + nx * 7, ey + ny * 7); c.lineTo(ex - nx * 7, ey - ny * 7); c.lineTo(tx - nx * 3, ty - ny * 3); c.closePath();
      c.fillStyle = sg; c.fill();
      c.beginPath(); c.moveTo(tx + nx * 3, ty + ny * 3); c.lineTo(tx - ux * 12 + nx * 3.4, ty - uy * 12 + ny * 3.4); c.lineTo(tx - ux * 12 - nx * 3.4, ty - uy * 12 - ny * 3.4); c.lineTo(tx - nx * 3, ty - ny * 3); c.closePath();
      c.fillStyle = '#8fb4ff'; c.fill();
      c.restore();
    }

    // desktop hover guides (world space)
    if (this.mouseOn && this.phase === 'live') {
      c.save(); c.setLineDash([2, 9]); c.lineCap = 'round'; c.lineWidth = 3;
      if (this.hoverBall && !this.hoverBall.sink) {
        const b = this.hoverBall;
        let best = POCKETS[0], bd = Infinity;
        for (const p of POCKETS) { const d = Math.hypot(p.x - b.x, p.y - b.y); if (d < bd) { bd = d; best = p; } }
        c.strokeStyle = this.defs.get(b.key)?.colors[1] ?? '#fff';
        c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(best.x, best.y); c.stroke();
      } else if (this.aim) {
        c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(this.cue.x, this.cue.y); c.lineTo(this.aim.x, this.aim.y); c.stroke();
      }
      c.restore();
    }

    // 2) everything else, upright in screen space
    c.setTransform(k, 0, 0, k, 0, 0);
    const px = 1 / this.s; // one CSS pixel in view units
    sk.drawWatermark?.(c, this.vw() / 2, this.vh() / 2, { logo: this.logo, logoW: this.logo?.width ?? 0, logoH: this.logo?.height ?? 0, rtl: this.o.rtl });

    const order = [...this.balls].sort((a, b) => (a.cue ? -1 : 0) - (b.cue ? -1 : 0));
    for (const b of order) if (!b.hidden) this.drawBall(c, b, px);
    // labels
    if (this.labelA > 0.02) {
      const placed: number[][] = [];
      for (const b of [...this.balls].sort((a, z) => this.proj(a.x, a.y).y - this.proj(z.x, z.y).y)) {
        if (b.cue || b.hidden || b.sink) continue;
        const d = this.defs.get(b.key); if (!d) continue;
        this.drawLabel(c, b, d, px, placed);
      }
    }
  }

  private drawBall(c: CanvasRenderingContext2D, b: Ball, px: number) {
    const d = b.cue || b.plain ? null : this.defs.get(b.key);
    const p = this.proj(b.x, b.y);
    let sc = b.pop < 1 ? smooth(b.pop) : 1;
    let alpha = 1;
    if (b.sink) { const t = clamp((b.sink.t - 0.45) / 0.55, 0, 1); sc *= 1 - 0.72 * smooth(t); alpha = 1 - 0.5 * smooth(t); }
    const r = BR * sc;
    if (r <= 0.5) return;
    c.save(); c.globalAlpha = alpha;
    const gold = d?.kind === 'game';
    if (gold && !b.sink) {
      const pulse = this.o.reduced ? 0 : Math.sin(this.time * 2.4);
      const R = r * (2.1 + 0.25 * pulse);
      const gg = c.createRadialGradient(p.x, p.y, r * 0.6, p.x, p.y, R);
      gg.addColorStop(0, `rgba(255,214,90,${0.5 + 0.12 * pulse})`); gg.addColorStop(1, 'rgba(255,214,90,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(p.x, p.y, R, 0, 7); c.fill();
    }
    // shadow
    c.fillStyle = 'rgba(0,0,0,.32)'; c.beginPath(); c.ellipse(p.x + r * 0.22, p.y + r * 0.34, r * 1.02, r * 0.9, 0, 0, 7); c.fill();
    const col = b.cue ? ['#ffffff', '#f1f4ff', '#b9c4ea'] : b.plain ? b.plain.colors : d!.colors;
    const bg = c.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, r * 0.1, p.x, p.y, r);
    bg.addColorStop(0, col[0]); bg.addColorStop(0.55, col[1]); bg.addColorStop(1, col[2]);
    c.fillStyle = bg; c.beginPath(); c.arc(p.x, p.y, r, 0, 7); c.fill();
    if (!b.cue) {
      c.fillStyle = '#fff'; c.beginPath(); c.arc(p.x, p.y, r * 0.54, 0, 7); c.fill();
      if (b.plain) { c.fillStyle = '#10163a'; c.font = `800 ${r * (b.plain.num > 9 ? 0.56 : 0.7)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(b.plain.num), p.x, p.y + r * 0.04); }
      if (gold) {
        c.fillStyle = '#e09a00'; c.beginPath();
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r * 0.2 : r * 0.46; const x = p.x + Math.cos(a) * rad, y = p.y + Math.sin(a) * rad; i ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.closePath(); c.fill();
      } else if (d && d.num != null) {
        c.fillStyle = '#10163a'; c.font = `800 ${r * 0.74}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(d!.num), p.x, p.y + r * 0.04);
      }
    }
    c.fillStyle = 'rgba(255,255,255,.65)'; c.beginPath(); c.ellipse(p.x - r * 0.4, p.y - r * 0.46, r * 0.22, r * 0.13, -0.6, 0, 7); c.fill();
    // desktop hover ring
    if (this.hoverBall === b && !b.sink) {
      c.globalAlpha = 1; c.lineWidth = 3 * px; c.strokeStyle = d?.colors[1] ?? '#fff';
      c.beginPath(); c.arc(p.x, p.y, r + 7 * px * 0.9, 0, 7); c.stroke();
    }
    c.restore();
  }

  private drawLabel(c: CanvasRenderingContext2D, b: Ball, d: BallDef, px: number, placed: number[][]) {
    const p = this.proj(b.x, b.y);
    const size = 12.5 * px, padX = 9 * px, h = 22 * px;
    c.save(); c.globalAlpha = this.labelA;
    c.font = `700 ${size}px ${FONT}`;
    const w = c.measureText(d.label).width + padX * 2;
    const x = clamp(p.x, w / 2 + RAIL * 0.5, this.vw() - w / 2 - RAIL * 0.5);
    // Try below the ball, then above, then shifted further, and keep the first spot that does not cover another label.
    const below = p.y + BR + 5 * px, above = p.y - BR - 5 * px - h, gap = h + 3 * px;
    const maxY = this.vh() - RAIL * 0.55 - h, minY = RAIL * 0.55;
    let y = clamp(below, minY, maxY);
    for (const cand of [below, above, below + gap, above - gap, below + gap * 2, above - gap * 2]) {
      const cy = clamp(cand, minY, maxY);
      if (placed.every((r) => x + w / 2 < r[0] || x - w / 2 > r[1] || cy + h < r[2] || cy > r[3])) { y = cy; break; }
    }
    placed.push([x - w / 2, x + w / 2, y, y + h]);
    c.fillStyle = 'rgba(10,14,48,.88)'; this.rr(c, x - w / 2, y, w, h, h / 2); c.fill();
    c.lineWidth = 1.6 * px; c.strokeStyle = d.colors[1]; c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(d.label, x, y + h / 2 + px * 0.5);
    c.restore();
  }
}
