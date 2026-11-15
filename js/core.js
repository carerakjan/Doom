// Doom-like: Canvas setup, constants, difficulty table and small shared helpers.
// Classic script (works from file://); top-level names are shared with the other js/*.js files.
'use strict';

// ===================================================================
// Setup
// ===================================================================
const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const W = 640,
  H = 400,
  HUD_H = 64,
  VH = H - HUD_H,
  HORIZON = VH >> 1,
  PROJ = 230;
canvas.width = W;
canvas.height = H;
ctx.imageSmoothingEnabled = false;
function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
// first-person weapon is painted flat on this layer, then warped onto the screen with perspective (warpWeapon)
const wCanvas = mkCanvas(W, VH),
  wctx = wCanvas.getContext('2d');
const viewCv = document.createElement('canvas');
viewCv.width = W;
viewCv.height = VH;
const vctx = viewCv.getContext('2d');
const img = vctx.createImageData(W, VH);
const buf = new Uint32Array(img.data.buffer);
const zbuf = new Float32Array(W);
const MAX_LEVEL = 30;
const MID_BOSSES = [5, 15, 25],
  MAIN_BOSSES = [10, 20, 30];
const isBossLevel = (n) => MID_BOSSES.indexOf(n) >= 0 || MAIN_BOSSES.indexOf(n) >= 0;

const DIFFS = [
  { name: 'ЛЕГКА', hp: 0.7, dmg: 0.55, spd: 0.9, ammo: 1.4, count: 0.75, heal: 1.3 },
  { name: 'СЕРЕДНЯ', hp: 1, dmg: 1, spd: 1, ammo: 1, count: 1, heal: 1 },
  { name: 'НЕМОЖЛИВА', hp: 1.5, dmg: 1.9, spd: 1.25, ammo: 0.65, count: 1.3, heal: 0.7 },
];
let diffIdx = 1;

function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
