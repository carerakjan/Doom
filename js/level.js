// Doom-like: Level generation.
// Classic script (works from file://); top-level names are shared with the other js/*.js files.
'use strict';

// ===================================================================
// Level generation (deterministic per level number and difficulty)
// ===================================================================
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function bfsGrid(grid, size, sx, sy) {
  const d = new Int16Array(size * size).fill(-1);
  const q = [sy * size + sx]; d[q[0]] = 0;
  for (let i = 0; i < q.length; i++) {
    const c = q[i], cx = c % size, cy = (c / size) | 0;
    for (const [dx, dy] of D4) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      const k = ny * size + nx;
      if (d[k] < 0 && grid[ny][nx] === 0) { d[k] = d[c] + 1; q.push(k); }
    }
  }
  return d;
}
function rayDist(grid, size, ox, oy, ang) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  let mx = Math.floor(ox), my = Math.floor(oy);
  const ddx = Math.abs(1 / (dx || 1e-9)), ddy = Math.abs(1 / (dy || 1e-9));
  let sx, sy, sdx, sdy;
  if (dx < 0) { sx = -1; sdx = (ox - mx) * ddx; } else { sx = 1; sdx = (mx + 1 - ox) * ddx; }
  if (dy < 0) { sy = -1; sdy = (oy - my) * ddy; } else { sy = 1; sdy = (my + 1 - oy) * ddy; }
  for (let i = 0; i < 90; i++) {
    let t;
    if (sdx < sdy) { t = sdx; sdx += ddx; mx += sx; } else { t = sdy; sdy += ddy; my += sy; }
    if (mx < 0 || my < 0 || mx >= size || my >= size || grid[my][mx] !== 0) return t;
  }
  return 90;
}
function makeEnemy(type, x, y, mul, extra) {
  const d = DEFS[type];
  const hp = Math.round(d.hp * mul.hp * ((extra && extra.mul) || 1));
  return { type, x, y, hp, max: hp, dmMul: mul.dm, spMul: mul.sp, alert: false, hit: 0, atkAnim: 0, cool: 1 + Math.random(), anim: Math.random() * 5, burst: 0, gapT: 0, strikeT: 0, spawnN: 0, dead: false, boss: !!d.boss || !!(extra && extra.name), name: (extra && extra.name) || d.name };
}

function genLevel(n, di) {
  const diff = DIFFS[di === undefined ? diffIdx : di];
  const rnd = mulberry(n * 7919 + 13);
  const boss = isBossLevel(n);
  const size = Math.min(40, 20 + n * 2);
  const grid = [];
  for (let y = 0; y < size; y++) grid.push(new Array(size).fill(1));
  const rooms = [];
  function tryRoom(w, h) {
    for (let t = 0; t < 300; t++) {
      const x = 2 + Math.floor(rnd() * (size - w - 4)), y = 2 + Math.floor(rnd() * (size - h - 4));
      if (rooms.every(r => x >= r.x + r.w + 2 || x + w + 2 <= r.x || y >= r.y + r.h + 2 || y + h + 2 <= r.y)) {
        const room = { x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) }; rooms.push(room); return room;
      }
    }
    return null;
  }
  if (boss) tryRoom(11, 11);
  const target = Math.min(14, 6 + Math.floor(n / 3));
  for (let i = 0; i < 80 && rooms.length < target; i++) tryRoom(4 + Math.floor(rnd() * 4), 4 + Math.floor(rnd() * 4));
  for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) grid[y][x] = 0;
  function carveL(a, b) {
    const hf = rnd() < 0.5;
    const hl = (y, x0, x1) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) grid[y][x] = 0; };
    const vl = (x, y0, y1) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) grid[y][x] = 0; };
    if (hf) { hl(a.cy, a.cx, b.cx); vl(b.cx, a.cy, b.cy); } else { vl(a.cx, a.cy, b.cy); hl(b.cy, a.cx, b.cx); }
  }
  for (let i = 1; i < rooms.length; i++) {
    let best = 0, bd = 1e9;
    for (let j = 0; j < i; j++) { const d = Math.abs(rooms[i].cx - rooms[j].cx) + Math.abs(rooms[i].cy - rooms[j].cy); if (d < bd) { bd = d; best = j; } }
    carveL(rooms[i], rooms[best]);
  }
  for (let k = 0; k < 3; k++) { const a = rooms[Math.floor(rnd() * rooms.length)], b = rooms[Math.floor(rnd() * rooms.length)]; if (a !== b) carveL(a, b); }

  let startRoom, arena = null;
  if (boss) {
    arena = rooms[0];
    const da = bfsGrid(grid, size, arena.cx, arena.cy);
    let bd = -1; startRoom = rooms[1];
    for (const r of rooms) { if (r === arena) continue; const d = da[r.cy * size + r.cx]; if (d > bd) { bd = d; startRoom = r; } }
  } else startRoom = rooms[0];
  const ds = bfsGrid(grid, size, startRoom.cx, startRoom.cy);
  const others = rooms.filter(r => r !== startRoom).sort((a, b) => ds[b.cy * size + b.cx] - ds[a.cy * size + a.cx]);
  const exitRoom = boss ? arena : others[0];
  const keyRoom = others.find(r => r !== exitRoom) || others[0];
  const nearRoom = others.slice().reverse().find(r => r !== arena) || others[others.length - 1];

  const total = ds.reduce((s, v) => s + (v >= 0 ? 1 : 0), 0);
  for (const r of rooms) {
    if (r === startRoom || r.w < 6 || r.h < 6) continue;
    const cnt = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < cnt; i++) {
      const x = r.x + 2 + Math.floor(rnd() * (r.w - 4)), y = r.y + 2 + Math.floor(rnd() * (r.h - 4));
      if (grid[y][x] !== 0) continue;
      let free = true;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (grid[y + dy][x + dx] !== 0) free = false;
      if (!free) continue;
      grid[y][x] = 3;
      const d2 = bfsGrid(grid, size, startRoom.cx, startRoom.cy);
      if (d2.reduce((s, v) => s + (v >= 0 ? 1 : 0), 0) !== total - 1) grid[y][x] = 0;
    }
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (grid[y][x] !== 1) continue;
    let adj = false;
    for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < size && ny < size && grid[ny][nx] === 0) adj = true; }
    if (!adj) continue;
    const v = (((x * 73856093) ^ (y * 19349663)) >>> 0) % 100;
    grid[y][x] = v < 68 ? 1 : v < 90 ? 2 : 3;
  }

  const used = [];
  function spot(room, minGap) {
    for (let t = 0; t < 60; t++) {
      const x = room.x + Math.floor(rnd() * room.w), y = room.y + Math.floor(rnd() * room.h);
      if (grid[y][x] !== 0) continue;
      const px = x + 0.5, py = y + 0.5;
      if (used.every(u => Math.hypot(u[0] - px, u[1] - py) > (minGap || 1.0))) { used.push([px, py]); return { x: px, y: py }; }
    }
    return { x: room.cx + 0.5, y: room.cy + 0.5 };
  }
  const mul = { hp: (1 + 0.04 * (n - 1)) * diff.hp, dm: (1 + 0.03 * (n - 1)) * diff.dmg, sp: (1 + 0.015 * (n - 1)) * diff.spd };
  const unlocked = TYPES.filter(t => INTRO[t] && INTRO[t] <= n);
  const newest = unlocked.filter(t => INTRO[t] >= n - 1);
  const pool = [];
  for (const t of unlocked) { pool.push(t); if (INTRO[t] >= n - 3) pool.push(t); }
  const enemies = [], pickups = [];
  const monsterRooms = rooms.filter(r => r !== startRoom && r !== arena);
  let count = Math.min(60, Math.round((5 + n * 2) * diff.count));
  if (boss) count = Math.floor(count / 2);
  for (let i = 0; i < count; i++) {
    const room = monsterRooms[i % monsterRooms.length]; const p = spot(room, 1.2);
    const type = i < 3 && newest.length ? newest[i % newest.length] : pool[Math.floor(rnd() * pool.length)];
    enemies.push(makeEnemy(type, p.x, p.y, mul));
    if (type === 'bat') for (let k = 0; k < 2; k++) {
      const bx = p.x + (k ? 0.5 : -0.5), by = p.y + 0.3;
      if ([[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].every(([ox, oy]) => grid[Math.floor(by + oy)][Math.floor(bx + ox)] === 0)) enemies.push(makeEnemy('bat', bx, by, mul));
    }
  }
  if (boss) {
    used.push([arena.cx + 0.5, arena.cy + 0.5]);
    for (const b of BOSS_PLAN[n]) {
      const e = makeEnemy(b.type, arena.cx + 0.5 + (b.dx || 0), arena.cy + 0.5, mul, b);
      e.noRevive = true; // boss-arena enemies are never resurrected
      enemies.push(e);
    }
    for (let i = 0; i < 2; i++) { const p = spot(arena, 2); enemies.push(makeEnemy(pool[i % pool.length], p.x, p.y, mul)); }
  }
  const nonStart = rooms.filter(r => r !== startRoom);
  const nh = 2 + Math.floor(n / 4), nb = 3 + Math.floor(n / 3), ns = n >= 2 ? 2 + Math.floor(n / 4) : 0;
  for (let i = 0; i < nh; i++) { const p = spot(nonStart[Math.floor(rnd() * nonStart.length)], 1); pickups.push({ type: 'health', x: p.x, y: p.y }); }
  for (let i = 0; i < nb; i++) { const p = spot(nonStart[Math.floor(rnd() * nonStart.length)], 1); pickups.push({ type: 'bullets', x: p.x, y: p.y }); }
  for (let i = 0; i < ns; i++) { const p = spot(nonStart[Math.floor(rnd() * nonStart.length)], 1); pickups.push({ type: 'shells', x: p.x, y: p.y }); }
  if (boss) {
    for (let i = 0; i < 3; i++) { const p = spot(startRoom, 1); pickups.push({ type: i === 0 ? 'health' : 'bullets', x: p.x, y: p.y }); }
    const extra = MAIN_BOSSES.indexOf(n) >= 0 ? 7 : 5;
    for (let i = 0; i < extra; i++) { const p = spot(arena, 2); pickups.push({ type: i % 4 === 3 ? 'health' : (i % 2 === 0 ? 'bullets' : 'shells'), x: p.x, y: p.y }); }
  }
  const WPL = { 1: 'shotgun', 3: 'rifle', 4: 'w_minigun', 6: 'w_rocket', 9: 'w_plasma', 12: 'w_flame', 16: 'w_rail', 22: 'w_destroyer' };
  if (WPL[n]) { const p = spot(nearRoom, 1); pickups.push({ type: WPL[n], x: p.x, y: p.y }); }
  for (const [t, from] of [['rockets', 6], ['cells', 9], ['fuel', 12]]) {
    if (n < from) continue;
    const cnt = 1 + (n >= from + 8 ? 1 : 0) + (boss ? 1 : 0) + (t === 'cells' && n >= 16 ? 1 : 0);
    for (let i = 0; i < cnt; i++) { const p = spot(nonStart[Math.floor(rnd() * nonStart.length)], 1); pickups.push({ type: t, x: p.x, y: p.y }); }
  }
  // decoration (non-solid): braziers, barrels, bones
  const decor = [];
  for (const r of rooms) {
    if (r === startRoom) continue;
    const nd = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < nd; i++) {
      const p = spot(r, 1.1), v = rnd();
      decor.push({ type: v < 0.5 ? 'brazier' : v < 0.8 ? 'barrel' : 'bones', x: p.x, y: p.y });
    }
  }
  const objective = boss ? 'boss' : (n % 2 === 0 ? 'key' : 'kill');
  let key = null;
  if (objective === 'key') { const p = spot(keyRoom, 1); key = { x: p.x, y: p.y }; }
  const exit = boss ? { x: arena.x + 1.5, y: arena.y + 1.5 } : { x: exitRoom.cx + 0.5, y: exitRoom.cy + 0.5 };
  const start = { x: startRoom.cx + 0.5, y: startRoom.cy + 0.5, angle: 0 };
  let bestA = 0, bestD = -1;
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, d = rayDist(grid, size, start.x, start.y, a); if (d > bestD) { bestD = d; bestA = a; } }
  start.angle = bestA;
  // pre-build textures for everything that can appear here: placed enemies, boss minions (pool) and spawned skulls
  for (const t of new Set([...enemies.map(e => e.type), ...pool, 'skull'])) void MON_TEX[t];
  return { n, boss, size, grid, rooms, start, exit, key, objective, enemies, pickups, decor, mul, pool, theme: themeFor(n) };
}
