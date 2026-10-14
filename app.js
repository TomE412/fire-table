'use strict';
/* Fire Pit Table — fabrication viewer. All dims mm. X along rails, Y along slats, Z up. */

const COL = { TOP: '#8E9BA8', ORG: '#D9622B', LA: '#4F5F70', LB: '#A3AEB9', BODY: '#4A4440', END: '#6B635D', RING: '#C2410C', WOOD: '#C8A26B', HOLE: '#121212' };

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

const state = { mode: 'table', h: 750, yaw: -35, pitch: 26, zoom: 1, slats: false, labels: true };

/* ---------- model (Rev B: 40×40×3 angle, 20 mm slats, 2 mm bin, square cuts) ---------- */
function buildModel(s) {
  const folded = s.h === 'fold';
  const H = folded ? 160 : s.h;
  // Legs: 1000 from hinge/axle hole to foot along the centre line. The foot's lower corner is 20 below that line,
  // so solve for the hinge height that puts the corner on the floor, then lift the whole model by g.
  const L = 1000;
  let zh = H - 75;
  for (let i = 0; i < 8; i++) zh = H - 75 - 20 * Math.sqrt(L * L - zh * zh) / L;
  const d = Math.sqrt(L * L - zh * zh), g = 20 * d / L;
  const Zt = zh + 55; // top of steel (slats 20 on top); hinge hole 55 below it
  const A = 40, th = 3;
  const boxes = [], polys = [], labels = [];
  const box = (o, u, v, w, c) => boxes.push({ o, u, v, w, c });
  const ang = (o, ax, len, f1, f2, c) => { const u = mul(ax, len); box(o, u, mul(f1, A), mul(f2, th), c); box(o, u, mul(f1, th), mul(f2, A), c); };
  const poly = (pts, n, c, ds, dp) => polys.push({ pts, n, c, ds, dp });
  const lab = (p, t) => labels.push({ p, t });
  const X = [1, 0, 0], Y = [0, 1, 0], nX = [-1, 0, 0], nY = [0, -1, 0], nZ = [0, 0, -1];
  const showFrame = s.mode !== 'bin';
  const showBin = s.mode !== 'frame' && !(folded && s.mode === 'table');
  const zr = Zt - 10; // top of bin supports E = underside of rim ring

  if (showFrame) {
    const T = COL.TOP, O = COL.ORG;
    // A side rails (upright side inside), B ends (upright side outside), C bearers (upright side toward bin)
    ang([0, 140, Zt], X, 1200, nY, nZ, T); ang([0, 1060, Zt], X, 1200, Y, nZ, T);
    ang([0, 140, Zt], Y, 920, X, nZ, T); ang([1200, 140, Zt], Y, 920, nX, nZ, T);
    ang([430, 140, Zt], Y, 920, nX, nZ, T); ang([770, 140, Zt], Y, 920, X, nZ, T);
    // D slat supports (flush), E bin supports (10 down)
    ang([430, 205, Zt], X, 340, Y, nZ, T); ang([430, 995, Zt], X, 340, nY, nZ, T);
    ang([430, 255, zr], X, 340, Y, nZ, O); ang([430, 945, zr], X, 340, nY, nZ, O);
    // J hinge plates (top level with rail top), K notch plates (top 15 below rail top); flat 50×6 inside the rails
    box([125, 140, Zt], [50, 0, 0], [0, 6, 0], [0, 0, -80], O); box([125, 1054, Zt], [50, 0, 0], [0, 6, 0], [0, 0, -80], O);
    box([820, 140, Zt - 15], [330, 0, 0], [0, 6, 0], [0, 0, -50], O); box([820, 1054, Zt - 15], [330, 0, 0], [0, 6, 0], [0, 0, -50], O);
    // Frame A (outer, hinged): uprights on the inner edges, flat sides outward
    const a = [d / L, 0, -zh / L], nA = [zh / L, 0, d / L];
    const HA = [150, 0, zh];
    const at = (p, y, s2, n) => [p[0] + a[0] * s2 + nA[0] * n, y, p[2] + a[2] * s2 + nA[2] * n];
    ang(at(HA, 188, -25, -20), a, 1025, nA, nY, COL.LA); ang(at(HA, 1012, -25, -20), a, 1025, nA, Y, COL.LA);
    ang(at(HA, 188, 35, -20), Y, 824, a, nA, COL.LA); ang(at(HA, 188, 1000, -20), Y, 824, mul(a, -1), nA, COL.LA);
    // Frame B (inner, slides): uprights on the outer edges, flat sides inward, bars sit on the flat sides
    const b = [-d / L, 0, -zh / L], nB = [-zh / L, 0, d / L];
    const Tp = [150 + d, 0, zh];
    const bt = (p, y, s2, n) => [p[0] + b[0] * s2 + nB[0] * n, y, p[2] + b[2] * s2 + nB[2] * n];
    ang(bt(Tp, 190, -25, -20), b, 1025, nB, Y, COL.LB); ang(bt(Tp, 1010, -25, -20), b, 1025, nB, nY, COL.LB);
    ang(bt(Tp, 193, 35, -17), Y, 814, b, nB, COL.LB); ang(bt(Tp, 193, 1000, -17), Y, 814, mul(b, -1), nB, COL.LB);
    // L axle through frame B top holes, ends resting in the notch plates
    box([Tp[0] - 6, 141, zh - 6], [12, 0, 0], [0, 918, 0], [0, 0, 12], O);
    // hinge bolts + M spacers, pivot bolts
    for (const [y0, y1] of [[140, 190], [1010, 1060]]) box([150 - 8, y0, zh - 8], [16, 0, 0], [0, y1 - y0, 0], [0, 0, 16], O);
    const P = [150 + d / 2, 0, zh / 2];
    box([P[0] - 8, 175, P[2] - 8], [16, 0, 0], [0, 30, 0], [0, 0, 16], O);
    box([P[0] - 8, 995, P[2] - 8], [16, 0, 0], [0, 30, 0], [0, 0, 16], O);
    if (s.slats) {
      for (let i = 0; i < 11; i++) {
        const x = 110 * i;
        if (i >= 4 && i <= 6) { box([x, 0, Zt], [100, 0, 0], [0, 260, 0], [0, 0, 20], COL.WOOD); box([x, 940, Zt], [100, 0, 0], [0, 260, 0], [0, 0, 20], COL.WOOD); }
        else box([x, 0, Zt], [100, 0, 0], [0, 1200, 0], [0, 0, 20], COL.WOOD);
      }
    }
    lab([600, 120, Zt + 10], 'A rail'); lab([20, 600, Zt + 10], 'B end'); lab([410, 700, Zt + 10], 'C bearer');
    lab([600, 225, Zt + 10], 'D'); lab([600, 275, zr - 20], 'E bin support'); lab([150, 140, zh - 45], 'J hinge');
    lab([1100, 140, Zt - 70], 'K notch'); lab(add([0, 168, 0], at(HA, 0, 330, 0)), 'Frame A');
    lab(add([0, 1030, 0], bt(Tp, 0, 330, 0)), 'Frame B'); lab([Tp[0], 1080, zh + 25], 'L axle');
    lab([P[0], 1040, P[2] - 30], 'pivot');
  }

  if (showBin) {
    const t = 2, ap = zr - 250; // plate thickness, apex (inside)
    // rim ring P3: opening X460-740, Y313-887; outer X432-768, Y255-945
    box([432, 255, zr], [336, 0, 0], [0, 58, 0], [0, 0, t], COL.RING);
    box([432, 887, zr], [336, 0, 0], [0, 58, 0], [0, 0, t], COL.RING);
    box([432, 313, zr], [28, 0, 0], [0, 574, 0], [0, 0, t], COL.RING);
    box([740, 313, zr], [28, 0, 0], [0, 574, 0], [0, 0, t], COL.RING);
    // V body P1
    const Y0 = 303, Y1 = 897;
    for (const [xr, sg] of [[450, -1], [750, 1]]) {
      const top0 = [xr, Y0, zr], top1 = [xr, Y1, zr], a0 = [600, Y0, ap], a1 = [600, Y1, ap];
      const n = nrm([sg * 250, 0, -150]);
      const panel = [top0, top1, a1, a0];
      poly(panel, n, COL.BODY, true);
      for (const yc of [450, 750]) box([xr - (sg < 0 ? 2.5 : 0), yc - 30, zr], [2.5, 0, 0], [0, 60, 0], [0, 0, 3], COL.BODY);
      const up = nrm([xr - 600, 0, 250]);
      const hole = (sl, y, r) => {
        const c = add([600, y, ap], mul(up, sl));
        for (const side of [1, -1]) {
          const nn = mul(n, side), cc = add(c, mul(nn, 0.8));
          const pts = [];
          for (let k = 0; k < 8; k++) { const q = (k / 8) * Math.PI * 2; pts.push(add(cc, add(mul([0, 1, 0], r * Math.cos(q)), mul(up, r * Math.sin(q))))); }
          poly(pts, nn, COL.HOLE, false, panel);
        }
      };
      for (let k = 0; k < 11; k++) hole(70, Y0 + 47 + 50 * k, 6);
      for (const y of [Y0 + 97, Y0 + 497]) hole(15, y, 5);
    }
    // end plates P2 at Y301-303 and Y897-899
    const xl = 173.3, xc = 5.3;
    for (const [yp, sg] of [[302, -1], [898, 1]]) {
      const Pp = (x, z) => [600 + x, yp, zr + z];
      const plate = [Pp(-xl, 0), Pp(xl, 0), Pp(xc, -280), Pp(-xc, -280)];
      poly(plate, [0, sg, 0], COL.END, true);
      box([570, yp - 1, zr], [60, 0, 0], [0, 2, 0], [0, 0, 3], COL.END); // top tab
      for (const side of [1, -1]) {
        const off = side * 1.6;
        const Q = (x, z) => [600 + x, yp + off, zr + z];
        poly([Q(-40, -20), Q(40, -20), Q(40, -44), Q(-40, -44)], [0, side, 0], COL.HOLE, false, plate);
      }
    }
    if (s.mode === 'bin') {
      lab([600, 255, zr + 20], 'P3 rim ring'); lab([600, 600, ap - 30], 'P1 V body');
      lab([600, 900, zr - 120], 'P2 end plate'); lab([600, 300, zr - 32], 'hand slot');
    } else lab([600, 600, ap - 30], 'fire bin');
  }
  for (const bx of boxes) bx.o = [bx.o[0], bx.o[1], bx.o[2] + g];
  for (const p of polys) { p.pts = p.pts.map((q) => [q[0], q[1], q[2] + g]); if (p.dp) p.dp = p.dp.map((q) => [q[0], q[1], q[2] + g]); }
  for (const l of labels) l.p = [l.p[0], l.p[1], l.p[2] + g];
  return { boxes, polys, labels, H, Zt: Zt + g, zh: zh + g, d, zr: zr + g, folded };
}

/* ---------- render ---------- */
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
let W = 0, Hh = 0, dpr = 1;
function resize() {
  const r = cv.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = r.width; Hh = r.height;
  cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
  draw();
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return 'rgb(' + c((n >> 16) & 255) + ',' + c((n >> 8) & 255) + ',' + c(n & 255) + ')';
}

function draw() {
  if (!W) return;
  const m = buildModel(state);
  const yaw = state.yaw * Math.PI / 180, pit = state.pitch * Math.PI / 180;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit);
  const binOnly = state.mode === 'bin';
  const C = binOnly ? [600, 600, m.zr - 130] : [600, 600, m.H * 0.45];
  const k = (Math.min(W, Hh) / (binOnly ? 820 : 1850)) * state.zoom;
  const rot = (p) => { const xr = cy * p[0] - sy * p[1], yr = sy * p[0] + cy * p[1]; return [xr, yr * sp + p[2] * cp, -yr * cp + p[2] * sp]; };
  const scr = (p) => { const r = rot([p[0] - C[0], p[1] - C[1], p[2] - C[2]]); return [W / 2 + r[0] * k, Hh / 2 - r[1] * k, r[2]]; };
  const Ld = nrm([-0.35, 0.55, 0.75]);
  const faces = [];
  const face = (pts, n, c, ds, dp) => {
    let rn = rot(n);
    if (rn[2] <= 1e-6) { if (!ds) return; rn = mul(rn, -1); }
    const q = pts.map(scr);
    let dep = 0;
    if (dp) { for (const z of dp) dep += scr(z)[2]; dep = dep / dp.length + 0.5; }
    else { for (const z of q) dep += z[2]; dep /= q.length; }
    const lum = 0.55 + 0.5 * Math.max(0, rn[0] * Ld[0] + rn[1] * Ld[1] + rn[2] * Ld[2]);
    faces.push({ dep, q, f: c === COL.HOLE ? c : shade(c, lum), s: c === COL.HOLE ? c : shade(c, lum * 0.62) });
  };
  for (const b of m.boxes) {
    const { o, u, v, w, c } = b;
    const nu = nrm(u), nv = nrm(v), nw = nrm(w);
    const ou = add(o, u), ov = add(o, v), ow = add(o, w), ouv = add(ou, v), ouw = add(ou, w), ovw = add(ov, w), ouvw = add(ouv, w);
    face([o, ov, ovw, ow], mul(nu, -1), c); face([ou, ouv, ouvw, ouw], nu, c);
    face([o, ou, ouw, ow], mul(nv, -1), c); face([ov, ouv, ouvw, ovw], nv, c);
    face([o, ou, ouv, ov], mul(nw, -1), c); face([ow, ouw, ouvw, ovw], nw, c);
  }
  for (const p of m.polys) face(p.pts, p.n, p.c, p.ds, p.dp);
  faces.sort((a, b) => a.dep - b.dep);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, Hh);
  // ground line hint
  if (!binOnly && state.pitch > 2) {
    const g = [[-150, -150, 0], [1350, -150, 0], [1350, 1350, 0], [-150, 1350, 0]].map(scr);
    ctx.beginPath(); g.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
    ctx.fillStyle = 'rgba(27,31,36,0.05)'; ctx.fill();
  }
  ctx.lineJoin = 'round'; ctx.lineWidth = 0.6;
  for (const f of faces) {
    ctx.beginPath();
    f.q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath(); ctx.fillStyle = f.f; ctx.fill(); ctx.strokeStyle = f.s; ctx.stroke();
  }
  if (state.labels) {
    ctx.font = '12px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const l of m.labels) {
      const q = scr(l.p); const w = ctx.measureText(l.t).width + 12;
      ctx.fillStyle = 'rgba(27,31,36,0.85)';
      ctx.fillRect(q[0] - w / 2, q[1] - 10, w, 20);
      ctx.fillStyle = '#FAFAF9'; ctx.fillText(l.t, q[0], q[1] + 0.5);
    }
  }
  const info = document.getElementById('info');
  if (info) {
    const apexAbove = Math.round(m.zr - 250);
    info.innerHTML = m.folded
      ? 'Folded: about 160 mm thick. <strong>Lift the bin out first</strong> — it would hang ~' + Math.round(-(apexAbove)) + ' mm below.'
      : binOnly
        ? 'Bin 300 wide · 600 long · 250 deep · 2 mm plate · tab &amp; slot'
        : 'Height <strong>' + m.H + '</strong> · axle sits <strong>≈ ' + Math.round(m.d) + '</strong> from the hinge · bin bottom <strong>' + apexAbove + '</strong> above the floor';
  }
}

/* ---------- interaction ---------- */
const ptrs = new Map();
let drag = null, pinch = null;
cv.addEventListener('pointerdown', (e) => {
  cv.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, yaw: state.yaw, pitch: state.pitch };
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: state.zoom }; drag = null; }
});
cv.addEventListener('pointermove', (e) => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (pinch && ptrs.size >= 2) {
    const [a, b] = [...ptrs.values()];
    state.zoom = Math.max(0.4, Math.min(4, pinch.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / (pinch.d || 1)));
  } else if (drag) {
    state.yaw = drag.yaw + (e.clientX - drag.x) * 0.4;
    state.pitch = Math.max(-85, Math.min(89, drag.pitch + (e.clientY - drag.y) * 0.4));
  }
  requestDraw();
});
const endPtr = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (ptrs.size === 0) drag = null; };
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('wheel', (e) => { e.preventDefault(); state.zoom = Math.max(0.4, Math.min(4, state.zoom * (e.deltaY > 0 ? 1 / 1.1 : 1.1))); requestDraw(); }, { passive: false });

let raf = 0;
function requestDraw() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); }

function bindGroup(id, key, parse) {
  const g = document.getElementById(id);
  g.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    state[key] = parse ? parse(b.dataset.v) : b.dataset.v;
    for (const x of g.querySelectorAll('button')) x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
    if (key === 'mode') { document.getElementById('heightRow').hidden = state.mode === 'bin'; document.getElementById('slatsBtn').hidden = state.mode !== 'table'; }
    draw();
  });
}
bindGroup('modeGroup', 'mode');
bindGroup('heightGroup', 'h', (v) => (v === 'fold' ? 'fold' : Number(v)));
document.getElementById('viewGroup').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  state.yaw = Number(b.dataset.yaw); state.pitch = Number(b.dataset.pitch); state.zoom = 1; draw();
});
for (const id of ['slatsBtn', 'labelsBtn']) {
  const b = document.getElementById(id);
  b.addEventListener('click', () => {
    const key = b.dataset.k; state[key] = !state[key];
    b.setAttribute('aria-pressed', state[key] ? 'true' : 'false'); draw();
  });
}

/* ---------- tabs & sheets ---------- */
const tabs = document.querySelectorAll('[role=tab]');
tabs.forEach((t) => t.addEventListener('click', () => {
  tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', on ? 'true' : 'false'); document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
  if (t.id === 'tab-3d') resize(); else fitSheets();
}));

function fitSheets() {
  document.querySelectorAll('.sheet').forEach((s) => {
    const inner = s.querySelector('.sheet-inner');
    const w = Number(s.dataset.w), h = Number(s.dataset.h);
    if (s.classList.contains('full')) { inner.style.transform = 'none'; s.style.height = ''; return; }
    const sc = Math.min(1, s.clientWidth / w);
    inner.style.transform = 'scale(' + sc + ')';
    s.style.height = Math.ceil(h * sc) + 'px';
  });
}
document.querySelectorAll('.sheet-toggle').forEach((b) => b.addEventListener('click', () => {
  const s = document.getElementById(b.dataset.sheet);
  const full = s.classList.toggle('full');
  b.textContent = full ? 'Fit to screen' : 'Full size';
  fitSheets();
}));

window.addEventListener('resize', () => { resize(); fitSheets(); });
resize(); fitSheets();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
