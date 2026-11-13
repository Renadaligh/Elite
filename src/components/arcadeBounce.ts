/**
 * Plato Bounce: the mini game that runs on the arcade cabinet's screen in the hero.
 * Home screen (name + weekly top 5) -> keep the ball in the air by tapping near it -> score and rank.
 * The engine draws on one canvas; the name field is a real <input> placed over the screen by CSS.
 * Networking lives outside (arcadeApi.ts): the engine asks for the board and reports finished games.
 */
import type { Row } from './arcadeApi';

export interface ArcadeText {
  title: string; name: string; start: string; again: string; over: string; board: string; rank: string;
  empty: string; tapHint: string; tapStart: string; menu: string; resetDH: string; resetH: string; resetSoon: string;
}
export interface BounceOptions {
  canvas: HTMLCanvasElement;
  input: HTMLInputElement;
  text: ArcadeText;
  rtl: boolean;
  reduced: boolean;
  getBoard: () => { rows: Row[]; endsAt: number };
  /** Called once per finished game; resolves with the player's rank (or null when it could not be saved). */
  submit: (name: string, score: number, ms: number) => Promise<number | null>;
}

const W = 380, H = 250, K = 3; // logical size and backing-store scale
const FONT = 'Tajawal, Outfit, system-ui, sans-serif';
type Ui = 'home' | 'play' | 'over';
interface Spark { x: number; y: number; vx: number; vy: number; l: number }

export class ArcadeBounce {
  private o: BounceOptions;
  private c: CanvasRenderingContext2D;
  private ui: Ui = 'home';
  private mouse = { x: -1, y: -1 };
  private raf = 0; private last = 0; private t = 0; private running = false;
  private active = false;
  // current game
  private bx = W / 2; private by = 90; private vx = 0; private vy = 0;
  private score = 0; private waiting = true; private startedAt = 0; private sparks: Spark[] = [];
  private me = ''; private rank = 0; private ranking = false;
  private btn = { x: 14, y: 112, w: 150, h: 34 };

  constructor(o: BounceOptions) {
    this.o = o;
    o.canvas.width = W * K; o.canvas.height = H * K;
    this.c = o.canvas.getContext('2d')!;
    o.canvas.addEventListener('pointermove', this.onMove);
    o.canvas.addEventListener('pointerleave', this.onLeave);
    o.canvas.addEventListener('pointerdown', this.onDown);
    o.input.addEventListener('keydown', this.onKey);
    o.input.addEventListener('input', this.onType);
    this.syncInput();
    this.draw(0);
  }

  setText(text: ArcadeText, rtl: boolean) { this.o.text = text; this.o.rtl = rtl; if (!this.running) this.draw(0); }
  /** The cabinet is zoomed in: only then does the screen take input. */
  setActive(on: boolean) { this.active = on; if (!on && this.ui !== 'home') this.goHome(); }
  start() { if (this.running) return; this.running = true; this.last = 0; this.raf = requestAnimationFrame(this.frame); }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  destroy() {
    this.stop();
    const { canvas, input } = this.o;
    canvas.removeEventListener('pointermove', this.onMove); canvas.removeEventListener('pointerleave', this.onLeave); canvas.removeEventListener('pointerdown', this.onDown);
    input.removeEventListener('keydown', this.onKey); input.removeEventListener('input', this.onType);
  }

  /* ───── input ───── */
  private pos(e: PointerEvent) { const r = this.o.canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }; }
  private onMove = (e: PointerEvent) => { this.mouse = this.pos(e); };
  private onLeave = () => { this.mouse = { x: -1, y: -1 }; };
  private onType = () => { this.o.input.style.borderColor = ''; };
  private onKey = (e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); this.begin(); } };
  private inBtn(p: { x: number; y: number }) { const b = this.btn; return p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h; }
  private onDown = (e: PointerEvent) => {
    if (!this.active) return;
    const p = this.pos(e);
    if (this.ui === 'home') { if (this.inBtn(p)) this.begin(); return; }
    if (p.x < 76 && p.y < 30) { this.goHome(); return; }
    if (this.ui === 'over') { if (this.inBtn(p)) this.begin(); return; }
    // play: a tap kicks the ball up and away from the tap point
    if (this.waiting) { this.waiting = false; this.startedAt = performance.now(); }
    this.vy = -330; this.vx = Math.max(-240, Math.min(240, this.vx + (this.bx - p.x) * 4.2)); this.score++;
    for (let i = 0; i < 8; i++) this.sparks.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120, l: 0.5 });
  };

  private goHome() { this.ui = 'home'; this.syncInput(); }
  private begin() {
    const n = this.o.input.value.trim().slice(0, 12);
    if (!n) { this.o.input.focus(); this.o.input.style.borderColor = '#ff4f6d'; return; }
    this.me = n;
    try { localStorage.setItem('plato-arcade-name', n); } catch { /* storage unavailable */ }
    this.ui = 'play'; this.syncInput(); this.o.input.blur();
    this.bx = W / 2; this.by = 90; this.vx = 0; this.vy = 0; this.score = 0; this.waiting = true; this.sparks = [];
  }
  private syncInput() { this.o.input.hidden = this.ui !== 'home'; }
  private finish() {
    const score = this.score, ms = Math.round(performance.now() - this.startedAt);
    this.ui = 'over'; this.rank = 0; this.ranking = true; this.syncInput();
    void this.o.submit(this.me, score, ms).then((r) => { this.rank = r ?? 0; this.ranking = false; });
  }

  /* ───── loop ───── */
  private frame = (now: number) => {
    if (!this.running) return;
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0;
    this.last = now; this.t += dt;
    this.draw(dt);
    this.raf = requestAnimationFrame(this.frame);
  };

  /* ───── drawing ───── */
  private rr(x: number, y: number, w: number, h: number, r: number) {
    const c = this.c; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  private text(t: string, x: number, y: number, size: number, col = '#fff', align: CanvasTextAlign = 'center', weight = 800) {
    const c = this.c; c.fillStyle = col; c.font = `${weight} ${size}px ${FONT}`; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(t, x, y);
  }
  private bg() {
    const c = this.c, g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a2aa8'); g.addColorStop(0.6, '#2a1a8a'); g.addColorStop(1, '#0a0a45'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(140,170,255,.12)'; c.lineWidth = 1;
    for (let x = 0; x < W; x += 22) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let y = 0; y < H; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  }
  private button(label: string, y: number) {
    const c = this.c, b = { ...this.btn, y }, hv = this.active && this.mouse.x > b.x && this.mouse.x < b.x + b.w && this.mouse.y > b.y && this.mouse.y < b.y + b.h;
    this.rr(b.x, b.y, b.w, b.h, 17);
    const g = c.createLinearGradient(0, b.y, b.w, b.y); g.addColorStop(0, hv ? '#5b7bff' : '#3b5bff'); g.addColorStop(1, hv ? '#a06bff' : '#8a4bff'); c.fillStyle = g; c.fill();
    this.text(label, b.x + b.w / 2, b.y + b.h / 2 + 1, 14);
  }
  private left() {
    const { text: L } = this.o, ms = this.o.getBoard().endsAt - Date.now();
    const d = Math.floor(ms / 86_400_000), h = Math.max(0, Math.floor((ms % 86_400_000) / 3_600_000));
    if (ms <= 0) return L.resetSoon;
    return d > 0 ? L.resetDH.replace('{d}', String(d)).replace('{h}', String(h)) : L.resetH.replace('{h}', String(Math.max(1, h)));
  }
  private board(highlight: string) {
    const c = this.c, L = this.o.text, rtl = this.o.rtl, rows = this.o.getBoard().rows.slice(0, 5);
    this.rr(184, 44, 184, 196, 12); c.fillStyle = 'rgba(8,8,60,.55)'; c.fill(); c.strokeStyle = 'rgba(150,180,255,.45)'; c.lineWidth = 1.5; c.stroke();
    this.text(L.board, 276, 60, 12, '#ffd23a');
    if (!rows.length) { this.text(L.empty, 276, 140, 12, '#b4b9e6', 'center', 700); return; }
    const medal = ['#ffd23a', '#cfd6ff', '#ff9a5a', '#8d96d8', '#8d96d8'];
    rows.forEach((r, i) => {
      const y = 84 + i * 30, mine = highlight !== '' && r.n.toLowerCase() === highlight.toLowerCase();
      this.rr(194, y - 12, 164, 24, 8); c.fillStyle = mine ? 'rgba(255,210,58,.22)' : 'rgba(255,255,255,.07)'; c.fill();
      if (mine) { c.strokeStyle = '#ffd23a'; c.lineWidth = 1.5; c.stroke(); }
      const rankX = rtl ? 347 : 205, nameX = rtl ? 330 : 222, scoreX = rtl ? 208 : 346;
      this.text(String(i + 1), rankX, y, 12, medal[i], 'center');
      this.text(r.n, nameX, y, 12, '#fff', rtl ? 'right' : 'left', 700);
      this.text(String(r.s), scoreX, y, 13, '#46d6ff', 'center');
    });
  }
  private menuPill() {
    const c = this.c; this.rr(8, 8, 62, 22, 11); c.fillStyle = 'rgba(255,255,255,.12)'; c.fill(); this.text(this.o.text.menu, 39, 19, 10, '#fff', 'center', 700);
  }

  private draw(dt: number) {
    const c = this.c; c.setTransform(K, 0, 0, K, 0, 0); c.clearRect(0, 0, W, H);
    if (this.ui === 'home') this.drawHome();
    else if (this.ui === 'over') this.drawOver();
    else this.drawPlay(dt);
  }
  private drawHome() {
    const L = this.o.text; this.bg();
    this.text(L.title, W / 2, 22, 20, '#ffd23a');
    this.text(L.name, 89, 60, 12, '#b4b9e6', 'center', 700);
    this.button(L.start, 112);
    this.text(this.left(), 89, 164, 11, '#b4b9e6', 'center', 700);
    this.text(L.tapHint, 89, 186, 10, '#8d96d8', 'center', 500);
    this.board(this.o.input.value.trim());
  }
  private drawOver() {
    const L = this.o.text; this.bg();
    this.text(L.title, W / 2, 22, 20, '#ffd23a');
    this.text(L.over, 89, 52, 14, '#ff9ec7');
    this.text(String(this.score), 89, 88, 38);
    this.text(this.ranking ? '…' : this.rank ? `${L.rank} #${this.rank} · ${this.me}` : this.me, 89, 128, 11, '#46d6ff', 'center', 700);
    this.button(L.again, 146);
    this.text(this.left(), 89, 196, 10, '#b4b9e6', 'center', 700);
    this.menuPill();
    this.board(this.me);
  }
  private drawPlay(dt: number) {
    const c = this.c, s = Math.min(dt, 0.033), L = this.o.text; this.bg();
    if (!this.waiting) { this.vy += 760 * s; this.bx += this.vx * s; this.by += this.vy * s; }
    if (this.bx < 20) { this.bx = 20; this.vx = Math.abs(this.vx) * 0.8; }
    if (this.bx > W - 20) { this.bx = W - 20; this.vx = -Math.abs(this.vx) * 0.8; }
    if (this.by < 20) { this.by = 20; this.vy = Math.abs(this.vy) * 0.5; }
    if (this.by > H - 34 && !this.waiting && this.score > 0) { this.finish(); return; }
    c.fillStyle = '#14126a'; c.fillRect(0, H - 16, W, 16); c.fillStyle = '#5b86ff'; c.fillRect(0, H - 16, W, 2.5);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(this.bx, H - 16, Math.max(5, 19 - (H - this.by) / 10), 4, 0, 0, 7); c.fill();
    const g = c.createRadialGradient(this.bx - 6, this.by - 7, 3, this.bx, this.by, 19);
    g.addColorStop(0, '#c9f0ff'); g.addColorStop(0.45, '#4f86ff'); g.addColorStop(1, '#5a1fc0'); c.fillStyle = g; c.beginPath(); c.arc(this.bx, this.by, 18, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(this.bx - 6, this.by - 7, 5.5, 3.2, -0.6, 0, 7); c.fill();
    this.sparks = this.sparks.filter((p) => {
      p.l -= s; p.x += p.vx * s; p.y += p.vy * s;
      c.globalAlpha = Math.max(0, p.l * 2); c.fillStyle = '#ffd23a'; c.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); c.globalAlpha = 1; return p.l > 0;
    });
    this.text(String(this.score), W / 2, 56, 40, 'rgba(255,255,255,.92)');
    if (this.waiting) this.text(L.tapStart, W / 2, H / 2 + 34, 13, '#b4b9e6', 'center', 700);
    this.menuPill();
  }
}
