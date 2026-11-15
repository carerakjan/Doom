// Doom-like: Game state, save/load, geometry helpers, gore, combat and the update step.
// Classic script (works from file://); top-level names are shared with the other js/*.js files.
'use strict';

// ===================================================================
// Game state
// ===================================================================
const WEAPONS = [
  { id: 'chainsaw', name: 'БЕНЗОПИЛА', ammo: null },
  { id: 'pistol', name: 'ПІСТОЛЕТ', ammo: 'bullets' },
  { id: 'shotgun', name: 'ОБРІЗ', ammo: 'shells' },
  { id: 'rifle', name: 'АВТОМАТ', ammo: 'bullets' },
  { id: 'minigun', name: 'КУЛЕМЕТ', ammo: 'bullets', cost: 1, start: 80 },
  { id: 'rocket', name: 'РАКЕТНИЦЯ', ammo: 'rockets', cost: 1, start: 8 },
  { id: 'plasma', name: 'ПЛАЗМОМЕТ', ammo: 'cells', cost: 1, start: 60 },
  { id: 'flame', name: 'ВОГНЕМЕТ', ammo: 'fuel', cost: 1, start: 100 },
  { id: 'rail', name: 'РЕЙКГАН', ammo: 'cells', cost: 5, start: 25 },
  { id: 'destroyer', name: 'РУЙНІВНИК', ammo: 'cells', cost: 25, start: 75 },
];
// fallback order when the current weapon runs dry: cheap ammo first, heavy cell weapons last, chainsaw as the final resort
const AUTO_SWITCH = [1, 3, 2, 4, 6, 5, 7, 8, 9, 0];
const AMMO_PICK = { rockets: [5, 2, 'РАКЕТИ'], cells: [30, 10, 'ЕНЕРГІЯ'], fuel: [40, 12, 'ПАЛИВО'] };
const MAX_AMMO = { bullets: 200, shells: 50, rockets: 40, cells: 200, fuel: 200 };

let state = 'title'; // title | play | complete | dead | victory
let paused = false,
  pausedAt = 0;
// death / level-complete / victory screens ignore Enter and clicks for a moment, so a held fire button can't skip them
const SCREEN_GUARD = 0.6;
let screenAt = 0;
function showScreen(st) {
  state = st;
  screenAt = time;
}
function screenReady() {
  return time - screenAt >= SCREEN_GUARD;
} // pause applies only while state === 'play'
let level = 1,
  L = null,
  theme = null,
  grid = null,
  size = 0;
let player = null,
  enemies = [],
  corpses = [],
  pickups = [],
  balls = [],
  parts = [],
  decals = [],
  strikes = [],
  decor = [];
let keyItem = null,
  hasKey = false,
  exitOpen = false,
  seen = null;
let flow = null,
  flowCell = -1,
  flowT = 0,
  snapshot = null;
let time = 0,
  levelTime = 0,
  killCount = 0,
  totalEnemies = 0,
  aliveCount = 0;
let hurtFlash = 0,
  pickFlash = 0,
  lastHurt = -9,
  grinT = 0,
  fireT = 0,
  cooldown = 0,
  exitMsgT = 0;
let shield = 0,
  shake = 0,
  switchT = 0,
  lightBoost = 0,
  bloodScreen = [],
  casings = [];
let pballs = [],
  flameT = 0,
  railT = 0,
  railAng = 0,
  slowT = 0;
let toasts = [],
  keys = {},
  mouseDown = false,
  soundLvl = 3,
  moving = false,
  sawT = 0,
  bosses = [];

function newPlayer() {
  return {
    x: 0,
    y: 0,
    angle: 0,
    hp: 100,
    weapon: 1,
    own: {
      chainsaw: true,
      pistol: true,
      shotgun: false,
      rifle: false,
      minigun: false,
      rocket: false,
      plasma: false,
      flame: false,
      rail: false,
      destroyer: false,
    },
    ammo: { bullets: 50, shells: 0, rockets: 0, cells: 0, fuel: 0 },
  };
}
function snap() {
  return JSON.stringify({ hp: player.hp, weapon: player.weapon, own: player.own, ammo: player.ammo });
}
function restoreSnap(s) {
  const o = JSON.parse(s);
  Object.assign(player, { hp: o.hp, weapon: o.weapon, own: o.own, ammo: o.ammo });
}
function toast(t, dur) {
  toasts.push({ t, life: dur || 2.5 });
  if (toasts.length > 4) toasts.shift();
}

// keepStats: restore weapons/ammo/hp from the level-start snapshot; retry: death or R restart, which refills hp
// ("Continue" from the title restores the saved hp as is, otherwise quitting would be a free heal)
function startLevel(n, keepStats, retry) {
  level = n;
  L = genLevel(n);
  grid = L.grid;
  size = L.size;
  theme = themeTex(L.theme);
  if (!player) player = newPlayer();
  player.x = L.start.x;
  player.y = L.start.y;
  player.angle = L.start.angle;
  if (keepStats && snapshot) restoreSnap(snapshot);
  if (retry) player.hp = Math.max(player.hp, 100);
  enemies = L.enemies;
  corpses = [];
  balls = [];
  parts = [];
  decals = [];
  strikes = [];
  bloodScreen = [];
  casings = [];
  pballs = [];
  flameT = 0;
  railT = 0;
  slowT = 0;
  pickups = L.pickups.map((p) => ({ type: p.type, x: p.x, y: p.y, taken: false }));
  decor = L.decor;
  keyItem = L.key ? { x: L.key.x, y: L.key.y, taken: false } : null;
  hasKey = false;
  exitOpen = false;
  seen = new Uint8Array(size * size);
  killCount = 0;
  levelTime = 0;
  bosses = enemies.filter((e) => DEFS[e.type].boss || e.boss);
  flowCell = -1;
  hurtFlash = 0;
  pickFlash = 0;
  cooldown = 0;
  fireT = 0;
  toasts = [];
  shake = 0;
  switchT = 0;
  shield = 5;
  snapshot = snap();
  saveProgress(n, JSON.parse(snapshot));
  state = 'play';
  paused = false;
  toast('РІВЕНЬ ' + n + ': ' + THEMES[L.theme].name.toUpperCase(), 3);
  toast(objectiveText(), 4);
  if (MID_BOSSES.indexOf(n) >= 0) toast('УВАГА: СЕРЕДНІЙ БОС!', 3.5);
  if (MAIN_BOSSES.indexOf(n) >= 0) toast('УВАГА: ГОЛОВНИЙ БОС!', 3.5);
}
function objectiveText() {
  if (L.objective === 'boss')
    return exitOpen ? 'ДІЙДІТЬ ДО ВИХОДУ' : 'ПЕРЕМОЖІТЬ БОСА: ' + (bosses[0] ? bosses[0].name : '');
  if (L.objective === 'key') return hasKey ? 'ДІЙДІТЬ ДО ВИХОДУ' : 'ЗНАЙДІТЬ КЛЮЧ-КРИСТАЛ';
  const left = hintTargets().length;
  return left ? 'ВБИЙТЕ ВСІХ ВОРОГІВ (ЛИШИЛОСЬ ' + left + ')' : 'ВБИЙТЕ ВСІХ ВОРОГІВ';
}
// on "kill all" levels, the last few enemies are revealed on the minimap and by an arrow
const HINT_LEFT = 3;
function hintTargets() {
  if (L.objective === 'boss' || L.objective === 'key') return [];
  const alive = enemies.filter((e) => !e.dead);
  return alive.length <= HINT_LEFT ? alive : [];
}
function newGame() {
  player = newPlayer();
  startLevel(1, false);
}

// ===================================================================
// Save / load (localStorage). Levels are generated from (level, difficulty),
// so the player's stats at the start of a level are enough to resume it.
// ===================================================================
const SAVE_KEY = 'doomlike.save.v1';
function readStore() {
  try {
    const o = JSON.parse(localStorage.getItem(SAVE_KEY));
    return o && typeof o === 'object' && o.v === 1 ? o : null;
  } catch (err) {
    return null;
  }
}
function writeStore(o) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign({}, o, { v: 1 })));
  } catch (err) {
    /* private mode / storage blocked: play without saves */
  }
}
const inRange = (x, lo, hi) => typeof x === 'number' && isFinite(x) && x >= lo && x <= hi;
// validated { level, diffIdx, player } or null
function loadSave() {
  const o = readStore();
  if (!o) return null;
  const p = o.player;
  if (
    !Number.isInteger(o.level) ||
    !inRange(o.level, 1, MAX_LEVEL) ||
    !Number.isInteger(o.diffIdx) ||
    !inRange(o.diffIdx, 0, DIFFS.length - 1)
  )
    return null;
  if (
    !p ||
    typeof p !== 'object' ||
    !inRange(p.hp, 1, 999) ||
    !Number.isInteger(p.weapon) ||
    !inRange(p.weapon, 0, WEAPONS.length - 1) ||
    !p.own ||
    !p.ammo
  )
    return null;
  const base = newPlayer(),
    own = {},
    ammo = {};
  for (const k in base.own) own[k] = p.own[k] === true || base.own[k];
  for (const k in base.ammo) ammo[k] = inRange(p.ammo[k], 0, 9999) ? Math.floor(p.ammo[k]) : base.ammo[k];
  if (!own[WEAPONS[p.weapon].id]) return null;
  return { level: o.level, diffIdx: o.diffIdx, player: { hp: Math.round(p.hp), weapon: p.weapon, own, ammo } };
}
// volume steps cycled by M: 100% -> 66% -> 33% -> silent -> 100%; squared for a roughly even loudness drop
const SOUND_STEPS = [0, 0.33, 0.66, 1];
const MOUSE_BASE = 0.0025,
  SENS_STEPS = [0.4, 0.5, 0.6, 0.8, 1, 1.25, 1.5, 2, 2.5, 3];
let savedGame = loadSave(),
  bestLevel = 0,
  newGameArmT = -1,
  sens = 1;
{
  const o = readStore();
  if (o) {
    if (Number.isInteger(o.sound) && inRange(o.sound, 0, SOUND_STEPS.length - 1)) soundLvl = o.sound;
    else if (o.muted === true) soundLvl = 0;
    bestLevel = inRange(o.best, 0, MAX_LEVEL) ? Math.floor(o.best) : 0;
    if (inRange(o.sens, SENS_STEPS[0], SENS_STEPS[SENS_STEPS.length - 1])) sens = o.sens;
  }
}
function prefs() {
  return { sound: soundLvl, best: bestLevel, sens };
}
function saveProgress(lv, stats) {
  bestLevel = Math.max(bestLevel, lv);
  savedGame = { level: lv, diffIdx, player: stats };
  writeStore(Object.assign({ level: lv, diffIdx, player: stats }, prefs()));
}
function clearProgress() {
  savedGame = null;
  writeStore(prefs());
}
function savePrefs() {
  writeStore(Object.assign(readStore() || {}, prefs()));
}
// mouse sensitivity: multiplier of the base turn rate, stepped with [ / ] (or - / =)
function changeSens(dir) {
  let i = 0;
  for (let k = 0; k < SENS_STEPS.length; k++)
    if (Math.abs(SENS_STEPS[k] - sens) < Math.abs(SENS_STEPS[i] - sens)) i = k;
  i = Math.max(0, Math.min(SENS_STEPS.length - 1, i + dir));
  sens = SENS_STEPS[i];
  savePrefs();
  tone(300 + i * 40, 0.05, 'square', 0.03);
  toast('ЧУТЛИВІСТЬ МИШІ ×' + sens, 1.5);
}
function continueGame() {
  const s = savedGame;
  if (!s) {
    newGame();
    return;
  }
  diffIdx = s.diffIdx;
  player = newPlayer();
  snapshot = JSON.stringify(s.player);
  startLevel(s.level, true);
}
// with a save present, "new game" needs a second press within 3 s so progress isn't wiped by accident
function requestNewGame() {
  if (!savedGame || time < newGameArmT) {
    newGameArmT = -1;
    newGame();
    return;
  }
  newGameArmT = time + 3;
  tone(330, 0.08, 'square', 0.04, 220);
}
function titleStart() {
  if (savedGame) continueGame();
  else newGame();
}

// ===================================================================
// Geometry helpers
// ===================================================================
function cell(x, y) {
  const cx = Math.floor(x),
    cy = Math.floor(y);
  if (cx < 0 || cy < 0 || cx >= size || cy >= size) return 1;
  return grid[cy][cx];
}
function walkable(x, y, r) {
  return !cell(x - r, y - r) && !cell(x + r, y - r) && !cell(x - r, y + r) && !cell(x + r, y + r);
}
function castRay(x, y, ang) {
  return rayDist(grid, size, x, y, ang);
}
function los(x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0);
  return castRay(x0, y0, Math.atan2(y1 - y0, x1 - x0)) >= d - 0.05;
}
function computeFlow() {
  const px = Math.floor(player.x),
    py = Math.floor(player.y),
    k = py * size + px;
  if (k === flowCell && flowT > 0) return;
  flowCell = k;
  flowT = 0.3;
  flow = bfsGrid(grid, size, px, py);
}
function flowStep(e) {
  const cx = Math.floor(e.x),
    cy = Math.floor(e.y);
  let best = flow[cy * size + cx],
    bx = cx,
    by = cy;
  if (best < 0) return null;
  for (const [dx, dy] of D4) {
    const nx = cx + dx,
      ny = cy + dy;
    if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
    const v = flow[ny * size + nx];
    if (v >= 0 && v < best) {
      best = v;
      bx = nx;
      by = ny;
    }
  }
  return bx === cx && by === cy ? null : { x: bx + 0.5, y: by + 0.5 };
}

// ===================================================================
// Blood, gore and sparks
// ===================================================================
const MAX_PARTS = 380,
  MAX_DECALS = 160; // caps for live particles and floor decals
function addPart(p) {
  if (parts.length < MAX_PARTS) parts.push(p);
}
// big decals (death pools) always land and push out the oldest; small drops are skipped once full
function addDecal(d, force) {
  if (force) {
    decals.push(d);
    if (decals.length > MAX_DECALS) decals.shift();
  } else if (decals.length < MAX_DECALS) decals.push(d);
}
function bloodHit(x, y, n, fromAng) {
  for (let i = 0; i < n; i++) {
    const a = fromAng + rand(-0.9, 0.9),
      sp = rand(1, 3.2);
    addPart({
      k: 'blood',
      x,
      y,
      z: rand(0.25, 0.7),
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      vz: rand(0.8, 2.6),
      life: 1.5,
      size: rand(0.06, 0.12),
    });
  }
}
function gore(e) {
  const d = DEFS[e.type],
    big = d.scale > 1 || d.boss,
    n = d.boss ? 110 : big ? 56 : 30;
  if (d.dry) {
    sparks(e.x, e.y, 0.4, big ? 34 : 20, 'spark');
    sparks(e.x, e.y, 0.3, 8, 'ember');
    if (d.chunk)
      for (let i = 0; i < (big ? 16 : 8); i++) {
        const a = rand(0, 6.283),
          sp = rand(1, 3.5);
        addPart({
          k: d.chunk,
          x: e.x,
          y: e.y,
          z: rand(0.2, 0.6),
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          vz: rand(1.5, 4),
          life: 2,
          size: rand(0.1, 0.16),
        });
      }
    shake = Math.max(shake, big ? 0.35 : 0.12);
    return;
  }
  for (let i = 0; i < n; i++) {
    const a = rand(0, 6.283),
      sp = rand(0.8, big ? 5 : 3.6),
      gib = i % 5 === 0;
    addPart({
      k: gib ? 'gib' : 'blood',
      x: e.x,
      y: e.y,
      z: rand(0.2, 0.3 + 0.5 * d.scale),
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      vz: rand(1.5, 4.8),
      life: 2 + Math.random(),
      size: gib ? rand(0.12, 0.2) : rand(0.07, 0.15),
    });
  }
  addDecal({ x: e.x, y: e.y, k: 'pool', scale: d.scale * 0.95 }, true);
  const dp = Math.hypot(e.x - player.x, e.y - player.y);
  if (dp < 3.4) screenSplat(4 + Math.floor(Math.random() * 5) + (big ? 4 : 0));
  shake = Math.max(shake, big ? 0.35 : 0.12);
}
function screenSplat(n) {
  for (let i = 0; i < n; i++)
    bloodScreen.push({
      x: rand(30, W - 30),
      y: rand(20, VH - 60),
      r: rand(8, 26),
      life: rand(2.2, 3.6),
      drip: rand(10, 60),
    });
  if (bloodScreen.length > 24) bloodScreen.splice(0, bloodScreen.length - 24);
}
function sparks(x, y, z, n, col) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, 6.283),
      sp = rand(0.6, 2.4);
    addPart({
      k: col || 'spark',
      x,
      y,
      z,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      vz: rand(0.5, 2.5),
      life: rand(0.3, 0.7),
      size: rand(0.05, 0.09),
      glow: true,
    });
  }
}
function updateFx(dt) {
  for (const p of parts) {
    p.vz -= 9 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.life -= dt;
    if (cell(p.x, p.y)) {
      p.x -= p.vx * dt;
      p.y -= p.vy * dt;
      p.vx = -p.vx * 0.3;
      p.vy = -p.vy * 0.3;
    }
    if (p.z <= 0) {
      if (p.k === 'blood') {
        if (Math.random() < 0.45) addDecal({ x: p.x, y: p.y, k: 'blood', scale: rand(0.08, 0.2) });
        p.life = 0;
      } else if (p.glow) p.life = 0;
      else {
        p.z = 0;
        p.vz = -p.vz * 0.35;
        p.vx *= 0.6;
        p.vy *= 0.6;
        if (Math.abs(p.vz) < 0.5) {
          p.vz = 0;
          p.life -= 0.6;
        }
      }
    }
  }
  parts = parts.filter((p) => p.life > 0);
  for (const b of bloodScreen) {
    b.life -= dt;
    b.drip += 14 * dt;
  }
  bloodScreen = bloodScreen.filter((b) => b.life > 0);
  for (const c of casings) {
    c.vy += 700 * dt;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.life -= dt;
  }
  casings = casings.filter((c) => c.life > 0);
  shake = Math.max(0, shake - dt * 1.6);
}

// ===================================================================
// Combat
// ===================================================================
function hurtPlayer(d) {
  if (state !== 'play' || shield > 0) return;
  player.hp -= Math.round(d);
  hurtFlash = 0.35;
  lastHurt = time;
  shake = Math.max(shake, 0.18);
  tone(110, 0.15, 'sawtooth', 0.08, 60);
  if (player.hp <= 0) {
    player.hp = 0;
    showScreen('dead');
    tone(200, 0.8, 'sawtooth', 0.1, 40);
  }
}
function killEnemy(e) {
  e.dead = true;
  killCount++;
  const d = DEFS[e.type];
  corpses.push({
    x: e.x,
    y: e.y,
    tex: MON_TEX[e.type].dead,
    scale: d.scale,
    ref: e,
    type: e.type,
    age: 0,
    z0: d.z || 0,
    dir: Math.random() < 0.5 ? -1 : 1,
  });
  if (e.type === 'bomber') blast(e);
  if (Math.random() < d.drop) {
    const opts = ['bullets', 'bullets'];
    if (player.own.shotgun) opts.push('shells');
    if (player.own.rocket) opts.push('rockets');
    if (player.own.plasma || player.own.rail || player.own.destroyer) opts.push('cells');
    if (player.own.flame) opts.push('fuel');
    pickups.push({ type: opts[Math.floor(Math.random() * opts.length)], x: e.x, y: e.y, taken: false, small: true });
  }
  gore(e);
  noise(0.3, 0.12, 1200);
  tone(90, 0.25, 'sawtooth', 0.05, 40);
  grinT = 1.2;
  if (e.boss) toast('БОСА ПОКОНАНО!', 3);
}
function damageEnemy(e, dmg, fromAng, ignore) {
  if (DEFS[e.type].armor && !ignore) dmg *= DEFS[e.type].armor;
  e.hp -= dmg;
  e.hit = 0.12;
  e.alert = true;
  bloodHit(e.x, e.y, Math.min(8, 2 + Math.floor(dmg / 6)), fromAng === undefined ? player.angle : fromAng);
  if (e.hp <= 0 && !e.dead) killEnemy(e);
}
function hurtNoBlood(e, dmg) {
  e.hp -= dmg;
  e.hit = 0.1;
  e.alert = true;
  if (e.hp <= 0 && !e.dead) killEnemy(e);
}
function blast(e) {
  sparks(e.x, e.y, 0.3, 22, 'ember');
  sparks(e.x, e.y, 0.35, 8, 'spark');
  noise(0.35, 0.25, 800);
  tone(55, 0.35, 'sawtooth', 0.09, 28);
  shake = Math.max(shake, 0.4);
  const dp = Math.hypot(e.x - player.x, e.y - player.y);
  if (dp < 2.4) hurtPlayer(26 * e.dmMul * (1 - dp / 2.8));
  for (const o of enemies)
    if (!o.dead && o !== e && Math.hypot(o.x - e.x, o.y - e.y) < 2) damageEnemy(o, 45, undefined, true);
}
function splash(x, y, r, dmg) {
  for (const e of enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - x, e.y - y),
      R2 = r + DEFS[e.type].hr * 0.5;
    if (d < R2) damageEnemy(e, dmg * (1 - (0.65 * d) / R2), Math.atan2(e.y - y, e.x - x), true);
  }
  const dp = Math.hypot(player.x - x, player.y - y);
  if (dp < r * 0.8) hurtPlayer(dmg * 0.22 * (1 - dp / (r * 0.8)));
  sparks(x, y, 0.3, 18, 'ember');
  sparks(x, y, 0.35, 8, 'spark');
  noise(0.35, 0.25, 800);
  tone(55, 0.35, 'sawtooth', 0.09, 28);
  shake = Math.max(shake, r > 2.5 ? 0.5 : 0.28);
  lightBoost = Math.max(lightBoost, 0.6);
}
function updatePballs(dt) {
  for (const b of pballs) {
    const sp = Math.hypot(b.vx, b.vy),
      n = Math.max(1, Math.ceil((sp * dt) / 0.18)),
      sx = (b.vx * dt) / n,
      sy = (b.vy * dt) / n;
    b.life -= dt;
    for (let i = 0; i < n && b.life > -1; i++) {
      b.x += sx;
      b.y += sy;
      let hit = null;
      for (const e of enemies) {
        if (!e.dead && Math.hypot(e.x - b.x, e.y - b.y) < DEFS[e.type].hr + 0.12) {
          hit = e;
          break;
        }
      }
      const wall = cell(b.x, b.y);
      if (hit || wall) {
        if (wall) {
          b.x -= sx;
          b.y -= sy;
        }
        if (b.kind === 'rocket') splash(b.x, b.y, 2.1, 75);
        else if (b.kind === 'orb') splash(b.x, b.y, 3.4, 240);
        else {
          if (hit) damageEnemy(hit, 15 + Math.random() * 5, Math.atan2(b.vy, b.vx));
          sparks(b.x, b.y, 0.35, 5, 'spark');
          noise(0.05, 0.06, 4000);
        }
        b.life = -2;
        break;
      }
    }
    if (b.life > 0 && b.kind !== 'plasma' && Math.random() < 0.7)
      addPart({
        k: 'ember',
        x: b.x,
        y: b.y,
        z: 0.32,
        vx: rand(-0.3, 0.3),
        vy: rand(-0.3, 0.3),
        vz: rand(0, 0.5),
        life: 0.4,
        size: b.kind === 'orb' ? 0.2 : 0.1,
        glow: true,
      });
  }
  pballs = pballs.filter((b) => b.life > 0);
}
function burnTick(dt) {
  for (const e of enemies) {
    if (e.dead || !(e.burn > 0)) continue;
    e.burn -= dt;
    e.burnT = (e.burnT || 0) - dt;
    if (e.burnT <= 0) {
      e.burnT = 0.2;
      addPart({
        k: 'ember',
        x: e.x + rand(-0.2, 0.2),
        y: e.y + rand(-0.2, 0.2),
        z: rand(0.2, 0.6),
        vx: 0,
        vy: 0,
        vz: rand(0.5, 1.2),
        life: 0.5,
        size: 0.12,
        glow: true,
      });
      hurtNoBlood(e, 2.5);
    }
  }
}
function flameBurst(a) {
  for (let i = 0; i < 3; i++) {
    const aa = a + rand(-0.18, 0.18),
      sp = rand(3, 5.5);
    addPart({
      k: 'ember',
      x: player.x + Math.cos(a) * 0.4,
      y: player.y + Math.sin(a) * 0.4,
      z: 0.3,
      vx: Math.cos(aa) * sp,
      vy: Math.sin(aa) * sp,
      vz: rand(0.2, 1.2),
      life: rand(0.35, 0.6),
      size: rand(0.12, 0.22),
      glow: true,
    });
  }
  const wall = castRay(player.x, player.y, a);
  for (const e of enemies) {
    if (e.dead) continue;
    const ex = e.x - player.x,
      ey = e.y - player.y,
      dist = Math.hypot(ex, ey);
    if (dist > 3.4 || dist > wall + 0.5) continue;
    let da = Math.atan2(ey, ex) - a;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) < 0.3 + (DEFS[e.type].hr / Math.max(dist, 0.5)) * 0.6) {
      e.burn = 2.5;
      hurtNoBlood(e, 3.2);
    }
  }
}
function railShot(a) {
  const dx = Math.cos(a),
    dy = Math.sin(a),
    wall = Math.min(castRay(player.x, player.y, a), 40),
    hits = [];
  for (const e of enemies) {
    if (e.dead) continue;
    const sx = e.x - player.x,
      sy = e.y - player.y,
      along = sx * dx + sy * dy,
      side = Math.abs(-sx * dy + sy * dx);
    if (along > 0 && along < wall + 0.3 && side < DEFS[e.type].hr + 0.15) hits.push(e);
  }
  for (const e of hits) damageEnemy(e, 110, a, true);
  sparks(player.x + dx * (wall - 0.05), player.y + dy * (wall - 0.05), 0.4, 10, 'spark');
}
function alertNear(r) {
  for (const e of enemies) if (!e.dead && Math.hypot(e.x - player.x, e.y - player.y) < r) e.alert = true;
}

function hitscan(ang, range, extra) {
  const dx = Math.cos(ang),
    dy = Math.sin(ang);
  const wall = Math.min(castRay(player.x, player.y, ang), range);
  let best = null,
    bd = 1e9;
  for (const e of enemies) {
    if (e.dead) continue;
    const sx = e.x - player.x,
      sy = e.y - player.y;
    const along = sx * dx + sy * dy,
      side = Math.abs(sx * -dy + sy * dx),
      hr = DEFS[e.type].hr;
    if (along > 0 && along < wall + hr * 0.5 && side < hr + (extra || 0) && along < bd) {
      bd = along;
      best = e;
    }
  }
  if (!best && wall < range) sparks(player.x + dx * (wall - 0.05), player.y + dy * (wall - 0.05), rand(0.25, 0.6), 2);
  return best ? { e: best, d: bd } : null;
}

function spawnCasing(vx) {
  casings.push({ x: W / 2 + 22, y: VH - 90, vx: vx || rand(70, 150), vy: rand(-220, -120), life: 0.7 });
}

function fireWeapon() {
  const w = WEAPONS[player.weapon];
  if (cooldown > 0) return;
  if (w.ammo && (player.ammo[w.ammo] || 0) < (w.cost || 1)) {
    toast('НЕМАЄ ПАТРОНІВ!', 1.5);
    cooldown = 0.4;
    for (const i of AUTO_SWITCH) {
      const ww = WEAPONS[i];
      if (player.own[ww.id] && (!ww.ammo || player.ammo[ww.ammo] >= (ww.cost || 1))) {
        selectWeapon(i);
        break;
      }
    }
    return;
  }
  const a = player.angle;
  if (w.id === 'chainsaw') {
    cooldown = 0.11;
    fireT = 0.11;
    sawT = 0.2;
    shake = Math.max(shake, 0.05);
    const h = hitscan(a, 1.5, 0.35);
    tone(70 + Math.random() * 20, 0.1, 'sawtooth', 0.05);
    if (h) {
      damageEnemy(h.e, 15 + Math.random() * 6, undefined, true);
      noise(0.08, 0.1, 900);
      screenSplat(1);
    }
  } else if (w.id === 'pistol') {
    cooldown = 0.32;
    fireT = 0.12;
    lightBoost = 0.4;
    player.ammo.bullets--;
    alertNear(11);
    shake = Math.max(shake, 0.08);
    spawnCasing();
    noise(0.12, 0.14, 2500);
    tone(300, 0.08, 'square', 0.04, 120);
    const h = hitscan(a + (Math.random() - 0.5) * 0.02, 30, 0);
    if (h) damageEnemy(h.e, 14 + Math.random() * 4);
  } else if (w.id === 'shotgun') {
    cooldown = 0.85;
    fireT = 0.22;
    lightBoost = 0.6;
    player.ammo.shells--;
    alertNear(14);
    shake = Math.max(shake, 0.25);
    noise(0.35, 0.28, 1800);
    tone(90, 0.25, 'sawtooth', 0.09, 40);
    for (let i = 0; i < 9; i++) {
      const h = hitscan(a + (Math.random() - 0.5) * 0.2, 30, 0);
      if (h) damageEnemy(h.e, (11 + Math.random() * 3) * (1 / (1 + h.d * 0.28)) * 1.7);
    }
    setTimeout(() => {
      if (state === 'play') {
        spawnCasing(rand(40, 90));
        tone(180, 0.05, 'square', 0.03, 120);
      }
    }, 420);
  } else if (w.id === 'rifle') {
    cooldown = 0.11;
    fireT = 0.07;
    lightBoost = 0.35;
    player.ammo.bullets--;
    alertNear(11);
    shake = Math.max(shake, 0.06);
    spawnCasing();
    noise(0.08, 0.1, 3200);
    tone(240, 0.05, 'square', 0.03, 100);
    const h = hitscan(a + (Math.random() - 0.5) * 0.04, 30, 0);
    if (h) damageEnemy(h.e, 11 + Math.random() * 3);
  } else if (w.id === 'minigun') {
    cooldown = 0.065;
    fireT = 0.06;
    lightBoost = 0.4;
    player.ammo.bullets--;
    alertNear(12);
    shake = Math.max(shake, 0.08);
    spawnCasing();
    noise(0.07, 0.12, 3000);
    tone(200, 0.05, 'square', 0.03, 90);
    const h = hitscan(a + (Math.random() - 0.5) * 0.09, 30, 0);
    if (h) damageEnemy(h.e, 8 + Math.random() * 3);
  } else if (w.id === 'rocket') {
    cooldown = 0.9;
    fireT = 0.25;
    lightBoost = 0.7;
    player.ammo.rockets--;
    alertNear(16);
    shake = Math.max(shake, 0.3);
    noise(0.3, 0.2, 1200);
    tone(110, 0.3, 'sawtooth', 0.08, 50);
    pballs.push({
      x: player.x + Math.cos(a) * 0.4,
      y: player.y + Math.sin(a) * 0.4,
      vx: Math.cos(a) * 11,
      vy: Math.sin(a) * 11,
      kind: 'rocket',
      life: 4,
    });
  } else if (w.id === 'plasma') {
    cooldown = 0.09;
    fireT = 0.07;
    lightBoost = 0.45;
    player.ammo.cells--;
    alertNear(12);
    tone(700, 0.06, 'sine', 0.04, 300);
    const sa = a + (Math.random() - 0.5) * 0.04;
    pballs.push({
      x: player.x + Math.cos(sa) * 0.4,
      y: player.y + Math.sin(sa) * 0.4,
      vx: Math.cos(sa) * 16,
      vy: Math.sin(sa) * 16,
      kind: 'plasma',
      life: 2,
    });
  } else if (w.id === 'flame') {
    cooldown = 0.06;
    fireT = 0.06;
    flameT = 0.15;
    lightBoost = 0.5;
    player.ammo.fuel--;
    alertNear(8);
    noise(0.08, 0.1, 900);
    flameBurst(a);
  } else if (w.id === 'rail') {
    cooldown = 1.1;
    fireT = 0.3;
    lightBoost = 0.9;
    player.ammo.cells -= 5;
    alertNear(18);
    shake = Math.max(shake, 0.3);
    railT = 0.35;
    railAng = a;
    tone(1200, 0.3, 'sawtooth', 0.06, 200);
    noise(0.2, 0.15, 4000);
    railShot(a);
  } else if (w.id === 'destroyer') {
    cooldown = 1.5;
    fireT = 0.4;
    lightBoost = 1;
    player.ammo.cells -= 25;
    alertNear(18);
    shake = Math.max(shake, 0.5);
    tone(60, 0.6, 'sawtooth', 0.1, 25);
    noise(0.4, 0.25, 700);
    pballs.push({
      x: player.x + Math.cos(a) * 0.5,
      y: player.y + Math.sin(a) * 0.5,
      vx: Math.cos(a) * 6,
      vy: Math.sin(a) * 6,
      kind: 'orb',
      life: 5,
    });
  }
}

const BALL_TEX = { a: 'fire_a', b: 'fire_b', c: 'fire_c', d: 'fire_d', r: 'rocket', e: 'fire_e' };
function spawnBall(e, ang, speed, dmg, kind) {
  balls.push({ x: e.x, y: e.y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, dmg, life: 6, kind });
}
function explode(b) {
  sparks(b.x, b.y, 0.3, 12, 'ember');
  noise(0.3, 0.2, 900);
  tone(60, 0.3, 'sawtooth', 0.08, 30);
  shake = Math.max(shake, 0.2);
  const d = Math.hypot(b.x - player.x, b.y - player.y);
  if (d < 1.6) hurtPlayer(b.dmg * (1 - d / 1.9));
}

function fireOnce(e, d, ex, ey, dist) {
  const base = Math.atan2(ey, ex);
  if (d.atk === 'hit') {
    const chance = d.sure || clamp(1.05 - dist * 0.09, 0.15, 0.8);
    for (let k = 0; k < (d.pellets || 1); k++) if (Math.random() < chance) hurtPlayer(d.dmg * e.dmMul);
    noise(0.1, 0.1, 2200);
    e.atkAnim = 0.12;
  } else if (d.atk === 'ball' || d.atk === 'rocket') {
    const n = d.n || 1,
      kind = d.atk === 'rocket' ? 'r' : d.ball;
    for (let k = 0; k < n; k++)
      spawnBall(
        e,
        base + (k - (n - 1) / 2) * (d.spread || 0) + (d.burst ? rand(-0.05, 0.05) : 0),
        d.bspd || 5,
        d.dmg * e.dmMul,
        kind,
      );
    e.atkAnim = 0.3;
    tone(d.atk === 'rocket' ? 120 : 500, 0.12, d.atk === 'rocket' ? 'sawtooth' : 'sine', 0.04, 200);
  }
}

function enemyAttack(e, d, ex, ey, dist) {
  e.cool = d.cd * rand(0.85, 1.2);
  if (d.atk === 'hit' || d.atk === 'ball' || d.atk === 'rocket') {
    if (d.burst) {
      e.burst = d.burst;
      e.gapT = 0;
    } else fireOnce(e, d, ex, ey, dist);
  } else if (d.atk === 'spawn') {
    if (e.spawnN < 4 && (e.spawnTot || 0) < 10) {
      e.spawnN++;
      e.spawnTot = (e.spawnTot || 0) + 1;
      let sx = e.x + rand(-0.6, 0.6),
        sy = e.y + rand(-0.6, 0.6);
      if (!walkable(sx, sy, 0.28)) {
        sx = e.x;
        sy = e.y;
      }
      const s = makeEnemy('skull', sx, sy, L.mul);
      s.alert = true;
      s.parent = e;
      s.noRevive = true;
      enemies.push(s);
      e.atkAnim = 0.4;
      tone(300, 0.3, 'sawtooth', 0.05, 80);
    }
  } else if (d.atk === 'necro') {
    strikes.push({ x: player.x, y: player.y, t: 0.9, dmg: d.dmg * e.dmMul });
    e.atkAnim = 0.5;
    tone(200, 0.4, 'sine', 0.05, 600);
  } else if (d.atk === 'heart') {
    e.phaseN = (e.phaseN || 0) + 1;
    const p2 = e.hp < e.max * 0.5,
      base = Math.atan2(ey, ex);
    const n = p2 ? 11 : 7;
    for (let k = 0; k < n; k++)
      spawnBall(e, base + (k - (n - 1) / 2) * 0.17, d.bspd, d.dmg * e.dmMul, k % 2 ? 'b' : 'a');
    if (e.phaseN % 3 === 0)
      for (let k = 0; k < (p2 ? 18 : 12); k++) spawnBall(e, (k / (p2 ? 18 : 12)) * 6.283, 4, 10 * e.dmMul, 'b');
    if (e.phaseN % 4 === 0 && (e.minions || 0) < 16) {
      e.minions = (e.minions || 0) + 2;
      for (let k = 0; k < 2; k++) {
        const t = L.pool[Math.floor(Math.random() * L.pool.length)];
        const s = makeEnemy(t, e.x + rand(-3, 3), e.y + rand(1.5, 3), L.mul);
        if (walkable(s.x, s.y, 0.3)) {
          s.alert = true;
          enemies.push(s);
        }
      }
    }
    e.atkAnim = 0.45;
    e.cool = p2 ? 1.5 : d.cd;
    tone(60, 0.5, 'sawtooth', 0.1, 35);
  }
}

// ===================================================================
// Update
// ===================================================================
// player <-> enemy bodies: moves that bring two bodies deeper into each other are rejected
const PLAYER_R = 0.22;
function bodyR(e) {
  return DEFS[e.type].hr * 0.75;
}
function bumps(x0, y0, x1, y1, ox, oy, rr) {
  const d1 = Math.hypot(x1 - ox, y1 - oy);
  return d1 < rr && d1 < Math.hypot(x0 - ox, y0 - oy);
}
function playerBlocked(x0, y0, x1, y1) {
  for (const e of enemies) if (!e.dead && bumps(x0, y0, x1, y1, e.x, e.y, PLAYER_R + bodyR(e))) return true;
  return false;
}
// push an overlapping enemy (spawned, revived, shoved by its neighbours) out of the player; static ones push the player instead
function separateFromPlayer(e, d) {
  let ox = e.x - player.x,
    oy = e.y - player.y,
    od = Math.hypot(ox, oy);
  const rr = PLAYER_R + bodyR(e);
  if (od >= rr) return;
  if (od < 1e-4) {
    ox = Math.cos(player.angle);
    oy = Math.sin(player.angle);
    od = 1;
  }
  const push = (rr - od) / od;
  if (d.atk !== 'heart' && walkable(e.x + ox * push, e.y + oy * push, 0.28)) {
    e.x += ox * push;
    e.y += oy * push;
  } else if (walkable(player.x - ox * push, player.y - oy * push, 0.22)) {
    player.x -= ox * push;
    player.y -= oy * push;
  }
}

function update(dt) {
  time += dt;
  cooldown = Math.max(0, cooldown - dt);
  fireT = Math.max(0, fireT - dt);
  sawT = Math.max(0, sawT - dt);
  flameT = Math.max(0, flameT - dt);
  railT = Math.max(0, railT - dt);
  slowT = Math.max(0, slowT - dt);
  switchT = Math.max(0, switchT - dt);
  hurtFlash = Math.max(0, hurtFlash - dt);
  pickFlash = Math.max(0, pickFlash - dt);
  grinT = Math.max(0, grinT - dt);
  exitMsgT = Math.max(0, exitMsgT - dt);
  flowT -= dt;
  lightBoost = Math.max(0, lightBoost - dt * 3);
  for (const t of toasts) t.life -= dt;
  toasts = toasts.filter((t) => t.life > 0);
  if (state !== 'play') {
    if (state === 'dead') updateFx(dt);
    return;
  }
  levelTime += dt;
  shield = Math.max(0, shield - dt);

  const turn = 2.3 * dt;
  if (keys.ArrowLeft) player.angle -= turn;
  if (keys.ArrowRight) player.angle += turn;
  const dx = Math.cos(player.angle),
    dy = Math.sin(player.angle),
    rx = -dy,
    ry = dx;
  let mx = 0,
    my = 0;
  if (keys.KeyW || keys.ArrowUp) {
    mx += dx;
    my += dy;
  }
  if (keys.KeyS || keys.ArrowDown) {
    mx -= dx;
    my -= dy;
  }
  if (keys.KeyD) {
    mx += rx;
    my += ry;
  }
  if (keys.KeyA) {
    mx -= rx;
    my -= ry;
  }
  const ts = touchStick(); // analog: a partly pushed stick walks slower
  if (ts) {
    mx += dx * ts.f + rx * ts.s;
    my += dy * ts.f + ry * ts.s;
  }
  const len = Math.hypot(mx, my);
  moving = len > 0;
  if (len > 0) {
    const sp = (3.3 * (slowT > 0 ? 0.55 : 1) * dt) / Math.max(1, len),
      nx = player.x + mx * sp,
      ny = player.y + my * sp,
      r = 0.22;
    if (walkable(nx, player.y, r) && !playerBlocked(player.x, player.y, nx, player.y)) player.x = nx;
    if (walkable(player.x, ny, r) && !playerBlocked(player.x, player.y, player.x, ny)) player.y = ny;
  }
  if (keys.Space || keys.ControlLeft || keys.ControlRight || mouseDown || touchFiring()) fireWeapon();

  const pcx = Math.floor(player.x),
    pcy = Math.floor(player.y);
  for (let y = pcy - 4; y <= pcy + 4; y++)
    for (let x = pcx - 4; x <= pcx + 4; x++) {
      if (x >= 0 && y >= 0 && x < size && y < size && Math.hypot(x - pcx, y - pcy) <= 4.2) seen[y * size + x] = 1;
    }
  computeFlow();

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.dead) continue;
    const d = DEFS[e.type];
    e.hit = Math.max(0, e.hit - dt);
    e.atkAnim = Math.max(0, e.atkAnim - dt);
    e.meleeT = Math.max(0, (e.meleeT || 0) - dt);
    e.cool -= dt;
    e.anim += dt;
    if (cell(e.x, e.y)) {
      if (e.lx !== undefined) {
        e.x = e.lx;
        e.y = e.ly;
      }
    } else {
      e.lx = e.x;
      e.ly = e.y;
    }
    const ex = player.x - e.x,
      ey = player.y - e.y,
      dist = Math.hypot(ex, ey);
    const sight = dist < (d.atk === 'heart' ? 30 : 14) && los(e.x, e.y, player.x, player.y);
    if (!e.alert) {
      const pathD = flow[Math.floor(e.y) * size + Math.floor(e.x)];
      if ((sight && dist < 12) || (pathD >= 0 && pathD < 6)) e.alert = true;
      else continue;
    }
    const p2 = d.boss && e.hp < e.max * 0.5;
    const spd = d.spd * e.spMul * (p2 ? 1.3 : 1);
    // burst fire in progress
    if (e.burst > 0) {
      e.gapT -= dt;
      if (e.gapT <= 0) {
        fireOnce(e, d, ex, ey, dist);
        e.burst--;
        e.gapT = d.gap;
      }
    }
    if (e.type === 'bomber' && dist < 1.1) {
      damageEnemy(e, 99999, 0, true);
      continue;
    }
    if (d.leap) {
      e.leapT = (e.leapT || 0) - dt;
      if (e.leaping > 0) {
        e.leaping -= dt;
        const lx = e.x + e.lvx * dt,
          ly = e.y + e.lvy * dt;
        const lr = PLAYER_R + bodyR(e);
        if (walkable(lx, e.y, 0.28) && !bumps(e.x, e.y, lx, e.y, player.x, player.y, lr)) e.x = lx;
        if (walkable(e.x, ly, 0.28) && !bumps(e.x, e.y, e.x, ly, player.x, player.y, lr)) e.y = ly;
        if (dist < 1.0 && !e.leapHit) {
          e.leapHit = true;
          e.meleeT = 0.3;
          hurtPlayer(d.melee * e.dmMul);
          tone(150, 0.1, 'square', 0.05, 80);
        }
        continue;
      } else if (sight && dist > 1.8 && dist < 5 && e.leapT <= 0) {
        e.leapT = 2.6;
        e.leaping = 0.4;
        e.leapHit = false;
        e.lvx = (ex / dist) * 9;
        e.lvy = (ey / dist) * 9;
        e.atkAnim = 0.4;
      }
    }
    // movement
    let want = null;
    if (d.atk !== 'heart') {
      const range = d.range;
      if (d.keep && sight && dist < d.keep) want = { x: e.x - ex, y: e.y - ey };
      else if (!sight) want = flowStep(e);
      else if (dist > range * (d.atk === 'melee' ? 1 : 0.85))
        want = dist < 9 || d.atk === 'melee' ? { x: player.x, y: player.y } : flowStep(e);
      if (d.atk === 'melee' && sight && dist > range) want = { x: player.x, y: player.y };
      if (e.burst > 0 && d.atk !== 'melee') want = null;
    }
    e.mv = !!want;
    if (want) {
      let wx = want.x - e.x,
        wy = want.y - e.y;
      const wl = Math.hypot(wx, wy) || 1;
      wx /= wl;
      wy /= wl;
      if (e.type === 'skull') {
        const w = Math.sin(time * 6 + i) * 0.7;
        const t = wx;
        wx += -wy * w;
        wy += t * w;
      }
      const sp = spd * dt,
        nx = e.x + wx * sp,
        ny = e.y + wy * sp,
        r = 0.28,
        br = PLAYER_R + bodyR(e);
      if (walkable(nx, e.y, r) && !bumps(e.x, e.y, nx, e.y, player.x, player.y, br)) e.x = nx;
      if (walkable(e.x, ny, r) && !bumps(e.x, e.y, e.x, ny, player.x, player.y, br)) e.y = ny;
    }
    // melee
    const reach = d.boss ? 1.6 : d.atk === 'melee' ? d.range + 0.1 : 0.95;
    if (d.melee && dist < reach && e.cool <= 0) {
      e.cool = d.atk === 'melee' ? 0.9 : 1.2;
      e.atkAnim = 0.3;
      e.meleeT = 0.3;
      hurtPlayer(d.melee * e.dmMul);
      tone(150, 0.1, 'square', 0.05, 80);
    } else if (
      d.atk !== 'melee' &&
      sight &&
      e.cool <= 0 &&
      e.burst <= 0 &&
      (dist <= d.range + 1.5 || d.atk === 'heart')
    )
      enemyAttack(e, d, ex, ey, dist);
    // necromancer revives fallen monsters
    if (d.atk === 'necro') {
      e.reviveT = (e.reviveT || 3) - dt;
      if (e.reviveT <= 0) {
        for (const c of corpses) {
          if (!c.ref || c.ref.noRevive || DEFS[c.ref.type].boss || Math.hypot(c.x - e.x, c.y - e.y) > 8) continue;
          c.ref.dead = false;
          c.ref.hp = Math.round(c.ref.max * 0.5);
          c.ref.alert = true;
          killCount--;
          c.gone = true;
          sparks(c.x, c.y, 0.4, 14, 'ember');
          tone(300, 0.4, 'sine', 0.06, 900);
          e.atkAnim = 0.5;
          break;
        }
        corpses = corpses.filter((c) => !c.gone);
        e.reviveT = d.revive;
      }
    }
    // spacing
    for (let j = i + 1; j < enemies.length; j++) {
      const o = enemies[j];
      if (o.dead) continue;
      const ox = o.x - e.x,
        oy = o.y - e.y,
        od = Math.hypot(ox, oy),
        md = 0.55;
      if (od > 0 && od < md && d.atk !== 'heart') {
        const push = ((md - od) * 0.5) / od;
        if (walkable(e.x - ox * push, e.y - oy * push, 0.28)) {
          e.x -= ox * push;
          e.y -= oy * push;
        }
        if (DEFS[o.type].atk !== 'heart' && walkable(o.x + ox * push, o.y + oy * push, 0.28)) {
          o.x += ox * push;
          o.y += oy * push;
        }
      }
    }
    separateFromPlayer(e, d);
  }
  // skulls released by a spawner free a slot when they die
  for (const e of enemies)
    if (e.dead && e.parent && !e.freed) {
      e.freed = true;
      e.parent.spawnN = Math.max(0, e.parent.spawnN - 1);
    }

  for (const c of corpses) c.age += dt;
  // ground strikes (necromancer)
  for (const s of strikes) {
    s.t -= dt;
    if (s.t <= 0) {
      if (Math.hypot(s.x - player.x, s.y - player.y) < 1.0) hurtPlayer(s.dmg);
      sparks(s.x, s.y, 0.3, 14, 'ember');
      noise(0.25, 0.14, 800);
    }
  }
  strikes = strikes.filter((s) => s.t > 0);

  // projectiles
  // sub-stepped (like player projectiles) so fast balls can't skip past the player's hit radius at low FPS
  for (const b of balls) {
    b.life -= dt;
    const hr = b.kind === 'r' ? 0.5 : 0.35,
      n = Math.max(1, Math.ceil((Math.hypot(b.vx, b.vy) * dt) / 0.15)),
      sx = (b.vx * dt) / n,
      sy = (b.vy * dt) / n;
    for (let i = 0; i < n; i++) {
      b.x += sx;
      b.y += sy;
      const hitWall = cell(b.x, b.y),
        hitP = Math.hypot(b.x - player.x, b.y - player.y) < hr;
      if (!hitWall && !hitP) continue;
      if (hitWall && !hitP) {
        b.x -= sx;
        b.y -= sy;
      }
      if (b.kind === 'r') explode(b);
      else if (hitP) {
        hurtPlayer(b.dmg);
        if (b.kind === 'e') slowT = 2.5;
      } else sparks(b.x, b.y, 0.35, 3, 'ember');
      b.life = 0;
      break;
    }
  }
  balls = balls.filter((b) => b.life > 0);
  updatePballs(dt);
  burnTick(dt);
  updateFx(dt);

  for (const p of pickups) {
    if (p.taken || Math.hypot(p.x - player.x, p.y - player.y) > 0.6) continue;
    const df = DIFFS[diffIdx];
    if (p.type === 'health') {
      if (player.hp >= 100) continue;
      const hv = Math.round(25 * df.heal);
      player.hp = Math.min(100, player.hp + hv);
      toast('+' + hv + " ЗДОРОВ'Я");
    } else if (p.type === 'bullets') {
      if (player.ammo.bullets >= MAX_AMMO.bullets) continue;
      const v = Math.round((p.small ? 10 : 25) * df.ammo);
      player.ammo.bullets = Math.min(MAX_AMMO.bullets, player.ammo.bullets + v);
      toast('ПАТРОНИ +' + v);
    } else if (p.type === 'shells') {
      if (player.ammo.shells >= MAX_AMMO.shells) continue;
      const v = Math.max(1, Math.round((p.small ? 3 : 8) * df.ammo));
      player.ammo.shells = Math.min(MAX_AMMO.shells, player.ammo.shells + v);
      toast('ДРІБ +' + v);
    } else if (p.type === 'shotgun') {
      player.own.shotgun = true;
      player.ammo.shells = Math.min(MAX_AMMO.shells, player.ammo.shells + 10);
      selectWeapon(2);
      toast('ЗНАЙДЕНО ОБРІЗ! (клавіша 3)', 3.5);
      grinT = 1.5;
    } else if (p.type === 'rifle') {
      player.own.rifle = true;
      player.ammo.bullets = Math.min(MAX_AMMO.bullets, player.ammo.bullets + 40);
      selectWeapon(3);
      toast('ЗНАЙДЕНО АВТОМАТ! (клавіша 4)', 3.5);
      grinT = 1.5;
    } else if (p.type.startsWith('w_')) {
      const id = p.type.slice(2),
        wi = WEAPONS.findIndex((x) => x.id === id),
        ww = WEAPONS[wi];
      player.own[id] = true;
      player.ammo[ww.ammo] = Math.min(MAX_AMMO[ww.ammo], (player.ammo[ww.ammo] || 0) + ww.start);
      selectWeapon(wi);
      toast('ЗНАЙДЕНО ' + ww.name + '! (клавіша ' + ((wi + 1) % 10) + ')', 3.5);
      grinT = 1.5;
    } else if (AMMO_PICK[p.type]) {
      const ap = AMMO_PICK[p.type];
      if ((player.ammo[p.type] || 0) >= MAX_AMMO[p.type]) continue;
      const v = Math.max(1, Math.round((p.small ? ap[1] : ap[0]) * df.ammo));
      player.ammo[p.type] = Math.min(MAX_AMMO[p.type], (player.ammo[p.type] || 0) + v);
      toast(ap[2] + ' +' + v);
    }
    p.taken = true;
    pickFlash = 0.2;
    tone(660, 0.1, 'triangle', 0.06, 990);
  }
  pickups = pickups.filter((p) => !p.taken);
  if (keyItem && !keyItem.taken && Math.hypot(keyItem.x - player.x, keyItem.y - player.y) < 0.7) {
    keyItem.taken = true;
    hasKey = true;
    pickFlash = 0.4;
    grinT = 1.5;
    tone(500, 0.3, 'triangle', 0.08, 1400);
    toast('КЛЮЧ-КРИСТАЛ ЗНАЙДЕНО!', 3);
    toast(objectiveText(), 3);
  }

  totalEnemies = enemies.length;
  aliveCount = enemies.reduce((s, e) => s + (e.dead ? 0 : 1), 0);
  const wasOpen = exitOpen;
  // boss levels open the exit once every boss is down; leftover minions elsewhere don't block it
  exitOpen =
    L.objective === 'key'
      ? hasKey
      : L.objective === 'boss' && bosses.length
        ? bosses.every((b) => b.dead)
        : aliveCount === 0;
  if (exitOpen && !wasOpen) {
    toast('ВИХІД ВІДКРИТО!', 3);
    tone(440, 0.4, 'triangle', 0.08, 880);
  }
  const de = Math.hypot(L.exit.x - player.x, L.exit.y - player.y);
  if (de < 0.7 && exitOpen) {
    showScreen('complete');
    tone(523, 0.5, 'triangle', 0.1, 1046);
    // save the next level right away, so closing the tab on this screen doesn't lose the level
    if (level >= MAX_LEVEL) {
      bestLevel = MAX_LEVEL;
      clearProgress();
    } else {
      const s = JSON.parse(snap());
      s.hp = Math.min(100, s.hp + completeHeal());
      saveProgress(level + 1, s);
    }
  } else if (de < 1.6 && !exitOpen && exitMsgT <= 0) {
    toast(objectiveText());
    exitMsgT = 3;
  }
}
