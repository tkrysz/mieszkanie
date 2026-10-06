(function () {
'use strict';
// ───────────── układ: metry, x → wschód (w prawo na rzucie), z → południe (w dół na rzucie) ─────────────
const H = 2.6, H_LOW = 1.15, TO = 0.25, TI = 0.12;
const NW = 0.125, WW = 0.125, EW = 8.6 - 0.125, SW = 6.75 - 0.125; // wewnętrzne lica ścian zewnętrznych

let seed = 7;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// ───────────── renderer / scena ─────────────
const el = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
el.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.02; controls.minDistance = 0.5; controls.maxDistance = 40;

const hemi = new THREE.HemisphereLight(0xffffff, 0xb9ae9e, 0.55); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.1);
sun.position.set(-5, 13, 12); sun.target.position.set(4.3, 0, 3.4);
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025; sun.shadow.radius = 3;
scene.add(sun, sun.target);

// ───────────── materiały / tekstury ─────────────
const std = (color, rough = 0.85, metal = 0, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, o));
const tex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const jit = (hex, a) => { const c = new THREE.Color(hex); const v = (rnd() - 0.5) * a; c.offsetHSL(0, 0, v); return '#' + c.getHexString(); };

function plankCanvas(base, boardW, boardL, spread) { // 2.4 m × 2.4 m
  const S = 1024, [c, g] = mk(S, S), k = S / 2.4, bw = boardW * k, bl = boardL * k;
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  const cols = Math.round(S / bw);
  for (let i = 0; i < cols; i++) {
    let y = -rnd() * bl;
    while (y < S) {
      const L = bl * (0.75 + rnd() * 0.5);
      g.fillStyle = jit(base, spread); g.fillRect(i * bw, y, bw, L);
      for (let n = 0; n < 7; n++) { g.strokeStyle = 'rgba(70,40,15,' + (0.05 + rnd() * 0.1) + ')'; g.lineWidth = 1 + rnd() * 1.5; const x = i * bw + rnd() * bw; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 6, y + L); g.stroke(); }
      if (rnd() < 0.4) { g.fillStyle = 'rgba(60,35,15,.35)'; g.beginPath(); g.ellipse(i * bw + rnd() * bw, y + rnd() * L, 2.5, 5, 0, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(40,25,10,.55)'; g.fillRect(i * bw, y, bw, 1.6);
      y += L;
    }
    g.fillStyle = 'rgba(40,25,10,.45)'; g.fillRect(i * bw, 0, 1.6, S);
  }
  return c;
}
const laminateC = plankCanvas('#c39a64', 0.19, 1.3, 0.1);
const tileWoodC = plankCanvas('#b78850', 0.2, 1.2, 0.14);
function chevronCanvas() {
  const S = 512, [c, g] = mk(S, S);
  g.fillStyle = '#fbfbfa'; g.fillRect(0, 0, S, S);
  g.strokeStyle = '#8d8d8d'; g.lineWidth = 2;
  const step = 32, amp = 64, per = 128;
  for (let r = -4; r < S / step + 4; r++) {
    g.beginPath();
    for (let x = 0; x <= S; x += per / 2) { const y = r * step + ((x / (per / 2)) % 2 === 0 ? 0 : amp); x === 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.stroke();
  }
  return c;
}
function brickCanvas() {
  const [c, g] = mk(512, 512);
  g.fillStyle = '#f2eee6'; g.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 8; r++) for (let i = -1; i < 5; i++) {
    const x = i * 128 + (r % 2 ? 64 : 0);
    g.fillStyle = jit('#e0d6c4', 0.1); g.fillRect(x + 3, r * 64 + 3, 122, 58);
  }
  return c;
}
const gridC = (() => { const [c, g] = mk(256, 256); g.fillStyle = '#9ca3a8'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#6c7378'; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256); g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(0, 0, 256, 128); return c; })();

const M = {
  wall: std(0xeceae5, 0.95), cap: std(0x3b4048, 0.6), slab: std(0xe4e0d9, 0.9),
  cab: 0xd9d5cd, white: 0xf3f2ee,
  oak: std(0xb8844c, 0.6), oakL: std(0xd7ae78, 0.6),
  black: std(0x1a1a1c, 0.35, 0.2), steel: std(0xb7bcc0, 0.3, 0.8), chrome: std(0xdfe3e6, 0.15, 1),
  whiteM: std(0xf3f2ee, 0.6), gloss: std(0xfbfbfb, 0.15),
  glass: new THREE.MeshStandardMaterial({ color: 0xbfe0ee, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false }),
  glassF: new THREE.MeshStandardMaterial({ color: 0xe6efee, transparent: true, opacity: 0.45, roughness: 0.2, depthWrite: false }),
  frame: std(0xffffff, 0.5), leaf: std(0xfdfdfd, 0.5), door: std(0xc5a278, 0.7),
  green: std(0x3f7d3c, 0.7), green2: std(0x5c9a45, 0.7), pot: std(0xe8e6e1, 0.7), potG: std(0x6b7378, 0.7),
  grey: std(0x8f9296, 1), greyD: std(0x4a4d52, 1), rattan: std(0x6f7174, 0.9), sofa: std(0xb9a998, 1),
  tvBlack: std(0x0a0a0c, 0.2, 0.3), lampW: std(0xffffff, 0.5, 0, { emissive: 0xffe9c4, emissiveIntensity: 0.15 }),
  lampDark: std(0x26272a, 0.5, 0.2), wood: std(0xd9b383, 0.7), tileG: std(0x9aa0a4, 0.8),
};
const floorMat = (c, w, d) => std(0xffffff, 0.55, 0, { map: tex(c, w / 2.4, d / 2.4) });
const chevMat = (w, h) => std(0xffffff, 0.35, 0, { map: tex(chevronCanvas(), w / 0.9, h / 0.9) });

// ───────────── grupy ─────────────
const root = new THREE.Group(); scene.add(root);
const gStat = new THREE.Group(), gFull = new THREE.Group(), gLow = new THREE.Group(), gLamp = new THREE.Group(), gLab = new THREE.Group();
root.add(gStat, gFull, gLow, gLamp, gLab);

function B(g, x0, z0, x1, z1, y0, y1, mat, cast = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), y1 - y0, Math.abs(z1 - z0)), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = cast; m.receiveShadow = true; g.add(m); return m;
}
function CYL(g, x, z, y0, y1, r, mat, rt = r, seg = 28) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, r, y1 - y0, seg), mat); m.position.set(x, (y0 + y1) / 2, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function SPH(g, x, y, z, r, mat, sx = 1, sy = 1, sz = 1) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; g.add(m); return m; }
function PL(g, w, h, x, y, z, ry, mat) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); return m; }

// fronty szafek w stylu shaker
const shakerCache = {};
function shakerMat(col, w, h) {
  const key = col + w.toFixed(2) + h.toFixed(2);
  if (shakerCache[key]) return shakerCache[key];
  const k = 180, [c, g] = mk(Math.max(8, Math.round(w * k)), Math.max(8, Math.round(h * k)));
  const base = '#' + new THREE.Color(col).getHexString();
  g.fillStyle = base; g.fillRect(0, 0, c.width, c.height);
  const f = Math.min(0.075 * k, c.width / 3, c.height / 3);
  g.fillStyle = 'rgba(0,0,0,.20)'; g.fillRect(f - 1, f - 1, c.width - 2 * f + 2, 3);
  g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(f - 1, f - 1, 3, c.height - 2 * f + 2);
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(f - 1, c.height - f - 1, c.width - 2 * f + 2, 3); g.fillRect(c.width - f - 1, f - 1, 3, c.height - 2 * f + 2);
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.strokeRect(1, 1, c.width - 2, c.height - 2);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
  return (shakerCache[key] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }));
}
const FACES = { '+z': [0, 0, 1, 0, 1, 0, 0], '-z': [0, 0, -1, Math.PI, 1, 0, 0], '+x': [1, 0, 0, Math.PI / 2, 0, 0, 1], '-x': [-1, 0, 0, -Math.PI / 2, 0, 0, 1] };
// face, c (stała współrzędna), a0..a1 (zakres poziomy), y0..y1; nx × ny pól; handle: 'h' | 'v' | null
function shaker(g, face, c, a0, a1, y0, y1, col, nx = 1, ny = 1, handle = 'h', gap = 0.006) {
  const [nX, , nZ, ry, tX, , tZ] = FACES[face];
  const cw = (a1 - a0) / nx, ch = (y1 - y0) / ny;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const aa = a0 + cw * (i + 0.5), yy = y0 + ch * (j + 0.5);
    const w = cw - gap, h = ch - gap;
    const m = PL(g, w, h, nX * 0.002 + (nX ? c : aa), yy, nZ * 0.002 + (nZ ? c : aa), ry, shakerMat(col, w, h));
    m.castShadow = false;
    if (handle) {
      const L = 0.14, hh = handle === 'h' ? 0.012 : L, ww = handle === 'h' ? L : 0.012;
      const hy = handle === 'h' ? y0 + ch * (j + 1) - 0.06 : yy;
      const hx = nX ? c + nX * 0.012 : aa, hz = nZ ? c + nZ * 0.012 : aa;
      const sx = Math.abs(tX) * ww + Math.abs(nX) * 0.014, sz = Math.abs(tZ) * ww + Math.abs(nZ) * 0.014;
      const hm = new THREE.Mesh(new THREE.BoxGeometry(sx || 0.014, hh, sz || 0.014), M.black); hm.position.set(hx, hy, hz); g.add(hm);
    }
  }
}

// ───────────── podłoże i podłogi ─────────────
B(gStat, -0.4, -0.4, 9.0, 7.0, -0.25, 0, M.slab);
function floor(x0, z0, x1, z1, mat) { const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), mat); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.004, (z0 + z1) / 2); m.receiveShadow = true; gStat.add(m); }
const tileWood = (w, d) => floorMat(tileWoodC, w, d);
floor(0, 0, 3.25, 5.45, floorMat(laminateC, 3.25, 5.45));                                  // salon
floor(3.25, 0, 6.77, 2.3, tileWood(3.52, 2.3)); floor(5.57, 2.3, 6.77, 3.0, tileWood(1.2, 0.7)); // hol
floor(3.25, 2.3, 5.57, 5.45, tileWood(2.32, 3.15));                                        // kuchnia
floor(6.77, 0, 8.6, 3.0, tileWood(1.83, 3.0));                                             // łazienka
floor(5.57, 3.0, 8.6, 6.75, floorMat(laminateC, 3.03, 3.75));                              // pokój
floor(0, 5.45, 5.57, 6.75, std(0xffffff, 0.8, 0, { map: tex(gridC, 5.57 / 0.6, 1.3 / 0.6) })); // loggia

// ───────────── ściany ─────────────
const brickTexBase = tex(brickCanvas(), 1, 1);
function brickMats(a, len, hgt) {
  const t = brickTexBase.clone(); t.needsUpdate = true; t.repeat.set(len / 1.0, hgt / 0.52); t.offset.set(a / 1.0, 0);
  return [M.wall, M.wall, M.wall, M.wall, std(0xffffff, 0.95, 0, { map: t }), M.wall];
}
const Bw = (h, g, a0, a1, p0, p1, y0, y1, mat) => h ? B(g, a0, p0, a1, p1, y0, y1, mat) : B(g, p0, a0, p1, a1, y0, y1, mat);
const WALLS = [
  // zewnętrzne
  { h: true, f: 0, a0: 0, a1: 8.6, t: TO, ops: [{ c: 5.0, w: 0.92, sill: 0, top: 2.1, type: 'door', leaf: 'closed' }] },
  { h: false, f: 8.6, a0: 0, a1: 6.75, t: TO },
  { h: false, f: 0, a0: 0, a1: 6.75, t: TO },
  { h: true, f: 6.75, a0: 5.57, a1: 8.6, t: TO, ops: [{ c: 7.1, w: 1.2, sill: 0.9, top: 2.1, type: 'win' }] },
  // wewnętrzne
  { h: false, f: 3.25, a0: 2.3, a1: 5.45, t: TI },
  { h: true, f: 2.3, a0: 3.25, a1: 5.57, t: TI, ops: [{ c: 4.4, w: 0.9, sill: 0, top: 2.05, type: 'door', leaf: { hinge: 'hi', dir: -1 } }] },
  { h: false, f: 5.57, a0: 2.3, a1: 6.75, t: TI },
  { h: false, f: 6.77, a0: 0, a1: 3.0, t: TI, ops: [{ c: 1.55, w: 0.82, sill: 0, top: 2.05, type: 'door', leaf: { hinge: 'lo', dir: -1 } }] },
  { h: true, f: 3.0, a0: 5.57, a1: 8.6, t: TI, ops: [{ c: 6.12, w: 0.82, sill: 0, top: 2.05, type: 'door', leaf: { hinge: 'lo', dir: 1 } }] },
  { h: true, f: 5.45, a0: 0, a1: 5.57, t: TI, brick: true, ops: [{ c: 1.35, w: 1.3, sill: 0, top: 2.2, type: 'gdoor' }, { c: 4.3, w: 1.1, sill: 0.95, top: 2.15, type: 'win' }] },
];
function buildWall(g, Hh, full, w) {
  const { h, f, t } = w, ops = (w.ops || []).slice().sort((a, b) => a.c - b.c);
  const seg = (a, b, y0, y1) => { if (b - a < 1e-3 || y1 - y0 < 1e-3) return; Bw(h, g, a, b, f - t / 2, f + t / 2, y0, y1, w.brick ? brickMats(a, b - a, y1 - y0) : M.wall); if (!full && y1 === Hh) Bw(h, g, a, b, f - t / 2 - 0.005, f + t / 2 + 0.005, Hh, Hh + 0.025, M.cap); };
  let cur = w.a0 - t / 2;
  ops.forEach(o => {
    const lo = o.c - o.w / 2, hi = o.c + o.w / 2;
    seg(cur, lo, 0, Hh);
    if (o.sill > 0) seg(lo, hi, 0, Math.min(o.sill, Hh));
    if (o.top < Hh) seg(lo, hi, o.top, Hh);
    cur = hi;
    if (!full) return;
    if (o.type === 'win' || o.type === 'gdoor') {
      Bw(h, g, lo, hi, f - 0.008, f + 0.008, o.sill, o.top, M.glass);
      const fr = 0.055, p0 = f - t * 0.32, p1 = f + t * 0.32;
      Bw(h, g, lo, lo + fr, p0, p1, o.sill, o.top, M.frame); Bw(h, g, hi - fr, hi, p0, p1, o.sill, o.top, M.frame);
      Bw(h, g, lo, hi, p0, p1, o.top - fr, o.top, M.frame);
      if (o.type === 'win') Bw(h, g, lo, hi, p0, p1, o.sill, o.sill + fr, M.frame);
      Bw(h, g, o.c - 0.02, o.c + 0.02, p0, p1, o.sill, o.top, M.frame);
      if (o.type === 'win') Bw(h, g, lo - 0.04, hi + 0.04, f - t / 2 - 0.05, f + t / 2 + 0.05, o.sill - 0.03, o.sill, M.oakL);
    } else if (o.leaf === 'closed') {
      Bw(h, g, lo, hi, f - 0.03, f + 0.03, 0, o.top - 0.05, M.door);
      Bw(h, g, lo - 0.04, lo, f - 0.07, f + 0.07, 0, o.top, M.black); Bw(h, g, hi, hi + 0.04, f - 0.07, f + 0.07, 0, o.top, M.black); Bw(h, g, lo, hi, f - 0.07, f + 0.07, o.top - 0.05, o.top, M.black);
      Bw(h, g, hi - 0.1, hi - 0.06, f + 0.03, f + 0.1, 1.0, 1.04, M.chrome);
    } else if (o.leaf) {
      const hp = o.leaf.hinge === 'lo' ? lo : hi, d = o.leaf.dir, th = 0.04;
      Bw(h, g, hp - th / 2, hp + th / 2, f, f + d * o.w, 0, 2.03, M.leaf);
      for (let i = 0; i < 6; i++) Bw(h, g, hp - th / 2 - 0.004, hp + th / 2 + 0.004, f + d * o.w * 0.18, f + d * o.w * 0.82, 0.32 + i * 0.3, 0.38 + i * 0.3, M.oakL);
    }
  });
  seg(cur, w.a1 + t / 2, 0, Hh);
}
WALLS.forEach(w => { buildWall(gFull, H, true, w); buildWall(gLow, H_LOW, false, w); });
// balustrada loggii
(function () {
  const g = gStat, z = 6.68;
  for (let i = 0; i < 6; i++) { const x0 = i * (5.57 / 6) + 0.02; B(g, x0, z - 0.012, x0 + 5.57 / 6 - 0.04, z + 0.012, 0.12, 1.1, M.glassF); }
  B(g, 0, z - 0.04, 5.57, z + 0.04, 1.1, 1.14, M.steel); B(g, 0, z - 0.04, 5.57, z + 0.04, 0.06, 0.12, M.steel);
  for (let i = 0; i <= 6; i++) B(g, i * (5.57 / 6) - 0.02, z - 0.03, i * (5.57 / 6) + 0.02, z + 0.03, 0.06, 1.1, M.steel);
})();

// ───────────── drobne elementy ─────────────
function plant(g, x, y, z, s, o = {}) {
  return;
  const grp = new THREE.Group(); grp.position.set(x, y, z); g.add(grp);
  if (!o.noPot) CYL(grp, 0, 0, 0, 0.2 * s, 0.1 * s, o.potMat || M.pot, 0.12 * s);
  const n = o.n || 14, big = o.big || 1;
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.28, r = (o.spread || 0.25) * s * (0.3 + rnd() * 0.7), hy = 0.2 * s + (o.hang ? -rnd() * (o.hang) : rnd() * 0.5 * s);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), rnd() < 0.5 ? M.green : M.green2);
    leaf.scale.set(0.17 * s * big * (0.7 + rnd() * 0.6), 0.012 * s, 0.13 * s * big * (0.7 + rnd() * 0.6));
    leaf.position.set(Math.cos(a) * r, hy, Math.sin(a) * r); leaf.rotation.set((rnd() - 0.5) * (o.hang ? 2.2 : 1.1), a, (rnd() - 0.5) * 1.1); leaf.castShadow = true; grp.add(leaf);
    if (!o.hang) { const st = CYL(grp, Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, 0.2 * s, hy, 0.006 * s, M.green); }
  }
  return grp;
}
function chair(g, x, z, ang) {
  const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ang; g.add(c);
  B(c, -0.21, -0.21, 0.21, 0.21, 0.43, 0.5, M.grey); B(c, -0.21, -0.22, 0.21, -0.17, 0.5, 0.95, M.grey);
  [[-.19, -.19], [.19, -.19], [-.19, .19], [.19, .19]].forEach(([a, b]) => B(c, a - 0.02, b - 0.02, a + 0.02, b + 0.02, 0, 0.43, M.wood));
}
function radiator(g, x, z, w, ry) {
  const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; g.add(grp);
  B(grp, -w / 2, -0.04, w / 2, 0.04, 0.16, 0.76, M.whiteM);
  for (let i = 0; i < Math.floor(w / 0.06); i++) B(grp, -w / 2 + 0.03 + i * 0.06, 0.04, -w / 2 + 0.036 + i * 0.06, 0.045, 0.17, 0.75, std(0xcfcfcf));
}
function pendant(g, x, z, drop, col) {
  const grp = new THREE.Group(); grp.position.set(x, H, z); g.add(grp);
  CYL(grp, 0, 0, -drop, 0, 0.004, M.black);
  CYL(grp, 0, 0, -drop - 0.12, -drop, 0.022, M.wood);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.17, 0.26, 32, 1, true), new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide }));
  sh.position.y = -drop - 0.12 - 0.13; sh.castShadow = true; grp.add(sh);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.168, 0.255, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xfff7e8, emissive: 0xffe2b0, emissiveIntensity: 0.15, side: THREE.BackSide })); inner.position.copy(sh.position); grp.add(inner); lampEm.push(inner.material);
  SPH(grp, 0, sh.position.y - 0.09, 0, 0.045, M.lampW);
}
const lampEm = [M.lampW];

// ───────────── SALON ─────────────
(function () {
  const g = gStat;
  // sofa rozkładana przy północnej ścianie
  B(g, 0.35, NW, 2.35, 0.98, 0.1, 0.42, M.sofa); B(g, 0.35, NW, 2.35, 0.36, 0.42, 0.88, M.sofa);
  B(g, 0.35, 0.36, 0.6, 0.98, 0.1, 0.62, M.sofa); B(g, 2.1, 0.36, 2.35, 0.98, 0.1, 0.62, M.sofa);
  [0.6, 1.1, 1.6].forEach(x => B(g, x + 0.01, 0.38, x + 0.49, 0.98, 0.42, 0.52, std(0xc2b3a2, 1)));
  [0.62, 1.12, 1.62].forEach(x => B(g, x + 0.02, 0.36, x + 0.48, 0.45, 0.52, 0.85, std(0xc2b3a2, 1)));
  // lampa podłogowa (drewniana)
  CYL(g, 0.22, 1.25, 0, 0.02, 0.14, M.black); CYL(g, 0.22, 1.25, 0, 1.55, 0.015, M.wood);
  const arm = B(g, 0.22, 1.25, 0.9, 1.31, 1.52, 1.56, M.wood); arm.position.set(0.55, 1.6, 1.27); arm.rotation.z = 0.3; arm.scale.x = 1;
  const sh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 20, 1, true), std(0xffffff, 0.4, 0, { side: THREE.DoubleSide })); sh.position.set(0.9, 1.6, 1.29); sh.rotation.z = Math.PI + 0.3; g.add(sh);
  // stół jadalniany + krzesła
  B(g, 0.95, 2.25, 1.85, 3.75, 0.7, 0.75, M.whiteM); [[1, 2.3], [1.8, 2.3], [1, 3.7], [1.8, 3.7]].forEach(([x, z]) => B(g, x - 0.04, z - 0.04, x + 0.04, z + 0.04, 0, 0.7, M.whiteM));
  chair(g, 0.62, 2.7, Math.PI / 2); chair(g, 0.62, 3.3, Math.PI / 2); chair(g, 2.18, 2.7, -Math.PI / 2); chair(g, 2.18, 3.3, -Math.PI / 2);
  [[1.35, 2.5], [1.35, 3.5]].forEach(([x, z]) => { CYL(g, x, z, 0.75, 0.765, 0.1, M.whiteM); CYL(g, x, z, 0.765, 0.83, 0.05, M.pot, 0.065); });
  // zabudowa RTV wg zdjęcia: komoda pod TV, szafka nad TV, niski słupek, biurko z monitorem i szafką
  const X0 = 2.77, X1 = 3.19, WH = 0xf4f3ef;
  B(g, X0, 2.45, X1, 3.8, 0, 0.56, M.whiteM); shaker(g, '-x', X0, 2.45, 3.8, 0.02, 0.56, WH, 2, 2, 'h');
  B(g, X0 + 0.02, 2.5, X1, 3.55, 1.68, 2.15, M.whiteM); shaker(g, '-x', X0 + 0.02, 2.5, 3.55, 1.68, 2.15, WH, 2, 1, 'v');
  B(g, X1 - 0.05, 2.55, X1 - 0.01, 3.65, 0.8, 1.5, M.tvBlack); B(g, X1 - 0.05, 2.55, X1 - 0.045, 3.65, 0.8, 1.5, std(0x15191f, 0.1, 0.5));
  B(g, X0, 3.8, X1, 4.4, 0, 1.95, M.whiteM); shaker(g, '-x', X0, 3.8, 4.4, 0.02, 1.95, WH, 1, 5, 'h');
  B(g, 2.59, 4.4, X1, 5.3, 0.73, 0.76, M.whiteM); B(g, 2.59, 5.26, X1, 5.3, 0, 0.73, M.whiteM);
  B(g, 2.84, 4.4, X1, 5.3, 1.6, 2.15, M.whiteM); shaker(g, '-x', 2.84, 4.4, 5.3, 1.6, 2.15, WH, 2, 1, 'v');
  B(g, 2.9, 4.4, X1, 5.3, 1.12, 1.15, M.whiteM);
  B(g, 3.08, 4.65, 3.14, 5.1, 0.98, 1.4, M.tvBlack); B(g, 2.98, 4.8, 3.1, 4.95, 0.76, 0.98, M.black); B(g, 2.8, 4.65, 3.0, 5.05, 0.76, 0.775, M.black);
  B(g, 2.95, 4.5, X1, 4.85, 0, 0.45, M.black);
  (function () { const c = new THREE.Group(); c.position.set(2.1, 0, 4.85); c.rotation.y = -Math.PI / 2 + 0.2; g.add(c);
    CYL(c, 0, 0, 0.1, 0.45, 0.025, M.black); for (let k = 0; k < 5; k++) { const a = k * 1.2566; B(c, Math.cos(a) * 0.12 - 0.03, Math.sin(a) * 0.12 - 0.02, Math.cos(a) * 0.12 + 0.03, Math.sin(a) * 0.12 + 0.02, 0.05, 0.09, M.black); }
    B(c, -0.25, -0.25, 0.25, 0.25, 0.45, 0.5, M.black); B(c, -0.23, -0.27, 0.23, -0.22, 0.5, 1.05, M.black); B(c, -0.15, -0.28, 0.15, -0.24, 1.05, 1.22, M.black); B(c, -0.28, -0.15, -0.25, 0.1, 0.62, 0.68, M.black); B(c, 0.25, -0.15, 0.28, 0.1, 0.62, 0.68, M.black); })();
  // drobiazgi na komodzie
  // monstera + pnącza
  plant(g, 3.0, 2.15, 4.65, 1.6, { n: 22, big: 1.6, spread: 0.3, hang: 0.9 });
  plant(g, 3.0, 2.15, 4.2, 1.1, { n: 12, big: 1.2, hang: 0.5, potMat: M.potG });
  plant(g, 2.97, 0.56, 3.75, 0.7, { n: 8, hang: 0.3 });
  plant(g, 2.9, 0, 5.2, 1.5, { n: 18, big: 1.4, spread: 0.35 });
  // narożny regał (wąski, z półkami) i ścianka
  B(g, 2.78, NW, 3.19, 0.5, 0, 0.04, M.whiteM); [0.5, 0.95, 1.4, 1.85].forEach(y => B(g, 2.78, NW, 3.19, 0.5, y, y + 0.025, M.whiteM));
  B(g, 3.17, NW, 3.19, 0.5, 0, 2.15, M.whiteM); B(g, 2.76, NW, 2.78, 0.5, 0, 2.15, M.whiteM);
  B(g, 2.85, 0.2, 2.95, 0.3, 0.525, 0.6, std(0xb98a58));
  // lampa sufitowa (3 kule)
  const lg = gLamp; CYL(lg, 1.6, 2.2, H - 0.02, H, 0.06, M.whiteM);
  [[0, 0, -0.09], [0.28, -0.1, 0.05], [-0.2, -0.16, 0.2]].forEach(([a, b, c]) => { CYL(lg, 1.6 + a * 0.6, 2.2 + c * 0.6, H + b * 0.2 - 0.12, H - 0.02, 0.006, M.whiteM); SPH(lg, 1.6 + a, H - 0.18 + b, 2.2 + c, 0.1, M.lampW); });
})();

// ───────────── HOL ─────────────
(function () {
  const g = gStat, WH = 0xf6f5f1;
  // szafa przy wejściu (lewa)
  B(g, 3.26, NW, 3.9, 0.7, 0, 2.5, M.whiteM); shaker(g, '+z', 0.7, 3.26, 3.9, 0.02, 1.7, WH, 1, 2, null); shaker(g, '+z', 0.7, 3.26, 3.9, 1.7, 2.5, WH, 1, 1, null);
  [[3.55, 0.95], [3.55, 2.0]].forEach(([x, y]) => { const k = SPH(g, x, y, 0.72, 0.018, std(0xc9a46a, 0.3, 0.7)); });
  // hak + ławeczka
  [4.1, 4.2, 4.3].forEach((x, i) => { B(g, x - 0.01, NW, x + 0.01, 0.2, 1.45 + (i === 1 ? -0.1 : 0), 1.47 + (i === 1 ? -0.1 : 0), M.steel); });
  B(g, 3.97, NW, 4.42, 0.5, 0, 0.42, M.whiteM); B(g, 3.99, NW + 0.02, 4.4, 0.48, 0.22, 0.26, std(0xf0f0ee)); B(g, 3.97, NW, 4.42, 0.5, 0.42, 0.47, std(0x7b7e86, 1));
  // szafa po prawej od drzwi (zgodnie z rzutem: tylko do ściany łazienki)
  B(g, 5.5, NW, 6.7, 0.75, 0, 2.55, M.whiteM); shaker(g, '+z', 0.75, 5.5, 6.7, 0.02, 1.75, WH, 2, 1, null); shaker(g, '+z', 0.75, 5.5, 6.7, 1.75, 2.55, WH, 2, 1, null);
  [0.0, 0.6].forEach(o => [1.0, 2.1].forEach(y => SPH(g, 6.05 - 0.02 + o * 0 + (o ? 0.1 : -0.1), y, 0.77, 0.018, std(0xb9a98a, 0.3, 0.6))));
  // szafka nad ławką
  B(g, 3.95, NW, 4.45, 0.5, 1.85, 2.55, M.whiteM); shaker(g, '+z', 0.5, 3.95, 4.45, 1.85, 2.55, WH, 1, 1, null);
  // lampa-belka
  const lg = gLamp; B(lg, 4.35, 0.9, 5.25, 1.02, 1.95, 2.02, std(0xffffff, 0.3, 0, { emissive: 0xffe9c4, emissiveIntensity: 0.3 })); lampEm.push(lg.children[lg.children.length - 1].material);
  B(lg, 4.4, 0.95, 4.41, 0.96, 2.02, H, M.black); B(lg, 5.19, 0.95, 5.2, 0.96, 2.02, H, M.black);
  // wycieraczka
  B(g, 4.6, 0.2, 5.4, 0.7, 0, 0.012, std(0x4a4d52, 1));
})();

// ───────────── KUCHNIA ─────────────
(function () {
  const g = gStat, C = M.cab;
  // —— ciąg po wschodniej stronie: zabudowa dolna ——
  const XA = 4.91, XB = 5.51, Z0 = 2.95, Z1 = 5.39;
  B(g, XA, Z0, XB, Z1, 0.06, 0.86, std(C, 0.8)); B(g, XA + 0.03, Z0, XB, Z1, 0, 0.06, M.black);
  const zs = [2.95, 3.56, 4.17, 4.78, 5.39];
  for (let i = 0; i < 4; i++) shaker(g, '-x', XA, zs[i], zs[i + 1], 0.07, 0.86, C, 1, i < 2 ? 2 : 1, 'h');
  B(g, XA - 0.03, Z0 - 0.02, XB, Z1 + 0.03, 0.86, 0.9, M.oak);
  PL(g, Z1 - Z0, 0.55, XB - 0.005, 1.175, (Z0 + Z1) / 2, -Math.PI / 2, chevMat(Z1 - Z0, 0.55));
  // płyta indukcyjna + czajnik
  B(g, 5.0, 3.05, 5.45, 3.62, 0.9, 0.905, M.tvBlack); [[5.13, 3.2], [5.32, 3.2], [5.13, 3.47], [5.32, 3.47]].forEach(([x, z]) => { CYL(g, x, z, 0.905, 0.907, 0.07, std(0x555a60, 0.3, 0.5)); });
  CYL(g, 5.18, 3.3, 0.905, 1.04, 0.1, M.black, 0.115); SPH(g, 5.18, 1.04, 3.3, 0.095, M.black, 1, 0.65, 1); CYL(g, 5.18, 3.3, 1.12, 1.15, 0.015, M.black);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.009, 8, 20, Math.PI), M.black); hd.position.set(5.18, 1.1, 3.3); hd.rotation.y = Math.PI / 2; hd.castShadow = true; g.add(hd);
  // zlew
  B(g, 4.98, 4.3, 5.48, 5.1, 0.9, 0.915, M.steel); B(g, 5.05, 4.55, 5.43, 5.02, 0.9, 0.918, std(0x6f767c, 0.3, 0.8));
  B(g, 5.03, 4.34, 5.43, 4.5, 0.918, 0.94, std(0xf2f0e6, 0.6));  // ociekacz
  CYL(g, 5.2, 4.22, 0.915, 1.2, 0.012, M.black); const tp = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.009, 8, 16, Math.PI), M.black); tp.position.set(5.2, 1.2, 4.3); tp.rotation.y = 0; tp.rotation.z = 0; g.add(tp);
  // szafki górne do sufitu
  B(g, 5.16, Z0, XB, Z1, 1.42, H, std(C, 0.8));
  for (let i = 0; i < 4; i++) { shaker(g, '-x', 5.16, zs[i], zs[i + 1], 1.42, 2.1, C, 1, 1, 'h'); shaker(g, '-x', 5.16, zs[i], zs[i + 1], 2.1, H - 0.01, C, 1, 1, null); }
  // ściana (szachta) z rurami między wejściem do kuchni a płytą, od podłogi do sufitu
  B(g, 4.85, 2.3, XB, Z0, 0, H, M.wall);
  B(g, 4.845, 2.55, 4.85, 2.85, 0.35, 1.25, std(0xffffff, 0.4)); B(g, 4.843, 2.545, 4.85, 2.555, 0.35, 1.25, std(0x9aa0a6)); B(g, 4.843, 2.845, 4.85, 2.855, 0.35, 1.25, std(0x9aa0a6)); B(g, 4.843, 2.545, 4.85, 2.855, 0.349, 0.36, std(0x9aa0a6)); B(g, 4.843, 2.545, 4.85, 2.855, 1.24, 1.25, std(0x9aa0a6));
  radiator(g, 4.3, 5.37, 0.8, 0);
  // —— ciąg po zachodniej stronie: słupek z piekarnikiem ——
  const XC = 3.31, XD = 3.91, ZC = 2.38, ZD = 3.93;
  B(g, XC, ZC, XD, ZD, 0, H, std(C, 0.8));
  // szafa z 3 kolumn: po bokach drzwi, środek z piekarnikiem
  const zc = [ZC, 2.88, 3.43, ZD];
  shaker(g, '+x', XD, zc[0], zc[1], 0.02, 1.85, C, 1, 1, 'v'); shaker(g, '+x', XD, zc[0], zc[1], 1.85, H - 0.01, C, 1, 1, null);
  shaker(g, '+x', XD, zc[1], zc[2], 0.02, 0.84, C, 1, 1, 'v'); shaker(g, '+x', XD, zc[1], zc[2], 1.44, 2.05, C, 1, 1, 'v'); shaker(g, '+x', XD, zc[1], zc[2], 2.05, H - 0.01, C, 1, 1, null);
  shaker(g, '+x', XD, zc[2], zc[3], 0.02, 0.95, C, 1, 1, 'v'); shaker(g, '+x', XD, zc[2], zc[3], 0.95, 2.05, C, 1, 1, 'v'); shaker(g, '+x', XD, zc[2], zc[3], 2.05, H - 0.01, C, 1, 1, null);
  B(g, XD, 2.91, XD + 0.04, 3.40, 0.84, 1.44, M.black);
  B(g, XD + 0.04, 2.96, XD + 0.044, 3.35, 0.88, 1.28, std(0x23272c, 0.08, 0.7)); B(g, XD + 0.044, 2.94, XD + 0.065, 3.37, 1.28, 1.31, M.steel);
  B(g, XD + 0.04, 2.94, XD + 0.06, 3.37, 1.33, 1.42, std(0x15171a, 0.4, 0.4)); [0, 1, 2].forEach(k => SPH(g, XD + 0.055, 1.375, 3.0 + k * 0.1, 0.012, M.steel));
  // blat-biurko i półki
  B(g, XC, 3.97, 3.85, Z1, 0.86, 0.9, M.oak); B(g, XC, 3.93, 3.85, 3.97, 0, 0.86, M.whiteM);
  PL(g, 1.42, 1.7, XC + 0.005, 1.75, 4.68, Math.PI / 2, chevMat(1.42, 1.7));
  B(g, 3.33, 4.1, 3.62, 4.4, 0.0, 0.5, std(0xf7f7f5, 0.4)); CYL(g, 3.48, 4.25, 0.0, 0.5, 0.15, std(0xf7f7f5, 0.4)); // stacja robota
  CYL(g, 3.7, 4.5, 0.0, 0.09, 0.17, std(0xf8f8f8, 0.4)); CYL(g, 3.7, 4.5, 0.09, 0.1, 0.05, std(0xaaaaaa, 0.4));
  B(g, 3.36, 4.02, 3.55, 4.17, 0.9, 1.1, std(0x1b1e24, 0.4)); [0.04, 0.07, 0.1].forEach((d, i) => B(g, 3.38 + d, 4.01, 3.39 + d, 4.03, 1.05, 1.18, M.black)); // blok na noże
  // półki dębowe z drobiazgami
  [1.25, 1.62, 1.99].forEach(y => B(g, XC, 4.0, 3.6, 4.5, y, y + 0.03, M.oakL));
  // witryna ze szprosami
  const zv0 = 4.62, zv1 = 5.39, yv0 = 1.45, yv1 = 2.3, xv1 = 3.7;
  B(g, XC, zv0, xv1, zv1, yv0, yv0 + 0.02, M.whiteM); B(g, XC, zv0, xv1, zv1, yv1 - 0.02, yv1, M.whiteM); B(g, XC, zv0, xv1, zv0 + 0.02, yv0, yv1, M.whiteM); B(g, XC, zv1 - 0.02, xv1, zv1, yv0, yv1, M.whiteM);
  B(g, XC, zv0, XC + 0.015, zv1, yv0, yv1, M.whiteM);
  B(g, xv1 - 0.015, zv0, xv1, zv1, yv0, yv1, M.glassF);
  [0, 1, 2].forEach(i => B(g, xv1, zv0 + (zv1 - zv0) * i / 2 - (i === 2 ? 0.03 : 0), xv1 + 0.02, zv0 + (zv1 - zv0) * i / 2 + (i === 0 ? 0.03 : 0.0), yv0, yv1, M.whiteM));
  [0, 1, 2, 3].forEach(i => B(g, xv1, zv0, xv1 + 0.02, zv1, yv0 + (yv1 - yv0) * i / 3 - (i === 3 ? 0.03 : 0), yv0 + (yv1 - yv0) * i / 3 + (i === 0 ? 0.03 : 0), M.whiteM));
  for (let k = 0; k < 4; k++) CYL(g, 3.5, 4.82 + 0.15 * (k % 2), yv0 + 0.03 + k * 0.012, yv0 + 0.03 + (k + 1) * 0.012, 0.11, M.whiteM);
  for (let k = 0; k < 6; k++) CYL(g, 3.5, 5.2, 1.88 + k * 0.012, 1.9 + k * 0.012, 0.1, M.whiteM);
  [[3.48, 5.02], [3.5, 5.28]].forEach(([x, z]) => { CYL(g, x, z, 1.46, 1.55, 0.04, M.whiteM, 0.055); });
  // lampy wiszące na szynie
  const lg = gLamp; B(lg, 4.4, 3.2, 4.42, 4.6, H - 0.04, H - 0.01, M.black); B(lg, 4.3, 3.2, 4.52, 3.22, H - 0.04, H - 0.01, M.black);
  pendant(lg, 4.41, 3.35, 0.55, 0x2c2e33); pendant(lg, 4.41, 3.9, 0.85, 0x2c2e33); pendant(lg, 4.41, 4.45, 0.68, 0x2c2e33);
  // ściereczka
})();

// ───────────── ŁAZIENKA ─────────────
(function () {
  const g = gStat, G = 0xfdfdfd, gl = std(0xfdfdfd, 0.12, 0.05);
  const X0 = 6.83, X1 = 8.47, Z0 = NW, Z1 = 2.94;
  // toaleta (lewa strona po wejściu = ściana północna) + stelaż + szafka nad
  B(g, 6.95, Z0, 7.85, 0.4, 0, 1.15, gl); B(g, 6.95, Z0, 7.85, 0.45, 1.1, 1.18, gl);
  B(g, 6.9, Z0, 7.9, 0.45, 1.5, 2.55, gl); shaker(g, '+z', 0.45, 6.9, 7.9, 1.5, 2.55, G, 2, 2, null);
  [7.3, 7.5].forEach(x => [1.75, 2.2].forEach(y => B(g, x - 0.015, 0.45, x + 0.015, 0.48, y, y + 0.03, M.chrome)));
  B(g, 7.28, 0.4, 7.52, 0.42, 0.78, 0.98, M.chrome);
  const wc = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.3, 6, 16), gl); wc.rotation.x = Math.PI / 2; wc.scale.set(1, 1, 0.75); wc.position.set(7.4, 0.4, 0.62); wc.castShadow = true; g.add(wc);
  B(g, 7.2, 0.4, 7.6, 0.5, 0.4, 0.46, gl);
  // pralka + suszarka (ściana wschodnia, przy północnym narożniku)
  B(g, 7.87, 0.2, 8.47, 0.85, 0, 0.85, std(0xf6f6f6, 0.35)); B(g, 7.87, 0.2, 8.47, 0.85, 0.85, 1.7, std(0xf6f6f6, 0.35));
  [0.42, 1.27].forEach(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 12, 28), std(0x1f2430, 0.3, 0.4)); r.position.set(7.87, y, 0.525); r.rotation.y = -Math.PI / 2; g.add(r); const d = CYL(g, 7.865, 0.525, 0, 0.01, 0.18, std(0x0d1016, 0.05, 0.6)); d.rotation.z = Math.PI / 2; d.position.y = y; });
  B(g, 7.85, 0.25, 7.87, 0.8, 0.74, 0.8, std(0x2a2d33)); B(g, 7.85, 0.25, 7.87, 0.8, 1.59, 1.65, std(0x2a2d33));
  // umywalka z szafką – środek ściany wschodniej, lustro nad nią
  B(g, 7.95, 1.5, 8.47, 2.1, 0.4, 0.78, gl); B(g, 7.95, 1.5, 8.47, 2.1, 0.78, 0.85, gl); B(g, 8.0, 1.55, 8.4, 2.05, 0.84, 0.86, std(0xe9eef0, 0.1));
  shaker(g, '-x', 7.95, 1.5, 2.1, 0.4, 0.78, G, 1, 2, null); [0.5, 0.68].forEach(y => B(g, 7.935, 1.77, 7.95, 1.83, y, y + 0.03, M.chrome));
  CYL(g, 8.38, 1.8, 0.85, 1.0, 0.01, M.chrome); const sp = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 8, 14, Math.PI), M.chrome); sp.position.set(8.33, 0.99, 1.8); sp.rotation.y = Math.PI / 2; g.add(sp);
  B(g, 8.4, 1.45, 8.47, 2.15, 1.15, 1.9, std(0xffffff, 0.3)); B(g, 8.395, 1.48, 8.4, 2.12, 1.18, 1.87, std(0xdfe9ee, 0.05, 0.6));
  B(g, 8.38, 1.45, 8.47, 2.15, 1.92, 1.95, std(0xffffff, 0.3, 0, { emissive: 0xfff4de, emissiveIntensity: 0.6 }));
  // wanna – cała szerokość łazienki wzdłuż ściany południowej
  B(g, X0, 2.27, X1, Z1, 0, 0.56, std(0xfafafa, 0.2)); B(g, X0 + 0.07, 2.34, X1 - 0.07, Z1 - 0.07, 0.5, 0.57, std(0xeef1f3, 0.2));
  CYL(g, 7.0, 2.9, 0.9, 1.9, 0.012, M.chrome); const hs = CYL(g, 7.1, 2.86, 1.5, 1.6, 0.03, M.chrome, 0.04); hs.rotation.x = 0.8; B(g, 6.95, 2.9, 7.2, 2.94, 0.72, 0.78, M.chrome);
  // grzejnik drabinkowy nad wanną przy wschodniej ścianie
  for (let i = 0; i < 12; i++) B(g, 8.4, 2.4, 8.47, 2.82, 0.9 + i * 0.08, 0.93 + i * 0.08, M.whiteM);
  const lg = gLamp; [0, 1, 2, 3].forEach(i => CYL(lg, 7.3, 1.3 + i * 0.13, H - 0.06, H - 0.04, 0.012, M.whiteM));
})();

// ───────────── POKÓJ ─────────────
(function () {
  const g = gStat, WH = 0xf6f5f1;
  // szafa przy drzwiach (wzdłuż ściany łazienki)
  B(g, 6.55, 3.06, 8.47, 3.66, 0, 2.55, M.whiteM); shaker(g, '+z', 3.66, 6.55, 8.47, 0.02, 1.8, WH, 3, 1, null); shaker(g, '+z', 3.66, 6.55, 8.47, 1.8, 2.55, WH, 3, 1, null);
  for (let i = 0; i < 3; i++) { const x = 6.55 + 1.92 / 3 * (i + 0.5); [0.95, 2.1].forEach(y => SPH(g, x - 0.22, y, 3.68, 0.018, std(0xb9a98a, 0.3, 0.6))); }
  // łóżko (wzdłuż wschodniej ściany) z szufladą
  B(g, 7.55, 3.85, 8.45, 5.9, 0.12, 0.36, M.whiteM); B(g, 7.55, 3.8, 8.45, 3.88, 0.12, 0.7, M.whiteM); B(g, 7.55, 5.88, 8.45, 5.96, 0.12, 0.5, M.whiteM);
  B(g, 7.6, 3.9, 8.4, 5.86, 0.36, 0.52, std(0xdcdde0, 1)); B(g, 7.62, 4.3, 8.38, 5.84, 0.52, 0.56, std(0xe6e8ec, 1));
  B(g, 7.2, 4.75, 7.55, 5.7, 0.0, 0.2, std(0xf1efea, 0.6)); // szuflada pod łóżkiem
  // biurko dziecka + krzesełko + tablica
  B(g, 7.0, 3.7, 7.5, 4.15, 0.45, 0.48, M.whiteM); [[7.02, 3.72], [7.48, 3.72], [7.02, 4.13], [7.48, 4.13]].forEach(([x, z]) => B(g, x - 0.015, z - 0.015, x + 0.015, z + 0.015, 0, 0.45, M.whiteM));
  // okno: zasłony + kaloryfer
  radiator(g, 7.1, 6.55, 0.9, Math.PI);
  [[6.38, 6.6], [7.6, 7.82]].forEach(([a, b]) => B(g, a, 6.55, b, 6.59, 0.12, 2.3, std(0xd0cfdc, 1)));
  B(g, 6.3, 6.54, 7.9, 6.57, 2.28, 2.31, M.steel);
  // regał z książkami (wschód od okna), kostka IKEA (zachód), pianino
  B(g, 7.88, 6.3, 8.46, 6.62, 0, 1.95, M.whiteM); [0.3, 0.7, 1.1, 1.5, 1.9].forEach((y, i) => { B(g, 7.88, 6.3, 8.46, 6.62, y, y + 0.02, std(0xf4f4f4)); for (let k = 0; k < 6; k++) B(g, 7.92 + k * 0.08, 6.35, 7.98 + k * 0.08, 6.55, y + 0.02, y + 0.02 + 0.16 + rnd() * 0.1, std([0xd24a3a, 0x3d6db5, 0xe5b93c, 0x3e9b6a, 0x8f5ba5, 0xffffff][(k + i) % 6], 0.7)); });
  B(g, 6.0, 6.2, 6.75, 6.6, 0, 1.38, std(0xf6f6f4, 0.6)); for (let r = 0; r < 4; r++) for (let c2 = 0; c2 < 2; c2++) { B(g, 6.04 + c2 * 0.35, 6.22, 6.4 + c2 * 0.35 - 0.02, 6.58, 0.04 + r * 0.33, 0.3 + r * 0.33 - 0.02, std((r + c2) % 3 === 0 ? 0x3a3d40 : (r + c2) % 3 === 1 ? 0xf2c23c : 0x8d9296, 0.8)); }
  B(g, 5.65, 4.55, 6.1, 5.95, 0.0, 0.88, M.whiteM); B(g, 5.65, 4.55, 5.72, 5.95, 0.88, 1.15, M.whiteM); B(g, 5.65, 4.55, 6.12, 5.95, 0.88, 0.91, std(0xfafafa, 0.4));
  for (let i = 0; i < 30; i++) B(g, 6.08, 4.6 + i * 0.044, 6.12, 4.6 + i * 0.044 + 0.026, 0.9, 0.93, i % 7 === 3 || i % 7 === 6 ? M.black : std(0xfbfbf8));
  B(g, 6.15, 5.05, 6.55, 5.5, 0.4, 0.46, std(0xf0ece4, 1)); [[6.2, 5.08], [6.5, 5.08], [6.2, 5.45], [6.5, 5.45]].forEach(([x, z]) => B(g, x - 0.02, z - 0.02, x + 0.02, z + 0.02, 0, 0.4, M.whiteM));
  // zabawki, kosz
  // lampa-chmurka
  const lg = gLamp; [[0, 0, 0.19], [0.17, 0.07, 0.15], [-0.17, 0.06, 0.15], [0.12, -0.14, 0.14], [-0.1, -0.15, 0.13]].forEach(([dx, dz, r]) => { CYL(lg, 7.0 + dx, 4.7 + dz, H - 0.12, H - 0.01, r, std(0xffffff, 0.6, 0, { emissive: 0xffeed0, emissiveIntensity: 0.12 })); lampEm.push(lg.children[lg.children.length - 1].material); });
})();

// ───────────── LOGGIA ─────────────
(function () {
  const g = gStat, ra = M.rattan, cu = std(0x3c3e43, 1);
  const yb = 0.38;
  // narożnik rattanowy przy ścianie z cegły
  B(g, 3.0, 5.55, 5.45, 6.3, 0.05, yb, ra); B(g, 3.0, 5.55, 5.45, 5.7, yb, 0.75, ra); B(g, 4.75, 5.55, 5.45, 6.3, 0.05, yb, ra);
  B(g, 3.0, 5.7, 3.28, 6.3, yb, 0.58, ra); [[3.28, 4.0], [4.0, 4.72]].forEach(([a, b]) => { B(g, a + 0.01, 5.7, b - 0.01, 6.28, yb, yb + 0.14, cu); });
  B(g, 4.78, 5.7, 5.43, 6.28, yb, yb + 0.14, cu); [3.4, 4.1, 4.8].forEach(x => { const c = B(g, x, 5.72, x + 0.6, 5.88, yb + 0.14, 0.78, std(0x5d6064, 1)); c.rotation.x = -0.12; });
  B(g, 5.0, 6.28, 5.45, 6.42, 0.05, yb, ra); B(g, 5.02, 6.0, 5.43, 6.4, yb, yb + 0.14, cu);
  // stolik okrągły dębowy
  CYL(g, 4.0, 6.4, 0.5, 0.53, 0.27, M.wood); CYL(g, 4.0, 6.4, 0.0, 0.5, 0.025, M.wood); CYL(g, 4.0, 6.4, 0.2, 0.23, 0.19, M.wood); [[-0.18, 0], [0.18, 0], [0, 0.18], [0, -0.18]].forEach(([a, b]) => CYL(g, 4.0 + a, 6.4 + b, 0, 0.5, 0.02, M.wood));
  // rododendron w donicy
  plant(g, 0.55, 0, 6.2, 2.0, { n: 22, spread: 0.3, big: 0.8, potMat: std(0x6b6f73, 0.8) });
  // donica / światło
  plant(g, 1.8, 0.4, 6.2, 1.2, { noPot: true, n: 9, spread: 0.2 });
})();

// ───────────── ETYKIETY ─────────────
function label(txt, sub, x, y, z) {
  const [c, g] = mk(512, 160); g.clearRect(0, 0, 512, 160);
  g.fillStyle = 'rgba(255,255,255,.88)'; g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 3;
  const r = 36; g.beginPath(); g.moveTo(r, 6); g.arcTo(506, 6, 506, 154, r); g.arcTo(506, 154, 6, 154, r); g.arcTo(6, 154, 6, 6, r); g.arcTo(6, 6, 506, 6, r); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#23262b'; g.textAlign = 'center'; g.font = '600 54px -apple-system, Segoe UI, Helvetica, Arial'; g.fillText(txt, 256, 76);
  g.fillStyle = '#6b7078'; g.font = '500 40px -apple-system, Segoe UI, Helvetica, Arial'; g.fillText(sub, 256, 130);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(1.5, 0.47, 1); s.position.set(x, y, z); s.renderOrder = 20; gLab.add(s);
}
label('Salon', '17,29 m²', 1.6, 1.15, 4.7); label('Hol', '6,67 m²', 4.85, 1.2, 1.55); label('Kuchnia', '8,03 m²', 4.4, 1.2, 3.9);
label('Łazienka', '4,08 m²', 7.65, 1.2, 1.3); label('Pokój', '11,67 m²', 6.7, 1.1, 4.9); label('Loggia', '8,41 m²', 1.9, 1.0, 6.05);

// ───────────── światła „wieczorne” ─────────────
const nightLights = [[1.6, 2.1, 2.4], [4.4, 1.9, 3.9], [4.8, 2.2, 1.3], [7.55, 2.2, 1.9], [7.0, 2.2, 4.8]].map(p => { const l = new THREE.PointLight(0xffd7a0, 0, 6, 1.6); l.position.set(...p); scene.add(l); return l; });

// ───────────── UI / kamera ─────────────
const VIEWS = {
  iso: { p: [12.2, 11.5, 13.2], t: [4.3, 0, 3.2], walls: 'low' },
  top: { p: [4.3, 19, 4.0], t: [4.3, 0, 3.35], walls: 'low' },
  south: { p: [4.3, 7, 17.5], t: [4.3, 0.6, 3.2], walls: 'low' },
  salon: { p: [0.4, 1.6, 5.25], t: [2.6, 1.2, 1.5], walls: 'full', inner: 1 },
  kuchnia: { p: [4.15, 1.55, 2.42], t: [4.5, 1.1, 5.4], walls: 'full', inner: 1 },
  kuchnia2: { p: [5.0, 1.6, 5.3], t: [3.4, 1.2, 3.0], walls: 'full', inner: 1 },
  wejscie: { p: [6.2, 1.6, 1.3], t: [3.6, 1.2, 1.2], walls: 'full', inner: 1 },
};
let tween = null;
function setView(name, instant) {
  const v = VIEWS[name]; if (!v) return;
  setWalls(v.walls);
  const pEnd = new THREE.Vector3(...v.p), tEnd = new THREE.Vector3(...v.t);
  const inner = !!v.inner; camera.fov = inner ? 68 : 32; camera.updateProjectionMatrix(); gLab.visible = inner ? false : document.getElementById('lab').classList.contains('on');
  controls.minDistance = inner ? 0.05 : 0.5;
  if (instant) { camera.position.copy(pEnd); controls.target.copy(tEnd); return; }
  tween = { t0: performance.now(), p0: camera.position.clone(), t0v: controls.target.clone(), p1: pEnd, t1: tEnd };
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === name));
}
function setWalls(m) {
  gFull.visible = m === 'full'; gLow.visible = m === 'low';
  document.querySelectorAll('[data-walls]').forEach(b => b.classList.toggle('on', b.dataset.walls === m));
}
let night = false;
function setNight(n) {
  night = n; document.body.classList.toggle('night', n);
  hemi.intensity = n ? 0.22 : 0.55; sun.intensity = n ? 0.12 : 2.1; sun.color.set(n ? 0x8fa6ff : 0xfff1dc); hemi.color.set(n ? 0x7a8cc8 : 0xffffff);
  renderer.toneMappingExposure = n ? 1.3 : 0.95;
  nightLights.forEach(l => l.intensity = n ? 1.3 : 0);
  lampEm.forEach(m => m.emissiveIntensity = n ? 1.6 : 0.15);
  document.getElementById('night').classList.toggle('on', n);
}
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
document.querySelectorAll('[data-walls]').forEach(b => b.onclick = () => setWalls(b.dataset.walls));
const tog = (id, fn) => { const b = document.getElementById(id); b.onclick = () => { b.classList.toggle('on'); fn(b.classList.contains('on')); }; };
tog('lab', v => gLab.visible = v); tog('lamps', v => gLamp.visible = v); tog('night', setNight);
document.getElementById('shot').onclick = () => {
  renderer.render(scene, camera);
  const src = renderer.domElement, [c, g] = mk(src.width, src.height);
  const gr = g.createRadialGradient(c.width / 2, c.height / 2, 0, c.width / 2, c.height / 2, c.width * 0.7);
  gr.addColorStop(0, night ? '#2a3248' : '#fbfaf7'); gr.addColorStop(1, night ? '#0e1220' : '#d9d4ca'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0);
  const a = document.createElement('a'); a.download = 'mieszkanie-3d.png'; a.href = c.toDataURL('image/png'); a.click();
};
function resize() { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
window.addEventListener('resize', resize); resize();
setView('iso', true); setWalls('low'); document.querySelector('[data-view="iso"]').classList.add('on');
const q = new URLSearchParams(location.search); if (q.get('view')) setView(q.get('view'), true); if (q.get('walls')) setWalls(q.get('walls')); if (q.get('night')) { setNight(true); }
(function loop() {
  requestAnimationFrame(loop);
  if (tween) { const k = Math.min(1, (performance.now() - tween.t0) / 900), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0v, tween.t1, e); if (k >= 1) tween = null; }
  controls.update(); renderer.render(scene, camera);
})();
window.__ready = true;
})();
