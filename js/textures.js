// Doom-like: Procedural wall/floor textures.
// Classic script (works from file://); top-level names are shared with the other js/*.js files.
'use strict';

// ===================================================================
// Procedural textures
// ===================================================================
function toTex(c) { return new Uint32Array(c.getContext('2d').getImageData(0, 0, c.width, c.height).data.buffer); }
function sh(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  return 'rgb(' + Math.min(255, ((n >> 16) & 255) * f | 0) + ',' + Math.min(255, ((n >> 8) & 255) * f | 0) + ',' + Math.min(255, (n & 255) * f | 0) + ')';
}
// outline + top-light shading pass for character and prop sprites
function finishTex(c) {
  const t = toTex(c), o = new Uint32Array(t.length);
  const solid = (x, y) => x >= 0 && y >= 0 && x < 64 && y < 64 && (t[y * 64 + x] >>> 24) >= 110;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const p = t[y * 64 + x];
    if ((p >>> 24) < 110) continue;
    const edge = !solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1);
    const k = (1.14 - 0.38 * (y / 63)) * (edge ? 0.33 : 1);
    const r = clamp((p & 255) * k, 0, 255) | 0, g = clamp(((p >> 8) & 255) * k, 0, 255) | 0, b = clamp(((p >> 16) & 255) * k, 0, 255) | 0;
    o[y * 64 + x] = 0xff000000 | (b << 16) | (g << 8) | r;
  }
  return o;
}

function paintWall(kind, c1, c2, seed) {
  const c = mkCanvas(64, 64), g = c.getContext('2d'), r = mulberry(seed);
  g.fillStyle = c1; g.fillRect(0, 0, 64, 64);
  if (kind === 'brick') {
    for (let row = 0; row < 8; row++) {
      const off = row % 2 ? 8 : 0;
      for (let col = -1; col < 5; col++) {
        g.fillStyle = sh(c2, 0.7 + r() * 0.5); g.fillRect(col * 16 + off + 1, row * 8 + 1, 14, 6);
        g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(col * 16 + off + 1, row * 8 + 1, 14, 1);
        g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(col * 16 + off + 1, row * 8 + 6, 14, 1);
      }
    }
  } else if (kind === 'stone') {
    for (let i = 0; i < 700; i++) { g.fillStyle = sh(c2, 0.6 + r() * 0.7); g.fillRect(r() * 64 | 0, r() * 64 | 0, 2, 2); }
    g.strokeStyle = c1; g.lineWidth = 2; g.strokeRect(1, 1, 62, 62);
    g.beginPath(); g.moveTo(0, 32); g.lineTo(64, 32); g.moveTo(32, 0); g.lineTo(32, 32); g.moveTo(16, 32); g.lineTo(16, 64); g.moveTo(48, 32); g.lineTo(48, 64); g.stroke();
  } else if (kind === 'panel') {
    g.fillStyle = c2; g.fillRect(2, 2, 60, 60); g.fillStyle = c1; g.fillRect(6, 6, 52, 52);
    g.strokeStyle = sh(c2, 1.3); g.lineWidth = 1; g.strokeRect(10.5, 10.5, 43, 43);
    for (let i = 0; i < 4; i++) { g.fillStyle = r() > 0.5 ? '#3ddc84' : '#ff5555'; g.fillRect(14 + i * 10, 28, 5, 8); }
    g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(2, 2, 60, 2);
  } else if (kind === 'plate') {
    g.fillStyle = c2; g.fillRect(1, 1, 62, 62); g.fillStyle = sh(c2, 0.8); g.fillRect(4, 4, 56, 56);
    for (const [x, y] of [[6, 6], [57, 6], [6, 57], [57, 57], [32, 6], [32, 57]]) { g.fillStyle = sh(c2, 1.4); g.beginPath(); g.arc(x, y, 2, 0, 6.283); g.fill(); }
    g.strokeStyle = c1; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 32); g.lineTo(64, 32); g.stroke();
    for (let i = 0; i < 200; i++) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(r() * 64 | 0, r() * 64 | 0, 3, 1); }
  } else if (kind === 'tile') {
    for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
      g.fillStyle = sh(c2, 0.85 + r() * 0.3); g.fillRect(tx * 32 + 1, ty * 32 + 1, 30, 30);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(tx * 32 + 1, ty * 32 + 1, 30, 2);
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(tx * 32 + 5, ty * 32 + 7, 10, 2);
    }
  } else if (kind === 'vein') {
    for (let i = 0; i < 900; i++) { g.fillStyle = sh(c2, 0.4 + r() * 0.9); g.fillRect(r() * 64 | 0, r() * 64 | 0, 3, 2); }
    g.strokeStyle = '#ff7a1a'; g.lineWidth = 2;
    for (let k = 0; k < 3; k++) { g.beginPath(); let x = r() * 64, y = 0; g.moveTo(x, y); while (y < 64) { x += (r() - 0.5) * 14; y += 6 + r() * 8; g.lineTo(x, y); } g.stroke(); }
  } else if (kind === 'slime') {
    for (let row = 0; row < 8; row++) { const off = row % 2 ? 8 : 0; for (let col = -1; col < 5; col++) { g.fillStyle = sh(c2, 0.6 + r() * 0.5); g.fillRect(col * 16 + off + 1, row * 8 + 1, 14, 6); } }
    for (let i = 0; i < 6; i++) { const x = r() * 60 | 0, len = 10 + r() * 36 | 0; g.fillStyle = 'rgba(120,255,60,0.55)'; g.fillRect(x, 0, 3, len); g.beginPath(); g.arc(x + 1.5, len, 3, 0, 6.283); g.fill(); }
  } else if (kind === 'gold') {
    for (let i = 0; i < 500; i++) { g.fillStyle = sh(c1, 0.6 + r() * 1.2); g.fillRect(r() * 64 | 0, r() * 64 | 0, 2, 2); }
    g.strokeStyle = c2; g.lineWidth = 2; g.strokeRect(3, 3, 58, 58);
    g.beginPath(); g.moveTo(32, 10); g.lineTo(54, 32); g.lineTo(32, 54); g.lineTo(10, 32); g.closePath(); g.stroke();
    g.fillStyle = c2; g.beginPath(); g.arc(32, 32, 4, 0, 6.283); g.fill();
  }
  return toTex(c);
}
function paintFloor(c1, c2, seed, ceil) {
  const c = mkCanvas(64, 64), g = c.getContext('2d'), r = mulberry(seed);
  for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) { g.fillStyle = sh((tx + ty) % 2 ? c1 : c2, 0.9 + r() * 0.2); g.fillRect(tx * 32, ty * 32, 32, 32); }
  for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(0,0,0,' + (0.08 + r() * 0.12) + ')'; g.fillRect(r() * 64 | 0, r() * 64 | 0, 2, 2); }
  g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 2; g.strokeRect(0, 0, 64, 64);
  g.beginPath(); g.moveTo(32, 0); g.lineTo(32, 64); g.moveTo(0, 32); g.lineTo(64, 32); g.stroke();
  if (ceil) { g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(12, 12, 8, 8); g.fillRect(44, 44, 8, 8); }
  return toTex(c);
}
const THEMES = [
  { name: 'Склади', walls: [['brick', '#2a1a16', '#8a4636'], ['panel', '#222b36', '#5a6c82'], ['plate', '#33343a', '#767883']], floor: ['#3a322c', '#2a2420'], ceil: ['#26262e', '#1c1c24'], fog: [14, 10, 10] },
  { name: 'Бункер', walls: [['stone', '#26262b', '#6c6c74'], ['plate', '#2d3138', '#7a828f'], ['panel', '#262a30', '#6a7684']], floor: ['#34363a', '#2a2c30'], ceil: ['#202226', '#181a1e'], fog: [10, 12, 14] },
  { name: 'Цитадель пекла', walls: [['vein', '#2a0e0a', '#6e2414'], ['stone', '#3a1a14', '#7a3626'], ['vein', '#1e0a08', '#8a2c14']], floor: ['#3a1612', '#2a0e0c'], ceil: ['#220c0a', '#180706'], fog: [40, 8, 4] },
  { name: 'Крижані копальні', walls: [['tile', '#1d3a4a', '#6fb1cc'], ['stone', '#243a48', '#8fc4dc'], ['panel', '#1b3040', '#5a94b0']], floor: ['#2a4656', '#223a48'], ceil: ['#1a2e3c', '#142430'], fog: [6, 18, 28] },
  { name: 'Токсичні стоки', walls: [['slime', '#1c2a14', '#5a7a30'], ['brick', '#1a2412', '#486a28'], ['plate', '#1f2a1c', '#6a8a50']], floor: ['#2e3a22', '#222c18'], ceil: ['#161e10', '#10160c'], fog: [8, 22, 6] },
  { name: 'Трон безодні', walls: [['gold', '#17121e', '#d9a73a'], ['stone', '#1c1626', '#5a4a72'], ['gold', '#120e18', '#b88a2a']], floor: ['#2a2234', '#1e1828'], ceil: ['#120e18', '#0c0910'], fog: [18, 10, 26] },
];
function themeFor(n) { if (MAIN_BOSSES.indexOf(n) >= 0) return 5; if (MID_BOSSES.indexOf(n) >= 0) return 2; return [0, 1, 3, 4][(n - 1) % 4]; }
const themeCache = {};
function themeTex(i) {
  if (themeCache[i]) return themeCache[i];
  const t = THEMES[i];
  return (themeCache[i] = {
    walls: t.walls.map((w, k) => paintWall(w[0], w[1], w[2], 100 + i * 10 + k)),
    floor: paintFloor(t.floor[0], t.floor[1], 500 + i, false),
    ceil: paintFloor(t.ceil[0], t.ceil[1], 700 + i, true),
    fog: t.fog,
  });
}
// ambient-occlusion ramp along the height of a wall (top and bottom edges darker)
const AO = new Int16Array(64);
for (let v = 0; v < 64; v++) AO[v] = Math.round(256 * (0.72 + 0.28 * Math.min(1, Math.min(v, 63 - v) / 9)));
