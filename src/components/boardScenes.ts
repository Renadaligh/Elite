/**
 * Mini-games for the hero: Match (memory), Ludo (dice race) and Knight (chess knight moves).
 * Same contract as PoolTable (HeroEngine). In each game a few special spots carry a section ball: reach one and the page opens that section.
 */
import type { BallDef, Mode } from './poolTable';

export type SceneId = 'ludo' | 'chess' | 'match';

/** What HeroSection needs from any hero game (the pool table implements it too). */
export interface HeroEngine {
  layout(cssW: number, mode: Mode, dpr: number): void;
  start(): void;
  stop(): void;
  destroy(): void;
  hover(cx: number, cy: number, isMouse: boolean): void;
  leave(): void;
  tap(cx: number, cy: number): void;
  isLive(): boolean;
  setDefs(defs: BallDef[]): void;
  setLook(rtl: boolean): void;
  /** Start the game over (re-rack, reshuffle...). */
  restart?(): void;
}

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  scene: SceneId;
  balls: BallDef[]; // [game of the day, ...sections]
  rtl: boolean;
  mode: Mode;
  reduced: boolean;
  onSelect: (def: BallDef) => void;
  onSettled: () => void;
  /** Progress for the small counter under the table. */
  onProgress?: (done: number, total: number) => void;
}

const FONT = 'Tajawal, Outfit, system-ui, sans-serif';
const S = 620; // board side, in view units
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Shared scaffolding: canvas sizing, the animation loop, pointer mapping and a few drawing helpers. */
abstract class Base implements HeroEngine {
  protected o: SceneOptions;
  protected c: CanvasRenderingContext2D;
  protected defs = new Map<string, BallDef>();
  protected time = 0;
  protected live = false;
  protected s = 1; protected dpr = 1;
  private raf = 0; private last = 0; private running = false;

  constructor(o: SceneOptions) { this.o = o; this.c = o.canvas.getContext('2d')!; this.setDefs(o.balls); }

  protected abstract update(dt: number): void;
  protected abstract paint(): void;
  protected abstract press(x: number, y: number): void;
  protected abstract over(x: number, y: number): boolean;
  protected abstract relayout(): void;
  abstract restart(): void;

  protected get vw() { return this.o.mode === 'portrait' ? 660 : 880; }
  protected get vh() { return this.o.mode === 'portrait' ? 880 : 660; }
  protected get ox() { return (this.vw - S) / 2; }
  protected get oy() { return (this.vh - S) / 2; }
  protected get px() { return 1 / this.s; }

  setDefs(defs: BallDef[]) { this.o.balls = defs; defs.forEach((d) => this.defs.set(d.key, d)); }
  setLook(rtl: boolean) { this.o.rtl = rtl; }
  isLive() { return this.live; }

  layout(cssW: number, mode: Mode, dpr: number) {
    this.o.mode = mode; this.dpr = dpr;
    this.s = cssW / this.vw;
    const cv = this.o.canvas;
    cv.width = Math.ceil(cssW * dpr); cv.height = Math.ceil(this.vh * this.s * dpr);
    cv.style.width = `${cssW}px`; cv.style.height = `${this.vh * this.s}px`;
    this.relayout();
    if (!this.running) this.redraw();
  }

  start() { if (this.running) return; this.running = true; this.last = 0; this.raf = requestAnimationFrame(this.frame); }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  destroy() { this.stop(); }

  private frame = (now: number) => {
    if (!this.running) return;
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0;
    this.last = now;
    this.time += dt;
    this.update(dt);
    this.redraw();
    this.raf = requestAnimationFrame(this.frame);
  };
  private redraw() {
    const k = this.dpr * this.s;
    this.c.setTransform(k, 0, 0, k, 0, 0);
    this.c.clearRect(0, 0, this.vw, this.vh);
    this.paint();
  }

  protected toView(cx: number, cy: number) {
    const r = this.o.canvas.getBoundingClientRect();
    return { x: ((cx - r.left) / r.width) * this.vw, y: ((cy - r.top) / r.height) * this.vh };
  }
  hover(cx: number, cy: number, isMouse: boolean) {
    if (!isMouse || !this.live) { this.o.canvas.style.cursor = ''; return; }
    const p = this.toView(cx, cy);
    this.o.canvas.style.cursor = this.over(p.x, p.y) ? 'pointer' : '';
  }
  leave() { this.o.canvas.style.cursor = ''; this.left(); }
  protected left() { /* optional */ }
  tap(cx: number, cy: number) { if (!this.live) return; const p = this.toView(cx, cy); this.press(p.x, p.y); }

  protected progress(done: number, total: number) { this.o.onProgress?.(done, total); }
  protected def(i: number): BallDef | undefined { return this.o.balls[i]; }

  /* ───────── drawing helpers ───────── */

  protected rr(x: number, y: number, w: number, h: number, r: number) {
    const c = this.c;
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  protected star(x: number, y: number, R: number) {
    const c = this.c; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? R * 0.45 : R; const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
    c.closePath();
  }
  protected frame3(x: number, y: number, w: number, h: number, r: number, fill: string) {
    const c = this.c;
    c.save(); c.shadowColor = 'rgba(80,130,255,.5)'; c.shadowBlur = 24; this.rr(x, y, w, h, r); c.fillStyle = fill; c.fill(); c.restore();
    c.lineWidth = 3; c.strokeStyle = '#5b86ff'; this.rr(x, y, w, h, r); c.stroke();
  }
  /** The same ball icon used on the pool table, so a section looks the same in every game. */
  protected badge(x: number, y: number, r: number, d: BallDef, pulse = false) {
    const c = this.c, gold = d.kind === 'game';
    if (gold && pulse) {
      const p = this.o.reduced ? 0 : Math.sin(this.time * 2.4), R = r * (2 + 0.25 * p);
      const g = c.createRadialGradient(x, y, r * 0.4, x, y, R); g.addColorStop(0, `rgba(255,214,90,${0.5 + 0.12 * p})`); g.addColorStop(1, 'rgba(255,214,90,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, 7); c.fill();
    }
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x + r * 0.2, y + r * 0.35, r, r * 0.88, 0, 0, 7); c.fill();
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, d.colors[0]); g.addColorStop(0.55, d.colors[1]); g.addColorStop(1, d.colors[2]);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, r * 0.54, 0, 7); c.fill();
    if (gold) { this.star(x, y, r * 0.46); c.fillStyle = '#e09a00'; c.fill(); }
    else if (d.num != null) { c.fillStyle = '#10163a'; c.font = `800 ${r * 0.74}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(d.num), x, y + r * 0.04); }
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(x - r * 0.4, y - r * 0.46, r * 0.22, r * 0.13, -0.6, 0, 7); c.fill();
  }
  protected pill(x: number, y: number, text: string, color: string, maxX = this.vw, minX = 0) {
    const c = this.c, px = this.px, size = 12.5 * px, h = 22 * px;
    c.save(); c.font = `700 ${size}px ${FONT}`;
    const w = c.measureText(text).width + 18 * px;
    const cx = clamp(x, minX + w / 2 + 6, maxX - w / 2 - 6), cy = clamp(y, 6, this.vh - h - 6);
    c.fillStyle = 'rgba(10,14,48,.92)'; this.rr(cx - w / 2, cy, w, h, h / 2); c.fill();
    c.lineWidth = 1.6 * px; c.strokeStyle = color; c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, cx, cy + h / 2 + px * 0.5);
    c.restore();
  }
}

/* ═════════════════════════ MATCH: memory game ═════════════════════════ */

const SHAPE_COLORS = ['#ffc933', '#2f6bff', '#ff6fb5', '#2fbf71', '#ff8a2a'];
interface Tile { pair: number; sec: boolean; x: number; y: number; f: number; target: 0 | 1; matched: boolean }

class MatchGame extends Base {
  private tiles: Tile[] = [];
  private flipped: Tile[] = [];
  private lock = false;
  private resolveAt = 0;
  private peekUntil = 0;
  private pairs = 0;
  private restartAt = 0;
  private hov: Tile | null = null;
  private readonly T = 110; private readonly G = 14;

  constructor(o: SceneOptions) { super(o); this.restart(); }

  restart() {
    const order: number[] = [];
    for (let p = 0; p < 10; p++) order.push(p, p);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    this.tiles = order.map((pair) => ({ pair, sec: pair < 5, x: 0, y: 0, f: 1, target: 1 as const, matched: false }));
    this.flipped = []; this.lock = false; this.pairs = 0; this.restartAt = 0; this.live = false;
    this.peekUntil = this.time + (this.o.reduced ? 0.01 : 1.8);
    this.relayout();
    this.progress(0, 10);
  }

  protected relayout() {
    const cols = this.o.mode === 'portrait' ? 4 : 5, rows = 20 / cols, w = cols * this.T + (cols - 1) * this.G, h = rows * this.T + (rows - 1) * this.G;
    const mx = (this.vw - w) / 2, my = (this.vh - h) / 2;
    this.tiles.forEach((t, i) => { t.x = mx + (i % cols) * (this.T + this.G) + this.T / 2; t.y = my + Math.floor(i / cols) * (this.T + this.G) + this.T / 2; });
  }

  protected update(dt: number) {
    const rate = this.o.reduced ? 1 : dt / 0.28;
    for (const t of this.tiles) t.f += clamp(t.target - t.f, -rate, rate);
    if (!this.live) {
      if (this.time >= this.peekUntil) {
        for (const t of this.tiles) if (!t.matched) t.target = 0;
        if (this.tiles.every((t) => t.f <= 0.01)) { this.live = true; this.o.onSettled(); }
      }
      return;
    }
    if (this.lock && this.time >= this.resolveAt) {
      const [a, b] = this.flipped;
      if (a.pair === b.pair) {
        a.matched = b.matched = true; this.pairs++; this.progress(this.pairs, 10);
        if (a.sec) { const d = this.def(a.pair); if (d) this.o.onSelect(d); }
        if (this.pairs === 10) this.restartAt = this.time + 2.4;
      } else { a.target = 0; b.target = 0; }
      this.flipped = []; this.lock = false;
    }
    if (this.restartAt && this.time >= this.restartAt) this.restart();
  }

  private at(x: number, y: number) { return this.tiles.find((t) => Math.abs(x - t.x) < this.T / 2 && Math.abs(y - t.y) < this.T / 2) ?? null; }
  protected over(x: number, y: number) { const t = this.at(x, y); this.hov = t && !t.matched && t.target === 0 && !this.lock ? t : null; return !!this.hov; }
  protected left() { this.hov = null; }
  protected press(x: number, y: number) {
    const t = this.at(x, y);
    if (!t || t.matched || t.target === 1 || this.lock) return;
    t.target = 1; this.flipped.push(t);
    if (this.flipped.length === 2) { this.lock = true; this.resolveAt = this.time + (this.flipped[0].pair === t.pair ? 0.6 : 1.0); }
  }

  private symbol(pair: number, x: number, y: number) {
    const c = this.c, k = pair - 5;
    c.fillStyle = SHAPE_COLORS[k % 5];
    if (k === 0) { c.beginPath(); c.arc(x, y, 32, 0, 7); c.fill(); }
    else if (k === 1) { this.rr(x - 30, y - 30, 60, 60, 10); c.fill(); }
    else if (k === 2) { c.beginPath(); c.moveTo(x, y - 36); c.lineTo(x + 36, y + 28); c.lineTo(x - 36, y + 28); c.closePath(); c.fill(); }
    else if (k === 3) { this.star(x, y, 38); c.fill(); }
    else { c.beginPath(); c.moveTo(x, y - 38); c.lineTo(x + 30, y); c.lineTo(x, y + 38); c.lineTo(x - 30, y); c.closePath(); c.fill(); }
  }

  protected paint() {
    const c = this.c, cols = this.o.mode === 'portrait' ? 4 : 5, rows = 20 / cols, w = cols * this.T + (cols - 1) * this.G, h = rows * this.T + (rows - 1) * this.G;
    this.frame3((this.vw - w) / 2 - 24, (this.vh - h) / 2 - 24, w + 48, h + 48, 30, '#1d1450');
    const T = this.T;
    for (const t of this.tiles) {
      const sx = Math.max(0.04, Math.abs(1 - 2 * t.f)), up = t.f > 0.5, hv = this.hov === t;
      c.save(); c.translate(t.x, t.y); c.scale(sx * (hv ? 1.05 : 1), hv ? 1.05 : 1);
      if (t.matched && up) { c.shadowColor = 'rgba(255,207,77,.9)'; c.shadowBlur = 20; }
      this.rr(-T / 2, -T / 2, T, T, 18); c.fillStyle = up ? (t.matched ? '#fff6d6' : '#f4f6ff') : '#2f5fe0'; c.fill();
      c.shadowBlur = 0; c.lineWidth = 3; c.strokeStyle = up ? (t.matched ? '#ffcf4d' : '#fff') : '#5b86ff'; c.stroke();
      if (up) {
        if (t.sec) {
          const d = this.def(t.pair);
          if (d) { this.badge(0, -12, 30, d); c.font = `700 ${12.5 * this.px}px ${FONT}`; c.fillStyle = '#10163a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(d.label.split(' · ')[0], 0, T / 2 - 16); }
        } else this.symbol(t.pair, 0, 0);
      } else { c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(0, 0, 16, 0, 7); c.stroke(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(0, 0, 4, 0, 7); c.fill(); }
      c.restore();
    }
    if (this.restartAt) { const a = clamp((this.time - (this.restartAt - 2.4)) / 0.4, 0, 1); c.save(); c.globalAlpha = a; this.star(this.vw / 2, this.vh / 2, 110); c.fillStyle = '#ffcf4d'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke(); c.restore(); }
  }
}

/* ═════════════════════════ LUDO: dice race ═════════════════════════ */

// The outer ring of the classic Ludo cross: 52 cells, clockwise, as [column,row] on a 15x15 grid.
const RING: [number, number][] = (() => {
  const r: [number, number][] = [];
  for (let c = 0; c <= 5; c++) r.push([c, 6]);
  for (let y = 5; y >= 0; y--) r.push([6, y]);
  r.push([7, 0]);
  for (let y = 0; y <= 5; y++) r.push([8, y]);
  for (let c = 9; c <= 14; c++) r.push([c, 6]);
  r.push([14, 7]);
  for (let c = 14; c >= 9; c--) r.push([c, 8]);
  for (let y = 9; y <= 14; y++) r.push([8, y]);
  r.push([7, 14]);
  for (let y = 14; y >= 9; y--) r.push([6, y]);
  for (let c = 5; c >= 0; c--) r.push([c, 8]);
  r.push([0, 7]);
  return r;
})();
// Section cells: ring index -> def index (news, games, tournaments, champions, today's game).
const LUDO_CELLS: Record<number, number> = { 12: 1, 25: 2, 38: 3, 51: 4, 19: 0 };

class LudoGame extends Base {
  private pos = 0;
  private hopFrom = 0; private hopTo = 0; private hopT = 0; private moving = false;
  private rolling = 0; private dice = 1; private faceAt = 0;
  private winAt = 0;
  private dicePulse = true;
  private hoverDice = false;

  constructor(o: SceneOptions) { super(o); this.restart(); }

  restart() { this.pos = 0; this.moving = false; this.rolling = 0; this.winAt = 0; this.live = true; this.progress(0, 52); this.o.onSettled(); }
  protected relayout() { /* positions are derived on the fly */ }

  private cell(i: number) { const u = S / 15, [c, r] = RING[Math.min(i, 51)]; return { x: this.ox + (c + 0.5) * u, y: this.oy + (r + 0.5) * u }; }
  private get dicePos() { return this.o.mode === 'portrait' ? { x: this.ox + 70, y: (this.oy + S + this.vh) / 2 } : { x: this.ox / 2, y: this.vh / 2 }; }

  protected update(dt: number) {
    if (this.rolling > 0) {
      this.rolling -= dt;
      if (this.time >= this.faceAt) { this.dice = 1 + Math.floor(Math.random() * 6); this.faceAt = this.time + 0.07; }
      if (this.rolling <= 0) {
        this.rolling = 0; this.dice = 1 + Math.floor(Math.random() * 6);
        this.hopFrom = this.pos; this.hopTo = Math.min(52, this.pos + this.dice); this.hopT = 0; this.moving = true;
      }
    } else if (this.moving) {
      this.hopT += dt / (this.o.reduced ? 0.01 : 0.2);
      if (this.hopT >= this.hopTo - this.hopFrom) {
        this.moving = false; this.pos = this.hopTo; this.progress(this.pos, 52);
        if (this.pos >= 52) this.winAt = this.time + 2.2;
        else { const di = LUDO_CELLS[this.pos]; if (di !== undefined) { const d = this.def(di); if (d) this.o.onSelect(d); } }
      }
    }
    if (this.winAt && this.time >= this.winAt) this.restart();
  }

  private onDice(x: number, y: number) { const d = this.dicePos; return Math.abs(x - d.x) < 56 && Math.abs(y - d.y) < 56; }
  protected over(x: number, y: number) { this.hoverDice = this.onDice(x, y) && !this.rolling && !this.moving && !this.winAt; return this.hoverDice; }
  protected left() { this.hoverDice = false; }
  protected press(x: number, y: number) {
    if (!this.onDice(x, y) || this.rolling || this.moving || this.winAt) return;
    this.rolling = this.o.reduced ? 0.01 : 0.8; this.faceAt = 0; this.dicePulse = false;
  }

  protected paint() {
    const c = this.c, ox = this.ox, oy = this.oy, u = S / 15;
    c.save(); c.shadowColor = 'rgba(80,130,255,.5)'; c.shadowBlur = 24; this.rr(ox, oy, S, S, 28); c.fillStyle = '#f4f6ff'; c.fill(); c.restore();
    c.lineWidth = 4; c.strokeStyle = '#5b86ff'; this.rr(ox, oy, S, S, 28); c.stroke();
    const homes: [number, number, string][] = [[0, 0, '#ff5a4d'], [9, 0, '#2f6bff'], [9, 9, '#ffc933'], [0, 9, '#2fbf71']];
    for (const [a, b, col] of homes) { this.rr(ox + a * u, oy + b * u, 6 * u, 6 * u, 22); c.fillStyle = col; c.fill(); this.rr(ox + a * u + u, oy + b * u + u, 4 * u, 4 * u, 16); c.fillStyle = '#fff'; c.fill(); }
    c.lineWidth = 1; c.strokeStyle = '#c7d0f5';
    RING.forEach(([a, b], i) => { c.fillStyle = i === 0 ? '#bccaff' : '#fff'; c.fillRect(ox + a * u, oy + b * u, u, u); c.strokeRect(ox + a * u, oy + b * u, u, u); });
    const tint: [number, number, number, number, string][] = [[1, 7, 5, 1, '#f7c4c0'], [7, 1, 1, 5, '#bccaff'], [9, 7, 5, 1, '#b5e6cc'], [7, 9, 1, 5, '#fbe3a1']];
    for (const [a, b, w, h, col] of tint) { c.fillStyle = col; c.fillRect(ox + a * u, oy + b * u, w * u, h * u); c.strokeRect(ox + a * u, oy + b * u, w * u, h * u); }
    const cx = ox + 7.5 * u, cy = oy + 7.5 * u, a = 1.5 * u;
    const tri = (x1: number, y1: number, x2: number, y2: number, col: string) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(cx, cy); c.closePath(); c.fillStyle = col; c.fill(); };
    tri(cx - a, cy - a, cx + a, cy - a, '#2f6bff'); tri(cx + a, cy - a, cx + a, cy + a, '#2fbf71'); tri(cx + a, cy + a, cx - a, cy + a, '#ffc933'); tri(cx - a, cy + a, cx - a, cy - a, '#ff5a4d');
    const keys = Object.keys(LUDO_CELLS).map(Number);
    for (const idx of keys) { const d = this.def(LUDO_CELLS[idx]); if (d) { const p = this.cell(idx); this.badge(p.x, p.y, 17, d, true); } }
    for (const idx of keys) {
      const d = this.def(LUDO_CELLS[idx]); if (!d) continue;
      const p = this.cell(idx);
      this.pill(p.x, idx === 38 ? p.y - 46 : p.y + 24, d.label, d.kind === 'game' ? '#ffcf4d' : d.colors[1], ox + S, ox);
    }
    let tp = this.cell(this.pos), lift = 0;
    if (this.moving) {
      const done = Math.min(Math.floor(this.hopT), this.hopTo - this.hopFrom - 1), f = this.hopT - done;
      const from = this.cell(Math.min(52, this.hopFrom + done)), to = this.cell(Math.min(52, this.hopFrom + done + 1));
      tp = { x: from.x + (to.x - from.x) * Math.min(1, f), y: from.y + (to.y - from.y) * Math.min(1, f) }; lift = Math.sin(Math.min(1, f) * Math.PI) * 14;
    }
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(tp.x, tp.y + 12, 13, 5, 0, 0, 7); c.fill();
    c.beginPath(); c.arc(tp.x, tp.y - 4 - lift, 14, 0, 7); c.fillStyle = '#2f6bff'; c.fill(); c.lineWidth = 3.5; c.strokeStyle = '#fff'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(tp.x - 4, tp.y - 9 - lift, 4.5, 0, 7); c.fill();
    this.drawDice();
    if (this.winAt) { const q = clamp((this.time - (this.winAt - 2.2)) / 0.4, 0, 1); c.save(); c.globalAlpha = q; this.star(cx, cy, 110); c.fillStyle = '#ffcf4d'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke(); c.restore(); }
  }

  private drawDice() {
    const c = this.c, d = this.dicePos, size = 84, wob = this.rolling > 0 ? Math.sin(this.time * 30) * 0.22 : 0, sc = this.hoverDice ? 1.08 : 1;
    if (this.dicePulse && !this.o.reduced && !this.rolling) { const p = (this.time % 1.6) / 1.6; c.save(); c.globalAlpha = 0.5 * (1 - p); c.lineWidth = 4; c.strokeStyle = '#ffffff'; c.beginPath(); c.arc(d.x, d.y, 50 + p * 30, 0, 7); c.stroke(); c.restore(); }
    c.save(); c.translate(d.x, d.y); c.rotate(wob); c.scale(sc, sc);
    c.fillStyle = 'rgba(0,0,0,.3)'; this.rr(-size / 2 + 4, -size / 2 + 8, size, size, 18); c.fill();
    const g = c.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfc8ff');
    this.rr(-size / 2, -size / 2, size, size, 18); c.fillStyle = g; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(239,235,255,.8)'; c.stroke();
    const P: number[][] = [[4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
    for (const k of P[this.dice - 1]) { const gx = ((k % 3) - 1) * 24, gy = (Math.floor(k / 3) - 1) * 24; const rg = c.createRadialGradient(gx - 3, gy - 3, 1, gx, gy, 8); rg.addColorStop(0, '#6aa8ff'); rg.addColorStop(1, '#1f4fd8'); c.fillStyle = rg; c.beginPath(); c.arc(gx, gy, 8, 0, 7); c.fill(); }
    c.restore();
  }
}

/* ═════════════════════════ KNIGHT: chess knight moves ═════════════════════════ */

const KNIGHT_SQ: [number, number][] = [[4, 3], [2, 1], [6, 2], [1, 6], [5, 6]]; // game of the day, news, games, tournaments, champions
const JUMPS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];

class KnightGame extends Base {
  private kx = 3; private ky = 4;
  private from = { x: 3, y: 4 }; private hopT = 1;
  private visited = new Set<number>();
  private hov: number | null = null;
  private doneAt = 0;

  constructor(o: SceneOptions) { super(o); this.restart(); }

  restart() { this.kx = 3; this.ky = 4; this.from = { x: 3, y: 4 }; this.hopT = 1; this.visited = new Set([4 * 8 + 3]); this.doneAt = 0; this.live = true; this.progress(1, 64); this.o.onSettled(); }
  protected relayout() { /* fixed board */ }

  private get u() { return S / 8; }
  private sq(x: number, y: number) { return { x: this.ox + (x + 0.5) * this.u, y: this.oy + (y + 0.5) * this.u }; }
  private legal(x: number, y: number) { return x >= 0 && y >= 0 && x < 8 && y < 8 && JUMPS.some(([dx, dy]) => this.kx + dx === x && this.ky + dy === y); }
  private special(x: number, y: number) { return KNIGHT_SQ.findIndex(([a, b]) => a === x && b === y); }
  private cellAt(px: number, py: number): [number, number] | null { const x = Math.floor((px - this.ox) / this.u), y = Math.floor((py - this.oy) / this.u); return x >= 0 && y >= 0 && x < 8 && y < 8 ? [x, y] : null; }

  protected update(dt: number) {
    if (this.hopT < 1) {
      this.hopT = Math.min(1, this.hopT + dt / (this.o.reduced ? 0.01 : 0.38));
      if (this.hopT >= 1) {
        this.visited.add(this.ky * 8 + this.kx); this.progress(this.visited.size, 64);
        const si = this.special(this.kx, this.ky);
        if (si >= 0) { const d = this.def(si); if (d) this.o.onSelect(d); }
        if (this.visited.size === 64) this.doneAt = this.time + 2.2;
      }
    }
    if (this.doneAt && this.time >= this.doneAt) this.restart();
  }

  protected over(x: number, y: number) { const q = this.cellAt(x, y); this.hov = q && this.hopT >= 1 && this.legal(q[0], q[1]) ? q[1] * 8 + q[0] : null; return this.hov !== null; }
  protected left() { this.hov = null; }
  protected press(x: number, y: number) {
    const q = this.cellAt(x, y);
    if (!q || this.hopT < 1 || !this.legal(q[0], q[1])) return;
    this.from = { x: this.kx, y: this.ky }; this.kx = q[0]; this.ky = q[1]; this.hopT = 0; this.hov = null;
  }

  protected paint() {
    const c = this.c, u = this.u, ox = this.ox, oy = this.oy;
    this.frame3(ox - 14, oy - 14, S + 28, S + 28, 18, '#1d1450');
    for (let r = 0; r < 8; r++) for (let q = 0; q < 8; q++) {
      c.fillStyle = (r + q) % 2 ? '#4a6fe0' : '#d3deff'; c.fillRect(ox + q * u, oy + r * u, u, u);
      if (this.visited.has(r * 8 + q)) { c.fillStyle = 'rgba(255,207,77,.28)'; c.fillRect(ox + q * u, oy + r * u, u, u); }
    }
    if (this.hopT >= 1) for (const [dx, dy] of JUMPS) {
      const x = this.kx + dx, y = this.ky + dy; if (x < 0 || y < 0 || x > 7 || y > 7) continue;
      const p = this.sq(x, y), hv = this.hov === y * 8 + x;
      c.fillStyle = hv ? 'rgba(255,255,255,.95)' : 'rgba(16,22,58,.45)'; c.beginPath(); c.arc(p.x, p.y, hv ? 15 : 10, 0, 7); c.fill();
    }
    KNIGHT_SQ.forEach(([x, y], i) => { const d = this.def(i); if (!d) return; const p = this.sq(x, y); this.badge(p.x, p.y, 25, d, true); });
    KNIGHT_SQ.forEach(([x, y], i) => { const d = this.def(i); if (!d) return; const p = this.sq(x, y); this.pill(p.x, p.y + 28, d.label, d.kind === 'game' ? '#ffcf4d' : d.colors[1], ox + S, ox); });
    const a = this.sq(this.from.x, this.from.y), b = this.sq(this.kx, this.ky), t = smooth(this.hopT);
    const gx = a.x + (b.x - a.x) * t, gy = a.y + (b.y - a.y) * t, x = gx, y = gy - Math.sin(t * Math.PI) * 30;
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(gx, gy + 24, 22, 7, 0, 0, 7); c.fill();
    c.font = '66px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = '#10163a'; c.strokeText('♞︎', x, y + 4); c.fillStyle = '#fff'; c.fillText('♞︎', x, y + 4);
    if (this.doneAt) { const q = clamp((this.time - (this.doneAt - 2.2)) / 0.4, 0, 1); c.save(); c.globalAlpha = q; this.star(this.vw / 2, this.vh / 2, 110); c.fillStyle = '#ffcf4d'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#fff'; c.stroke(); c.restore(); }
  }
}

/** Build the mini-game for a theme. */
export function makeScene(o: SceneOptions): HeroEngine {
  return o.scene === 'match' ? new MatchGame(o) : o.scene === 'ludo' ? new LudoGame(o) : new KnightGame(o);
}
