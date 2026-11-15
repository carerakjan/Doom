// Doom-like: Rendering: world, weapons, HUD and overlays.
// Classic script (works from file://); top-level names are shared with the other js/*.js files.
'use strict';

// ===================================================================
// Rendering: world
// ===================================================================
const sprRow = new Int32Array(VH);
function renderWorld() {
  const T = theme, fog = T.fog, boost = lightBoost * 0.55;
  const dirX = Math.cos(player.angle), dirY = Math.sin(player.angle);
  const planeX = -dirY * 0.66, planeY = dirX * 0.66, px = player.x, py = player.y;

  const rdx0 = dirX - planeX, rdy0 = dirY - planeY, rdx1 = dirX + planeX, rdy1 = dirY + planeY;
  for (let y = HORIZON + 1; y < VH; y++) {
    const rowDist = 0.5 * PROJ / (y - HORIZON);
    const light = clamp(1.3 - rowDist * 0.09 + boost, 0.08, 1.25), m = (light * 256) | 0, inv = Math.max(0, 256 - m);
    const fr = fog[0] * inv, fg = fog[1] * inv, fb = fog[2] * inv;
    const stepX = rowDist * (rdx1 - rdx0) / W, stepY = rowDist * (rdy1 - rdy0) / W;
    let fx = px + rowDist * rdx0, fy = py + rowDist * rdy0;
    const yc = 2 * HORIZON - 1 - y, rowF = y * W, rowC = yc * W;
    for (let x = 0; x < W; x++) {
      const idx = ((((fy - Math.floor(fy)) * 64) | 0) << 6) + (((fx - Math.floor(fx)) * 64) | 0);
      let c = T.floor[idx];
      buf[rowF + x] = 0xff000000 | (Math.min(255, (((c >> 16) & 255) * m + fb) >> 8) << 16) | (Math.min(255, (((c >> 8) & 255) * m + fg) >> 8) << 8) | Math.min(255, ((c & 255) * m + fr) >> 8);
      c = T.ceil[idx];
      buf[rowC + x] = 0xff000000 | (Math.min(255, (((c >> 16) & 255) * m + fb) >> 8) << 16) | (Math.min(255, (((c >> 8) & 255) * m + fg) >> 8) << 8) | Math.min(255, ((c & 255) * m + fr) >> 8);
      fx += stepX; fy += stepY;
    }
  }
  for (let x = 0; x < W; x++) buf[HORIZON * W + x] = 0xff000000;

  for (let x = 0; x < W; x++) {
    const camX = 2 * x / W - 1, rdx = dirX + planeX * camX, rdy = dirY + planeY * camX;
    let mapX = Math.floor(px), mapY = Math.floor(py);
    const ddx = Math.abs(1 / (rdx || 1e-9)), ddy = Math.abs(1 / (rdy || 1e-9));
    let stepX, stepY, sdx, sdy;
    if (rdx < 0) { stepX = -1; sdx = (px - mapX) * ddx; } else { stepX = 1; sdx = (mapX + 1 - px) * ddx; }
    if (rdy < 0) { stepY = -1; sdy = (py - mapY) * ddy; } else { stepY = 1; sdy = (mapY + 1 - py) * ddy; }
    let side = 0, hit = 0, guard = 0;
    while (!hit && guard++ < 90) {
      if (sdx < sdy) { sdx += ddx; mapX += stepX; side = 0; } else { sdy += ddy; mapY += stepY; side = 1; }
      hit = (mapX < 0 || mapY < 0 || mapX >= size || mapY >= size) ? 1 : grid[mapY][mapX];
    }
    const perp = Math.max(0.05, side === 0 ? sdx - ddx : sdy - ddy);
    zbuf[x] = perp;
    const lineH = PROJ / perp, y0 = Math.floor(HORIZON - lineH / 2), y1 = Math.floor(HORIZON + lineH / 2);
    const tex = T.walls[(hit || 1) - 1];
    let wallX = side === 0 ? py + perp * rdy : px + perp * rdx; wallX -= Math.floor(wallX);
    let tx = (wallX * 64) | 0;
    if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) tx = 63 - tx;
    const light = clamp(1.3 - perp * 0.09 + boost, 0.08, 1.25) * (side ? 0.76 : 1), m = (light * 256) | 0, inv = Math.max(0, 256 - m);
    const fr = fog[0] * inv, fg = fog[1] * inv, fb = fog[2] * inv;
    const step = 64 / lineH, ys = Math.max(y0, 0), ye = Math.min(y1, VH - 1);
    let tp = (ys - y0) * step;
    for (let y = ys; y <= ye; y++) {
      const v = (tp | 0) & 63, c = tex[(v << 6) + tx]; tp += step;
      const mm = (m * AO[v]) >> 8;
      buf[y * W + x] = 0xff000000 | (Math.min(255, (((c >> 16) & 255) * mm + fb) >> 8) << 16) | (Math.min(255, (((c >> 8) & 255) * mm + fg) >> 8) << 8) | Math.min(255, ((c & 255) * mm + fr) >> 8);
    }
  }

  // sprites
  const list = [];
  for (const dd of decals) list.push({ x: dd.x, y: dd.y, tex: ITEM_TEX[dd.k], scale: dd.scale, z: 0, glow: false, flat: true });
  for (const c of corpses) { const xf = deathXf(c); list.push({ x: c.x, y: c.y, tex: xf.tex, scale: c.scale, z: xf.z, sw: xf.sw, sh: xf.sh, ox: xf.ox, alpha: xf.alpha }); }
  for (const d of decor) {
    if (d.type === 'brazier') list.push({ x: d.x, y: d.y, tex: ((time * 7 + d.x * 3) | 0) % 2 ? ITEM_TEX.brazier : ITEM_TEX.brazier2, scale: 0.8, z: 0, glow: true, near: 0.7 });
    else list.push({ x: d.x, y: d.y, tex: ITEM_TEX[d.type], scale: d.type === 'barrel' ? 0.55 : 0.4, z: 0, near: 0.6 });
  }
  for (const p of pickups) list.push({ x: p.x, y: p.y, tex: ITEM_TEX[p.type], scale: p.small ? 0.28 : (p.type === 'shotgun' || p.type === 'rifle' || p.type.startsWith('w_') ? 0.38 : 0.34), z: 0.02 + Math.sin(time * 3 + p.x) * 0.015 });
  if (keyItem && !keyItem.taken) list.push({ x: keyItem.x, y: keyItem.y, tex: ITEM_TEX.key, scale: 0.5, z: 0.18 + Math.sin(time * 3) * 0.06, glow: true });
  list.push({ x: L.exit.x, y: L.exit.y, tex: exitOpen ? ITEM_TEX.exit_on : ITEM_TEX.exit_off, scale: exitOpen ? 1.2 + Math.sin(time * 4) * 0.08 : 0.9, z: 0, glow: exitOpen });
  for (const s of strikes) list.push({ x: s.x, y: s.y, tex: ITEM_TEX.warn, scale: 1.2 - s.t * 0.3, z: 0, glow: true });
  for (const b of balls) list.push({ x: b.x, y: b.y, tex: ITEM_TEX[BALL_TEX[b.kind]], scale: b.kind === 'r' ? 0.3 : 0.32, z: 0.34, glow: true });
  for (const b of pballs) list.push({ x: b.x, y: b.y, tex: ITEM_TEX[b.kind === 'rocket' ? 'rocket' : b.kind === 'plasma' ? 'fire_d' : 'fire_b'], scale: b.kind === 'orb' ? 0.7 : b.kind === 'plasma' ? 0.2 : 0.3, z: 0.34, glow: true });
  for (const p of parts) list.push({ x: p.x, y: p.y, tex: ITEM_TEX[p.k], scale: p.size, z: Math.max(0, p.z), glow: !!p.glow });
  for (const e of enemies) {
    if (e.dead) continue;
    const d = DEFS[e.type];
    const xf = animFor(e, d);
    list.push({ x: e.x, y: e.y, tex: xf.tex, scale: d.scale, z: d.z + (d.float ? Math.sin(time * 3 + e.x) * 0.05 : 0) + xf.dz, sw: xf.sw, sh: xf.sh, ox: xf.ox, alpha: d.ghost ? 0.5 : 1 });
  }
  for (const s of list) s.dist = (s.x - px) * (s.x - px) + (s.y - py) * (s.y - py);
  list.sort((a, b) => b.dist - a.dist);
  const invDet = 1 / (planeX * dirY - dirX * planeY);
  for (const s of list) {
    const sx = s.x - px, sy = s.y - py;
    const tX = invDet * (dirY * sx - dirX * sy), tY = invDet * (-planeY * sx + planeX * sy);
    if (tY <= (s.near || 0.12)) continue;
    const lineH = PROJ / tY, sz = lineH * s.scale, screenX = (W / 2) * (1 + tX / tY);
    const szw = sz * (s.sw || 1), szh = sz * (s.sh || 1);
    const bottom = HORIZON + lineH / 2 - s.z * lineH, top = bottom - szh, left = screenX - szw / 2 + (s.ox || 0) * sz;
    const light = s.glow ? 1 : clamp(1.3 - tY * 0.09 + boost, 0.14, 1.2), m = (light * 256) | 0, inv = Math.max(0, 256 - m);
    const fr = fog[0] * inv, fg = fog[1] * inv, fb = fog[2] * inv;
    const c0 = Math.max(0, Math.floor(left)), c1 = Math.min(W - 1, Math.floor(left + szw));
    const r0 = Math.max(0, Math.floor(top)), r1 = Math.min(VH - 1, Math.floor(bottom));
    const tex = s.tex, al = s.alpha === undefined ? 1 : s.alpha, TS = tex.length > 4096 ? 128 : 64;
    // texture row offsets depend only on the screen row: compute them once per sprite, not per pixel
    for (let row = r0; row <= r1; row++) sprRow[row] = clamp(((row - top) / szh * TS) | 0, 0, TS - 1) * TS;
    const uK = TS / szw;
    for (let col = c0; col <= c1; col++) {
      if (tY >= zbuf[col]) continue;
      const u = clamp(((col - left) * uK) | 0, 0, TS - 1);
      for (let row = r0; row <= r1; row++) {
        const c = tex[sprRow[row] + u];
        if ((c >>> 24) < 60) continue;
        let r = Math.min(255, ((c & 255) * m + fr) >> 8), g = Math.min(255, (((c >> 8) & 255) * m + fg) >> 8), b = Math.min(255, (((c >> 16) & 255) * m + fb) >> 8);
        if (al < 1) { const o = buf[row * W + col]; r = (r * al + (o & 255) * (1 - al)) | 0; g = (g * al + ((o >> 8) & 255) * (1 - al)) | 0; b = (b * al + ((o >> 16) & 255) * (1 - al)) | 0; }
        buf[row * W + col] = 0xff000000 | (b << 16) | (g << 8) | r;
      }
    }
  }
  vctx.putImageData(img, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, VH);
  const sx = shake > 0 ? Math.round(rand(-1, 1) * shake * 10) : 0, sy = shake > 0 ? Math.round(rand(-1, 1) * shake * 8) : 0;
  ctx.drawImage(viewCv, sx, sy);
}

function animFor(e, d) {
  const t = MON_TEX[e.type], A = ANIM[e.type] || ANIM.zombie, ph = e.anim, mv = e.mv ? 1 : 0.25, S = Math.sin, PI = Math.PI;
  let sw = 1, sh = 1, dz = 0, ox = 0, tex = t.walk[Math.floor(ph * (A.walk === 'flap' ? 8 : 4)) % 2];
  switch (A.walk) {
    case 'stomp': sh += S(ph * 5) * 0.025 * mv; dz += Math.abs(S(ph * 5)) * 0.015 * mv; sw -= S(ph * 5) * 0.02 * mv; break;
    case 'march': sh += S(ph * 8) * 0.02 * mv; dz += Math.abs(S(ph * 8)) * 0.02 * mv; break;
    case 'hop': dz += Math.abs(S(ph * 6)) * 0.08 * mv; sh += S(ph * 6) * 0.06 * mv; sw -= S(ph * 6) * 0.04 * mv; break;
    case 'sway': sw += S(ph * 4) * 0.06 * mv; ox += S(ph * 4) * 0.03 * mv; sh -= Math.abs(S(ph * 4)) * 0.03 * mv; break;
    case 'glide': dz += S(ph * 2.5) * 0.05; sw += S(ph * 1.3) * 0.03; break;
    case 'slither': sw += S(ph * 7) * 0.1 * mv; sh -= S(ph * 7) * 0.05 * mv; ox += S(ph * 3.5) * 0.04 * mv; break;
    case 'flap': dz += S(ph * 14) * 0.04; sh += S(ph * 14) * 0.14; sw -= S(ph * 14) * 0.07; break;
    case 'lurch': ox += S(ph * 9) * 0.05 * mv; sh -= Math.abs(S(ph * 9)) * 0.07 * mv; sw += Math.abs(S(ph * 9)) * 0.05 * mv; break;
    case 'pulse': { const b = Math.max(0, S(ph * 7)) * 0.05; sw += b; sh += b; break; }
  }
  if (e.atkAnim > 0 || e.meleeT > 0) tex = t.atk;
  if (e.meleeT > 0) {
    const p = 1 - e.meleeT / 0.3, s = S(PI * p);
    switch (A.melee) {
      case 'lunge': sw += 0.3 * s; sh += 0.12 * s; dz += 0.03 * s; break;
      case 'slam': sh += p < 0.5 ? 0.2 * (p / 0.5) : 0.2 - 0.45 * ((p - 0.5) / 0.5); break;
      case 'slash': ox += (p - 0.5) * 0.3; sw += 0.1 * s; break;
      case 'bite': sw += 0.25 * s; sh += 0.25 * s; dz += 0.05 * s; break;
    }
  } else if (e.atkAnim > 0) {
    const p = 1 - Math.min(1, e.atkAnim / 0.3), s = S(PI * p);
    if (A.atk === 'raise') { dz += 0.05 * s; sh += 0.1 * s; sw -= 0.03 * s; } else { sh -= 0.07 * s; sw += 0.08 * s; ox -= 0.02 * s; }
  }
  if (e.leaping > 0) { dz += 0.55 * S(PI * (1 - e.leaping / 0.4)); sh += 0.1; tex = t.atk; }
  if (e.hit > 0) { tex = t.hurt; ox += (Math.random() - 0.5) * 0.04; }
  return { tex, sw, sh, dz, ox };
}
function deathXf(c) {
  const D = DEATH[c.type] || ['collapse', 0.7], st = D[0], t = clamp(c.age / D[1], 0, 1), ez = 1 - (1 - t) * (1 - t), M = MON_TEX[c.type], S = Math.sin;
  if (t >= 1) return { tex: c.tex, sw: 1, sh: 1, z: 0, ox: 0, alpha: st === 'dissolve' ? 0.35 : 1 };
  let sw = 1, sh = 1, z = c.z0 * (1 - ez), ox = 0, alpha = 1, tex = M.walk[0];
  switch (st) {
    case 'collapse': sh = 1 - 0.62 * ez; sw = 1 + 0.2 * ez; break;
    case 'topple': sh = 1 - 0.6 * ez; sw = 1 + 0.35 * ez; ox = 0.18 * ez * c.dir; break;
    case 'spin': sw = 0.2 + 0.8 * Math.abs(Math.cos(t * Math.PI * 3)); sh = 1 - 0.55 * ez; z += 0.25 * S(Math.PI * t); break;
    case 'melt': sh = 1 - 0.75 * ez; sw = 1 + 0.45 * ez; break;
    case 'burst': if (t < 0.5) { sw = sh = 1 + t; } else { sw = sh = 1.5; alpha = 1 - (t - 0.5) * 2; tex = M.hurt; } break;
    case 'dissolve': alpha = 1 - 0.7 * ez; z += 0.25 * ez; sw = 1 - 0.1 * ez; break;
    case 'shatter': if (t < 0.5) { sw = 1 + S(c.age * 80) * 0.05; tex = M.hurt; } else { sh = 1 - 0.7 * ((t - 0.5) * 2); } break;
    case 'crumble': ox = S(c.age * 60) * 0.02 * (1 - t); sh = 1 - 0.55 * ez; sw = 1 + 0.12 * ez; break;
    case 'drop': z = c.z0 * (1 - ez * ez); sh = 1 - 0.5 * ez * ez; sw = 1 + 0.2 * ez; break;
  }
  return { tex, sw, sh, z, ox, alpha };
}

// vignette, prerendered
const vig = mkCanvas(W, VH);
(function () {
  const g = vig.getContext('2d'), grd = g.createRadialGradient(W / 2, VH / 2, VH * 0.35, W / 2, VH / 2, W * 0.62);
  grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = grd; g.fillRect(0, 0, W, VH);
})();

// ===================================================================
// Rendering: weapons, HUD, hero face, overlays
// ===================================================================
// Perspective for the held weapon: rows near the bottom (hands) are drawn 1:1, rows higher up are
// squeezed in height and narrowed toward the weapon's centre line, so barrels recede toward the crosshair.
const WARP_H0 = 50, WARP_D = 140, WARP_HW = 160; // 1:1 zone height, perspective depth, half-width of the weapon strip
function warpWeapon(cx) {
  const topT = WARP_H0 + WARP_D * Math.log(1 + (VH - WARP_H0) / WARP_D);
  for (let t = 0; t < topT; t++) {
    const far = Math.max(0, t - WARP_H0), h = t - far + WARP_D * (Math.exp(far / WARP_D) - 1);
    const s = 1 / (1 + (h - (t - far)) / WARP_D), rows = Math.max(1, Math.round(1 / s));
    const sy = VH - Math.floor(h) - rows; if (sy < 0) break;
    const x0 = Math.max(0, Math.round(cx) - WARP_HW), x1 = Math.min(W, Math.round(cx) + WARP_HW);
    ctx.drawImage(wCanvas, x0, sy, x1 - x0, rows, cx + (x0 - cx) * s, VH - 1 - t, (x1 - x0) * s, 1);
  }
}
function drawWeapon() {
  const w = WEAPONS[player.weapon];
  const bob = moving ? Math.sin(time * 9) : Math.sin(time * 1.7) * 0.25;
  const swAmt = switchT > 0 ? Math.pow(switchT / 0.25, 2) : 0;
  const ax = W / 2 + bob * 7 + (moving ? 0 : Math.sin(time * 1.1) * 2), ay0 = VH + 4 + Math.abs(bob) * 5 + swAmt * 130;
  const kick = fireT > 0 ? Math.min(1, fireT / 0.12) : 0;
  const R = (x, y, ww, hh, c) => { wctx.fillStyle = c; wctx.fillRect(Math.round(x), Math.round(y), ww, hh); };
  const skin = '#c99468', skinD = '#a67450', sleeve = '#2e4a34';
  const flash = (x, y, s) => {
    if (kick <= 0.2) return;
    const grd = wctx.createRadialGradient(x, y, 1, x, y, s * 1.8); grd.addColorStop(0, 'rgba(255,250,200,0.95)'); grd.addColorStop(0.35, 'rgba(255,190,60,0.8)'); grd.addColorStop(1, 'rgba(255,100,0,0)');
    wctx.fillStyle = grd; wctx.fillRect(x - s * 2, y - s * 2, s * 4, s * 4);
  };
  const glowC = (x, y, sz, c0, c1) => {
    if (kick <= 0.2) return;
    const grd = wctx.createRadialGradient(x, y, 1, x, y, sz * 1.8); grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.3, c0); grd.addColorStop(1, c1);
    wctx.fillStyle = grd; wctx.fillRect(x - sz * 2, y - sz * 2, sz * 4, sz * 4);
  };
  if (railT > 0) {
    ctx.save(); ctx.globalAlpha = railT / 0.35;
    ctx.fillStyle = 'rgba(120,200,255,0.6)'; ctx.beginPath(); ctx.moveTo(W / 2 - 22, VH); ctx.lineTo(W / 2 + 22, VH); ctx.lineTo(W / 2 + 3, HORIZON); ctx.lineTo(W / 2 - 3, HORIZON); ctx.fill();
    ctx.fillStyle = '#e8f6ff'; ctx.beginPath(); ctx.moveTo(W / 2 - 7, VH); ctx.lineTo(W / 2 + 7, VH); ctx.lineTo(W / 2 + 1, HORIZON); ctx.lineTo(W / 2 - 1, HORIZON); ctx.fill();
    ctx.restore();
  }
  const ay = ay0;
  wctx.clearRect(0, 0, W, VH);
  if (w.id === 'pistol') {
    const k = kick * 16, y = ay - k, slide = kick > 0.3 ? 8 : 0;
    R(ax - 40, y - 28, 30, 34, sleeve); R(ax + 14, y - 28, 30, 34, sleeve);
    R(ax - 12, y - 108 + slide, 24, 70, '#3a3a42'); R(ax - 12, y - 108 + slide, 24, 6, '#6a6a76'); R(ax - 12, y - 108 + slide, 5, 70, '#52525c'); R(ax - 5, y - 114 + slide, 10, 8, '#2a2a30');
    R(ax - 14, y - 46, 28, 56, '#2c2c32'); R(ax - 9, y - 38, 18, 44, '#4a3626');
    R(ax - 22, y - 38, 14, 26, skin); R(ax + 8, y - 36, 14, 24, skinD);
    flash(ax, y - 118, 22);
  } else if (w.id === 'shotgun') {
    const k = kick * 28, y = ay - k;
    const pr = cooldown > 0 ? cooldown / 0.85 : 0, pump = pr < 0.66 && pr > 0.12 ? Math.sin((0.66 - pr) / 0.54 * Math.PI) * 26 : 0;
    R(ax - 52, y - 22, 40, 30, sleeve); R(ax + 12, y - 22, 40, 30, sleeve);
    R(ax - 22, y - 128, 19, 100, '#3a3a42'); R(ax + 3, y - 128, 19, 100, '#34343c');
    R(ax - 22, y - 128, 4, 100, '#6a6a76'); R(ax + 3, y - 128, 4, 100, '#6a6a76');
    R(ax - 22, y - 134, 44, 8, '#22222a'); R(ax - 3, y - 144, 6, 12, '#d9a73a');
    R(ax - 20, y - 76 + pump, 40, 22, '#5a3a20'); R(ax - 20, y - 76 + pump, 40, 4, '#7a5030');
    R(ax - 24, y - 40, 48, 40, '#7a4a28'); R(ax - 24, y - 40, 48, 5, '#9a6038'); R(ax - 30, y - 60, 60, 12, '#5a3a20');
    R(ax - 34, y - 56, 16, 30, skin); R(ax + 18, y - 52 + pump, 16, 28, skinD);
    flash(ax - 10, y - 140, 26); flash(ax + 12, y - 140, 24);
  } else if (w.id === 'rifle') {
    const k = kick * 10, y = ay - k;
    R(ax - 44, y - 24, 30, 30, sleeve); R(ax + 16, y - 24, 30, 30, sleeve);
    R(ax - 6, y - 130, 12, 80, '#2a2a30'); R(ax - 3, y - 138, 6, 10, '#1a1a1e');
    R(ax - 18, y - 72, 36, 52, '#3a3a42'); R(ax - 18, y - 72, 36, 5, '#6a6a76');
    R(ax + 18, y - 52, 12, 40, '#26262c'); R(ax - 12, y - 30, 24, 34, '#4a3626');
    R(ax - 28, y - 44, 14, 26, skin); R(ax + 14, y - 40, 14, 24, skinD);
    flash(ax, y - 142, 18);
  } else if (w.id === 'minigun') {
    const k = kick * 6, y = ay - k, spin = time * (fireT > 0 || (mouseDown && cooldown > 0) ? 38 : 4);
    R(ax - 48, y - 24, 34, 30, sleeve); R(ax + 16, y - 24, 34, 30, sleeve);
    R(ax - 26, y - 96, 52, 70, '#3a3a42'); R(ax - 26, y - 96, 52, 6, '#6a6a76');
    // six spinning barrels, back ones first so the front ones overlap them
    const bTop = y - 176, bBot = y - 92, brl = [];
    for (let i = 0; i < 6; i++) { const ph = spin + i * 1.047; brl.push({ sn: Math.sin(ph), cs: Math.cos(ph) }); }
    brl.sort((a, b) => a.cs - b.cs);
    for (const b of brl) { const bx = ax + b.sn * 18; R(bx - 4, bTop, 8, bBot - bTop, b.cs > 0 ? '#8a8a96' : '#4a4a54'); R(bx - 4, bTop - 2, 8, 4, '#121216'); }
    R(ax - 24, y - 140, 48, 8, '#2a2a30'); R(ax - 24, y - 140, 48, 2, '#5a5a66');
    R(ax - 30, y - 100, 60, 8, '#2a2a30'); R(ax - 18, y - 60, 36, 40, '#4a3626'); R(ax - 34, y - 50, 16, 26, skin); R(ax + 18, y - 46, 16, 24, skinD);
    flash(ax, y - 182, 22);
  } else if (w.id === 'rocket') {
    const k = kick * 22, y = ay - k;
    R(ax - 52, y - 22, 40, 30, sleeve); R(ax + 12, y - 22, 40, 30, sleeve);
    R(ax - 22, y - 150, 44, 110, '#4a5a3a'); R(ax - 22, y - 150, 6, 110, '#6a7a52'); R(ax - 26, y - 156, 52, 10, '#2a3220'); R(ax - 14, y - 152, 28, 6, '#0a0a0a');
    if (cooldown <= 0) { R(ax - 8, y - 160, 16, 10, '#d03a2a'); R(ax - 4, y - 168, 8, 8, '#8a8a94'); }
    R(ax + 22, y - 110, 10, 20, '#222'); R(ax - 14, y - 60, 28, 60, '#3a2a1a'); R(ax - 34, y - 56, 16, 30, skin); R(ax + 18, y - 52, 16, 28, skinD);
    glowC(ax, y - 164, 30, 'rgba(255,190,60,0.8)', 'rgba(255,100,0,0)');
  } else if (w.id === 'plasma') {
    const k = kick * 8, y = ay - k, pu = 0.5 + 0.5 * Math.sin(time * 10);
    R(ax - 46, y - 24, 34, 30, sleeve); R(ax + 14, y - 24, 34, 30, sleeve);
    R(ax - 18, y - 130, 36, 110, '#2a3446'); R(ax - 18, y - 130, 5, 110, '#4a5870');
    for (let i = 0; i < 4; i++) { wctx.fillStyle = 'rgba(96,224,255,' + (0.55 + pu * 0.4) + ')'; wctx.fillRect(Math.round(ax - 24), Math.round(y - 124 + i * 22), 48, 6); }
    R(ax - 6, y - 150, 12, 26, '#3a4a6a'); R(ax - 10, y - 158, 20, 10, '#a0f0ff'); R(ax - 14, y - 60, 28, 56, '#2a2a32'); R(ax - 30, y - 50, 16, 26, skin); R(ax + 16, y - 46, 16, 24, skinD);
    glowC(ax, y - 160, 22, 'rgba(96,200,255,0.85)', 'rgba(0,100,255,0)');
  } else if (w.id === 'flame') {
    const y = ay;
    R(ax - 50, y - 22, 36, 30, sleeve); R(ax + 14, y - 22, 36, 30, sleeve);
    R(ax - 10, y - 130, 20, 100, '#5a5a64'); R(ax - 10, y - 130, 4, 100, '#8a8a96'); R(ax - 14, y - 138, 28, 10, '#2a2a30');
    R(ax + 26, y - 74, 26, 74, '#b03a1a'); R(ax + 26, y - 74, 26, 6, '#d05a3a'); R(ax + 34, y - 84, 10, 12, '#444'); R(ax + 10, y - 50, 18, 5, '#222');
    R(ax - 14, y - 56, 28, 56, '#3a2a1a'); R(ax - 34, y - 52, 16, 28, skin); R(ax + 14, y - 46, 16, 24, skinD);
    wctx.fillStyle = Math.random() < 0.5 ? '#ff9a2a' : '#ffd23f'; wctx.beginPath(); wctx.arc(ax, y - 144, 4 + Math.random() * 2, 0, 6.283); wctx.fill();
    if (flameT > 0) for (const [c, wd] of [['rgba(255,80,0,0.55)', 54], ['rgba(255,170,30,0.7)', 36], ['rgba(255,240,170,0.85)', 18]]) {
      wctx.fillStyle = c; wctx.beginPath(); wctx.moveTo(ax - 6, y - 142); wctx.lineTo(ax - wd + Math.random() * 10, y - 280 - Math.random() * 30); wctx.lineTo(ax + wd - Math.random() * 10, y - 280 - Math.random() * 30); wctx.lineTo(ax + 6, y - 142); wctx.fill();
    }
  } else if (w.id === 'rail') {
    const k = kick * 14, y = ay - k, ch = cooldown > 0 ? 1 - cooldown / 1.1 : 1;
    R(ax - 46, y - 24, 34, 30, sleeve); R(ax + 14, y - 24, 34, 30, sleeve);
    R(ax - 10, y - 170, 20, 150, '#2a2e3a'); R(ax - 16, y - 170, 6, 130, '#8ab0ff'); R(ax + 10, y - 170, 6, 130, '#8ab0ff');
    for (let i = 0; i < 5; i++) R(ax - 18, y - 160 + i * 26, 36, 5, '#4a5a7a');
    wctx.fillStyle = 'rgba(120,220,255,' + (0.2 + ch * 0.7) + ')'; wctx.fillRect(Math.round(ax - 5), Math.round(y - 165), 10, 120);
    R(ax - 20, y - 50, 40, 50, '#3a3a46'); R(ax - 12, y - 40, 24, 40, '#4a3626'); R(ax - 30, y - 46, 16, 26, skin); R(ax + 14, y - 42, 16, 24, skinD);
    glowC(ax, y - 174, 20, 'rgba(120,200,255,0.9)', 'rgba(0,120,255,0)');
  } else if (w.id === 'destroyer') {
    const k = kick * 20, y = ay - k, pu = 0.5 + 0.5 * Math.sin(time * 6);
    R(ax - 60, y - 22, 36, 30, sleeve); R(ax + 24, y - 22, 36, 30, sleeve);
    R(ax - 34, y - 110, 68, 110, '#4a2a5a'); R(ax - 34, y - 110, 68, 8, '#7a4a8a'); R(ax - 44, y - 90, 10, 50, '#2a1634'); R(ax + 34, y - 90, 10, 50, '#2a1634');
    R(ax - 26, y - 134, 52, 26, '#2a1634');
    wctx.fillStyle = 'rgba(255,90,255,' + (0.6 + pu * 0.4) + ')'; wctx.beginPath(); wctx.arc(ax, y - 122, 9 + pu * 4, 0, 6.283); wctx.fill();
    wctx.fillStyle = '#fff'; wctx.beginPath(); wctx.arc(ax, y - 122, 4, 0, 6.283); wctx.fill();
    R(ax - 40, y - 54, 16, 28, skin); R(ax + 24, y - 50, 16, 26, skinD);
    glowC(ax, y - 126, 34, 'rgba(255,90,255,0.85)', 'rgba(160,0,200,0)');
  } else {
    const shk = (sawT > 0 ? 6 : 1.2), jx = (Math.random() - 0.5) * shk, jy = (Math.random() - 0.5) * shk, y = ay + jy, x = ax + jx;
    R(x - 70, y - 26, 34, 34, sleeve); R(x + 34, y - 26, 34, 34, sleeve);
    R(x - 34, y - 90, 68, 90, '#d9701a'); R(x - 34, y - 90, 68, 8, '#f0903a'); R(x - 34, y - 14, 68, 14, '#a8540f');
    R(x - 18, y - 110, 36, 26, '#2a2a30'); R(x - 24, y - 70, 48, 8, '#1a1a1e');
    R(x - 12, y - 190, 24, 90, '#a8a8b4'); R(x - 12, y - 190, 6, 90, '#d0d0dc'); R(x + 6, y - 190, 6, 90, '#6a6a76');
    const off = ((time * (sawT > 0 ? 90 : 18)) % 10);
    for (let i = 0; i < 11; i++) { const cy = y - 200 + i * 10 + off; if (cy < y - 100 && cy > y - 192) { R(x - 17, cy, 6, 4, '#22222a'); R(x + 11, cy + 5, 6, 4, '#22222a'); } }
    R(x - 46, y - 56, 16, 40, skin); R(x + 30, y - 50, 16, 34, skinD); R(x - 6, y - 78, 12, 10, '#22222a');
    if (sawT > 0) { wctx.fillStyle = 'rgba(255,230,160,0.85)'; for (let i = 0; i < 8; i++) wctx.fillRect(x - 24 + Math.random() * 48, y - 195 - Math.random() * 22, 3, 3); }
  }
  warpWeapon(ax);
  // ejected brass
  ctx.fillStyle = '#d9a73a';
  for (const c of casings) ctx.fillRect(Math.round(c.x), Math.round(c.y), 5, 3);
  if (w.id !== 'chainsaw') {
    ctx.fillStyle = '#fff';
    ctx.fillRect(W / 2 - 1, HORIZON - 7, 2, 5); ctx.fillRect(W / 2 - 1, HORIZON + 3, 2, 5);
    ctx.fillRect(W / 2 - 7, HORIZON - 1, 5, 2); ctx.fillRect(W / 2 + 3, HORIZON - 1, 5, 2);
  }
}

// Original hero: a brutal bald marine with a beard, scars and a red cyber-eye in green plate armour.
function drawFace(x, y, S, hp) {
  const lvl = hp > 80 ? 0 : hp > 60 ? 1 : hp > 40 ? 2 : hp > 20 ? 3 : 4;
  const dead = state === 'dead' || hp <= 0, hurt = time - lastHurt < 0.45, grin = grinT > 0 && !hurt && !dead;
  ctx.save(); ctx.translate(x, y); ctx.scale(S / 56, S / 56);
  ctx.beginPath(); ctx.rect(0, 0, 56, 56); ctx.clip();
  const poly = (pts, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fill(); };
  const ell = (cx, cy, rx, ry, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 6.283); ctx.fill(); };
  const line = (x1, y1, x2, y2, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  ctx.fillStyle = '#14121a'; ctx.fillRect(0, 0, 56, 56);
  // green plate armour
  const ar = ['#3f8a3a', '#3a7e36', '#34702f', '#2d6029', '#264f24'][lvl], arH = ['#78c05a', '#6cb050', '#5c9a46', '#4c8038', '#3e6a30'][lvl];
  poly([[0, 56], [0, 40], [11, 36], [19, 46], [17, 56]], ar); poly([[56, 56], [56, 40], [45, 36], [37, 46], [39, 56]], ar);
  line(2, 41, 11, 38, arH, 1.8); line(54, 41, 45, 38, arH, 1.8); ell(6, 47, 1.4, 1.4, '#1c3a18'); ell(50, 47, 1.4, 1.4, '#1c3a18');
  if (lvl >= 2) { line(4, 44, 9, 52, '#1c3a18', 1.2); }
  // neck and head
  const tone0 = ['#d09a74', '#c8926e', '#bd8a68', '#b08066', '#9a7060'][lvl], tone1 = ['#a8704e', '#a06a4c', '#966448', '#8a5c46', '#7a5240'][lvl];
  poly([[21, 42], [35, 42], [37, 50], [28, 54], [19, 50]], tone1);
  const grd = ctx.createLinearGradient(8, 8, 48, 50); grd.addColorStop(0, tone0); grd.addColorStop(1, tone1);
  ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(28, 30, 18, 21, 0, 0, 6.283); ctx.fill();
  ell(10, 31, 2.6, 5, tone1); ell(46, 31, 2.6, 5, tone1);
  // shaved scalp, tribal marks
  ctx.save(); ctx.beginPath(); ctx.ellipse(28, 30, 18, 21, 0, 0, 6.283); ctx.clip(); poly([[8, 8], [48, 8], [48, 18], [8, 18]], 'rgba(40,28,22,0.5)'); ctx.restore(); line(20, 13, 26, 17, '#1a100c', 1.3); line(36, 13, 30, 17, '#1a100c', 1.3); line(28, 12, 28, 17, '#1a100c', 1.3);
  // heavy brow
  const wince = hurt || lvl >= 3;
  line(12, wince ? 24 : 25, 26, wince ? 28 : 27, '#1a100c', 3.6); line(44, wince ? 24 : 25, 30, wince ? 28 : 27, '#1a100c', 3.6);
  // eyes: left human, right red cyber-eye
  const blink = (time % 3.6) < 0.12, open = !(dead || hurt || blink);
  if (open) {
    ell(21, 31, 4.6, 2.8, '#ece4d8'); ell(21.6, 31, 2.1, 2.3, '#3a2a1c'); ell(21.6, 31, 1, 1, '#000');
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(16, 28.4, 10, 1.4);
    ctx.strokeStyle = '#4a4e58'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(35, 31, 4.8, 3.4, 0, 0, 6.283); ctx.stroke();
    const flick = lvl >= 4 && Math.sin(time * 33) > 0.6;
    ctx.shadowColor = '#ff2a1a'; ctx.shadowBlur = flick ? 0 : 5; ell(35, 31, 3.2, 3.2, grin ? '#ff8a6a' : flick ? '#7a1a14' : '#ff2a1a'); ctx.shadowBlur = 0; ell(35.8, 30.2, 1, 1, '#fff');
  } else if (dead) { line(17, 29, 25, 34, '#1a100c', 1.8); line(25, 29, 17, 34, '#1a100c', 1.8); line(31, 29, 39, 34, '#1a100c', 1.8); line(39, 29, 31, 34, '#1a100c', 1.8); }
  else { line(16.5, 31, 25.5, 31, '#1a100c', 2.2); line(30.5, 31, 39.5, 31, '#1a100c', 2.2); }
  // nose
  line(28, 31, 26.5, 39, 'rgba(90,50,34,0.8)', 1.7); line(26.4, 39.4, 30.4, 39.6, 'rgba(90,50,34,0.9)', 1.7);
  // beard, moustache and snarl
  ctx.save(); ctx.beginPath(); ctx.ellipse(28, 31, 18.5, 22, 0, 0, 6.283); ctx.clip(); poly([[8, 38], [18, 40], [20, 41], [36, 41], [38, 40], [48, 38], [48, 56], [8, 56]], 'rgba(30,20,14,0.88)'); ctx.restore();
  line(20, 41, 36, 41, '#1a100c', 2.4);
  const mo = dead ? 6 : hurt ? 5 : grin ? 4.6 : 3;
  poly([[20, 43], [36, 43], [34.5, 43 + mo], [21.5, 43 + mo]], '#3a0a0e');
  ctx.fillStyle = '#efe8dc'; ctx.fillRect(20.6, 43.3, 14.8, 2.2); if (!dead) ctx.fillRect(21.8, 43.3 + mo - 1.8, 12.4, 1.5);
  ctx.fillStyle = '#6a5a4a'; for (let i = 0; i < 6; i++) ctx.fillRect(22.2 + i * 2.4, 43.3, 0.5, 2.2);
  // scars and battle damage
  line(14, 21, 18, 36, '#e0b090', 1.5); line(13, 27, 18, 26, '#c89878', 1);
  if (lvl >= 1) line(40, 22, 36, 30, '#d8a888', 1.2);
  if (lvl >= 2) { line(24, 24, 23, 34, '#b3141a', 2.2); ell(23, 35, 1.6, 1.6, '#b3141a'); }
  if (lvl >= 3) { ell(20, 33, 7, 4.6, 'rgba(100,50,110,0.4)'); line(41, 34, 42, 43, '#b3141a', 2); line(26, 45, 27, 51, '#a0101a', 1.8); }
  if (lvl >= 4 || dead) { line(16, 38, 17, 50, '#a0101a', 2.4); ell(41, 25, 2.6, 3, '#a0101a'); line(33, 36, 34, 46, '#8a0e12', 1.8); }
  if (hurt) { ctx.fillStyle = 'rgba(255,0,0,0.25)'; ctx.fillRect(0, 0, 56, 56); }
  ctx.restore();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(x, y, S, S);
}

function drawHud() {
  const y0 = VH;
  ctx.fillStyle = '#26232c'; ctx.fillRect(0, y0, W, HUD_H); ctx.fillStyle = '#3a3642'; ctx.fillRect(0, y0, W, 3); ctx.fillStyle = '#16141a'; ctx.fillRect(0, y0 + 3, W, 2);
  for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(255,255,255,0.025)'; ctx.fillRect((i * 97) % W, y0 + 5 + (i * 31) % 56, 18, 1); }
  const panel = (x, w) => { ctx.fillStyle = '#121016'; ctx.fillRect(x, y0 + 8, w, 50); ctx.strokeStyle = '#4a4552'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y0 + 8.5, w - 1, 49); };
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  panel(8, 130);
  ctx.fillStyle = '#8a8494'; ctx.font = 'bold 10px monospace'; ctx.fillText('ЗДОРОВ\'Я', 16, y0 + 22);
  ctx.fillStyle = player.hp > 50 ? '#3ddc84' : player.hp > 25 ? '#ffb030' : '#ff4a3a'; ctx.font = 'bold 30px monospace'; ctx.fillText(player.hp + '%', 16, y0 + 52);
  panel(144, 142);
  for (let i = 0; i < 10; i++) {
    const own = player.own[WEAPONS[i].id], cur = i === player.weapon, sx = 148 + (i % 5) * 27, sy = y0 + 12 + Math.floor(i / 5) * 23;
    ctx.fillStyle = cur ? '#d9a73a' : own ? '#4a4552' : '#1c1a22'; ctx.fillRect(sx, sy, 24, 20);
    ctx.fillStyle = cur ? '#1a1206' : own ? '#e8e4ee' : '#4a4552'; ctx.font = 'bold 14px monospace'; ctx.fillText(String((i + 1) % 10), sx + 8, sy + 15);
  }
  drawFace(W / 2 - 28, y0 + 5, 56, player.hp);
  panel(376, 100);
  const w = WEAPONS[player.weapon];
  ctx.fillStyle = '#8a8494'; ctx.font = 'bold 10px monospace'; ctx.fillText(w.name, 384, y0 + 22);
  ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 30px monospace'; ctx.fillText(w.ammo ? String(player.ammo[w.ammo]) : '∞', 384, y0 + 52);
  panel(482, 150);
  ctx.font = 'bold 10px monospace';
  const A = player.ammo, row = (t, v, col, x, yy) => { ctx.fillStyle = col; ctx.fillText(t + ' ' + (v || 0), x, y0 + yy); };
  row('ПАТР', A.bullets, '#e0b040', 488, 24); row('ДРІБ', A.shells, '#d0503a', 488, 38); row('РАК ', A.rockets, '#9ab070', 488, 52);
  row('ПЛАЗ', A.cells, '#60d0ff', 556, 24); row('ПАЛ ', A.fuel, '#ff8a3a', 556, 38);
  ctx.fillStyle = hasKey ? '#7ae8ff' : '#8a8494';
  ctx.fillText(L.objective === 'key' ? (hasKey ? '◆ КЛЮЧ ОК' : '◇ БЕЗ КЛЮЧА') : 'ВОРОГИ ' + killCount + '/' + totalEnemies, 556, y0 + 52);
}

function drawMinimap() {
  const ms = Math.max(3, Math.floor(130 / size)), ox = W - size * ms - 8, oy = 8;
  ctx.globalAlpha = 0.8; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(ox - 2, oy - 2, size * ms + 4, size * ms + 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { if (!seen[y * size + x]) continue; ctx.fillStyle = grid[y][x] ? '#8a8494' : '#2a2832'; ctx.fillRect(ox + x * ms, oy + y * ms, ms, ms); }
  const sn = (x, y) => seen[Math.floor(y) * size + Math.floor(x)];
  ctx.fillStyle = '#ff5544';
  for (const e of enemies) if (!e.dead && sn(e.x, e.y)) ctx.fillRect(ox + e.x * ms - 1, oy + e.y * ms - 1, 3, 3);
  if (Math.sin(time * 8) > -0.3) {
    ctx.fillStyle = '#ff9a3c';
    for (const e of hintTargets()) ctx.fillRect(ox + e.x * ms - 2, oy + e.y * ms - 2, 5, 5);
  }
  if (keyItem && !keyItem.taken && sn(keyItem.x, keyItem.y)) { ctx.fillStyle = '#7ae8ff'; ctx.fillRect(ox + keyItem.x * ms - 2, oy + keyItem.y * ms - 2, 4, 4); }
  if (sn(L.exit.x, L.exit.y)) { ctx.fillStyle = exitOpen ? '#3ddc84' : '#666'; ctx.fillRect(ox + L.exit.x * ms - 2, oy + L.exit.y * ms - 2, 4, 4); }
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(ox + player.x * ms - 2, oy + player.y * ms - 2, 4, 4);
  ctx.strokeStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(ox + player.x * ms, oy + player.y * ms);
  ctx.lineTo(ox + (player.x + Math.cos(player.angle) * 2) * ms, oy + (player.y + Math.sin(player.angle) * 2) * ms); ctx.stroke();
  ctx.globalAlpha = 1;
}

function textShadow(t, x, y, col) { ctx.fillStyle = '#000'; ctx.fillText(t, x + 1, y + 1); ctx.fillStyle = col; ctx.fillText(t, x, y); }

function drawOverlays() {
  ctx.drawImage(vig, 0, 0);
  if (shield > 0) {
    const a = shield < 1 ? shield : 1, pulse = 0.5 + 0.5 * Math.sin(time * 8);
    const grd = ctx.createRadialGradient(W / 2, VH / 2, VH * 0.25, W / 2, VH / 2, W * 0.6);
    grd.addColorStop(0, 'rgba(80,180,255,0)'); grd.addColorStop(1, 'rgba(80,180,255,' + (0.28 + pulse * 0.2) * a + ')');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, VH);
    ctx.strokeStyle = 'rgba(160,220,255,' + (0.35 + pulse * 0.25) * a + ')'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, W - 4, VH - 4);
  }
  if (hurtFlash > 0) { ctx.fillStyle = 'rgba(210,0,0,' + Math.min(0.55, hurtFlash * 1.4) + ')'; ctx.fillRect(0, 0, W, VH); }
  if (pickFlash > 0) { ctx.fillStyle = 'rgba(255,230,120,' + pickFlash * 0.5 + ')'; ctx.fillRect(0, 0, W, VH); }
  // blood on the screen
  for (const b of bloodScreen) {
    const a = Math.min(1, b.life / 1.2) * 0.85;
    const grd = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, b.r); grd.addColorStop(0, 'rgba(150,6,14,' + a + ')'); grd.addColorStop(0.7, 'rgba(110,4,10,' + a * 0.9 + ')'); grd.addColorStop(1, 'rgba(90,0,6,0)');
    ctx.fillStyle = grd; ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    ctx.fillStyle = 'rgba(120,4,10,' + a + ')'; ctx.fillRect(b.x - 1.5, b.y, 3, Math.min(b.drip, 60)); ctx.beginPath(); ctx.arc(b.x, b.y + Math.min(b.drip, 60), 2.5, 0, 6.283); ctx.fill();
  }
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.font = 'bold 12px monospace';
  textShadow('РІВЕНЬ ' + level + '/' + MAX_LEVEL + '  ·  ' + DIFFS[diffIdx].name, 10, 18, '#e8e4ee');
  ctx.font = 'bold 11px monospace';
  textShadow(objectiveText(), 10, 33, exitOpen ? '#3ddc84' : '#ffd23f');
  if (shield > 0) { textShadow('ЗАХИСНЕ ПОЛЕ ' + shield.toFixed(1) + 'с', 10, 48, '#9ad8ff'); }
  ctx.textAlign = 'center'; ctx.font = 'bold 13px monospace';
  toasts.forEach((t, i) => { ctx.globalAlpha = Math.min(1, t.life * 2); textShadow(t.t, W / 2, 84 + i * 16, '#fff'); ctx.globalAlpha = 1; });
  const bb = bosses.filter(b => !b.dead && b.alert);
  if (bb.length) {
    const bw = 300, bx = W / 2 - bw / 2, hp = bb.reduce((s, b) => s + Math.max(0, b.hp), 0), mx = bb.reduce((s, b) => s + b.max, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(bx - 2, 40, bw + 4, 16); ctx.fillStyle = '#5a0e0e'; ctx.fillRect(bx, 42, bw, 12);
    ctx.fillStyle = '#e03a2a'; ctx.fillRect(bx, 42, bw * hp / mx, 12);
    ctx.font = 'bold 10px monospace'; textShadow(bb[0].name, W / 2, 38, '#ffd0c0');
  }
  ctx.textAlign = 'left';
  if (state === 'play') drawEnemyArrow();
}

// arrow around the crosshair pointing at the nearest remaining enemy (hidden when it is already on screen)
function drawEnemyArrow() {
  let best = null, bd = Infinity;
  for (const e of hintTargets()) { const d = Math.hypot(e.x - player.x, e.y - player.y); if (d < bd) { bd = d; best = e; } }
  if (!best) return;
  let rel = Math.atan2(best.y - player.y, best.x - player.x) - player.angle;
  rel = Math.atan2(Math.sin(rel), Math.cos(rel));
  if (Math.abs(rel) < 0.5 && los(player.x, player.y, best.x, best.y)) return;
  const R = 58, cx = W / 2 + Math.sin(rel) * R, cy = VH / 2 - Math.cos(rel) * R;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rel);
  ctx.globalAlpha = 0.6 + 0.3 * Math.sin(time * 6);
  ctx.fillStyle = '#ff9a3c'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(7, 5); ctx.lineTo(0, 1); ctx.lineTo(-7, 5); ctx.closePath(); ctx.stroke(); ctx.fill();
  ctx.restore();
  ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
  textShadow(Math.round(bd) + 'м', W / 2 + Math.sin(rel) * (R + 16), VH / 2 - Math.cos(rel) * (R + 16) + 4, '#ffbe7a');
  ctx.textAlign = 'left';
}

function centerText(t, y, sz, col) { ctx.font = 'bold ' + sz + 'px monospace'; ctx.textAlign = 'center'; textShadow(t, W / 2, y, col); ctx.textAlign = 'left'; }

function drawScreens() {
  if (state === 'play' && paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, VH);
    centerText('ПАУЗА', 140, 40, '#ffd23f');
    centerText('Клік, Enter, P або Esc: продовжити', 180, 14, '#ddd');
    centerText('M ' + soundLabel().toLowerCase() + ' · [ ] чутливість миші: ×' + sens + ' · F повний екран', 202, 12, '#9b94a8');
  } else if (state === 'dead') {
    ctx.fillStyle = 'rgba(80,0,0,0.65)'; ctx.fillRect(0, 0, W, VH);
    centerText('ВИ ЗАГИНУЛИ', 150, 40, '#ff5544');
    ctx.globalAlpha = screenReady() ? 1 : 0.35; centerText('Enter або клік: спробувати рівень знову', 190, 14, '#ddd'); ctx.globalAlpha = 1;
  } else if (state === 'complete') {
    ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, VH);
    centerText('РІВЕНЬ ' + level + ' ПРОЙДЕНО', 110, 34, '#3ddc84');
    centerText('Вороги: ' + killCount + '/' + totalEnemies + '   Час: ' + Math.floor(levelTime / 60) + ':' + String(Math.floor(levelTime % 60)).padStart(2, '0'), 160, 16, '#ddd');
    ctx.globalAlpha = screenReady() ? 1 : 0.35;
    centerText(level >= MAX_LEVEL ? 'Enter: фінал' : 'Enter: наступний рівень (+' + completeHeal() + ' здоров\'я)', 200, 14, '#ffd23f'); ctx.globalAlpha = 1;
  } else if (state === 'victory') {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, W, H);
    centerText('ПЕРЕМОГА!', 130, 46, '#ffd23f');
    centerText('Ви пройшли всі ' + MAX_LEVEL + ' рівнів і зупинили Серце Безодні.', 180, 14, '#ddd');
    ctx.globalAlpha = screenReady() ? 1 : 0.35; centerText('Складність: ' + DIFFS[diffIdx].name + '. Enter: на головний екран', 220, 14, '#3ddc84'); ctx.globalAlpha = 1;
  }
}

function drawTitle() {
  ctx.fillStyle = '#0d0c10'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { ctx.fillStyle = 'rgba(200,60,40,' + (0.05 + (i % 5) * 0.03) + ')'; ctx.fillRect((i * 83) % W, H - ((i * 37 + time * 24) % 220), 3, 3); }
  centerText('DOOM-LIKE', 96, 64, '#e2503c');
  centerText('30 рівнів · 27 монстрів · 10 видів зброї · 6 босів', 132, 15, '#e8e4ee');
  if (!player) player = newPlayer();
  drawFace(W / 2 - 35, 140, 70, 100);
  ctx.font = '11px monospace'; ctx.fillStyle = '#9b94a8'; ctx.fillText(soundLabel() + ' (M)', 10, 18);
  if (bestLevel > 0) { ctx.font = '11px monospace'; ctx.textAlign = 'right'; ctx.fillStyle = '#9b94a8'; ctx.fillText(bestLevel >= MAX_LEVEL ? 'Рекорд: гру пройдено' : 'Рекорд: рівень ' + bestLevel, W - 10, 18); ctx.textAlign = 'left'; }
  centerText(savedGame ? 'СКЛАДНІСТЬ НОВОЇ ГРИ' : 'СКЛАДНІСТЬ', 228, 12, '#9b94a8');
  for (let i = 0; i < 3; i++) {
    const b = BTN[i], on = i === diffIdx;
    ctx.fillStyle = on ? (i === 2 ? '#8a1e14' : i === 1 ? '#b88a1e' : '#2a7a4a') : '#1c1a22'; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = on ? '#fff' : '#4a4552'; ctx.lineWidth = on ? 2 : 1; ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    ctx.font = 'bold 15px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = on ? '#fff' : '#8a8494'; ctx.fillText(DIFFS[i].name, b.x + b.w / 2, b.y + 22); ctx.textAlign = 'left';
  }
  if (savedGame) {
    const armed = time < newGameArmT;
    const btn = (b, fill, stroke, label, col) => {
      ctx.fillStyle = fill; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
      ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText(label, b.x + b.w / 2, b.y + 18); ctx.textAlign = 'left';
    };
    btn(CONT_BTN, '#3a2a10', '#ffd23f', '▶ ПРОДОВЖИТИ: РІВЕНЬ ' + savedGame.level + ' · ' + DIFFS[savedGame.diffIdx].name, '#ffd23f');
    btn(NEW_BTN, armed ? '#5a140e' : '#1c1a22', armed ? '#ff6a50' : '#4a4552', armed ? 'ТОЧНО? ЩЕ РАЗ' : 'НОВА ГРА (N)', armed ? '#fff' : '#c8c2d2');
    ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = armed ? '#ff8a70' : '#7a7486';
    ctx.fillText(armed ? 'Нова гра перезапише збережений прогрес' : 'Enter: продовжити · N: нова гра', W / 2, 316); ctx.textAlign = 'left';
  } else centerText('Клік повз кнопки або Enter: почати', 296, 16, '#ffd23f');
  ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#9b94a8';
  ctx.fillText('WASD рух · миша або ←→ поворот · клік, Пробіл або Ctrl вогонь', W / 2, 330);
  ctx.fillText('1-9, 0 зброя · Q/E або колесо перемикання · R рестарт · Esc/P пауза · M гучність · F екран', W / 2, 344);
  ctx.fillText('Вбийте всіх або знайдіть ключ-кристал, потім дійдіть до порталу', W / 2, 358);
  ctx.fillText('Боси: рівні 5, 15, 25 (середні) та 10, 20, 30 (головні). На старті діє захисне поле', W / 2, 372);
  ctx.fillText('Патрони обмежені, бензопила без патронів', W / 2, 386);
  ctx.textAlign = 'left';
}

function render() {
  if (state === 'title') { drawTitle(); return; }
  renderWorld(); drawWeapon(); drawMinimap(); drawOverlays(); drawHud(); drawScreens();
}
