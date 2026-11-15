// Doom-like: touch-screen controls (phones / tablets).
// Classic script (works from file://); top-level names are shared with the other js/*.js files.
'use strict';

// ===================================================================
// Touch controls
// ===================================================================
// Left half of the view: a floating stick that appears where the finger lands (analog movement).
// Right half: drag to turn. Fire button (bottom right): hold to shoot; dragging it also turns, so you can aim while firing.
// HUD weapon slots are tappable; a pause button sits at the top centre. Everything is in canvas units (640x400).
const TOUCH = {
  STICK_R: 46, // stick travel radius
  DEAD: 0.18, // dead zone as a fraction of the radius
  LOOK: 0.011, // radians per canvas unit of horizontal drag (times the mouse sensitivity setting)
  FIRE: { x: W - 78, y: VH - 78, r: 40 },
  PAUSE: { x: W / 2 - 18, y: 6, w: 36, h: 28 },
  HINT: { x: 92, y: VH - 92 }, // where the idle stick is drawn as a hint
};
let touchOn = false; // set by the first touch; turns the on-screen controls on
const fingers = new Map(); // touch identifier -> { kind: 'stick' | 'look' | 'fire', x0, y0, x, y }

// movement from the stick: { f: forward, s: strafe right }, length 0..1; null when idle
function touchStick() {
  for (const t of fingers.values()) {
    if (t.kind !== 'stick') continue;
    const dx = t.x - t.x0,
      dy = t.y - t.y0,
      d = Math.hypot(dx, dy) / TOUCH.STICK_R;
    if (d < TOUCH.DEAD) return null;
    const k = Math.min(1, (d - TOUCH.DEAD) / (1 - TOUCH.DEAD)) / d / TOUCH.STICK_R;
    return { f: -dy * k, s: dx * k };
  }
  return null;
}
function touchFiring() {
  for (const t of fingers.values()) if (t.kind === 'fire') return true;
  return false;
}
function touchRelease() {
  fingers.clear();
}

const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
function weaponSlotAt(p) {
  for (let i = 0; i < 10; i++) {
    const sx = 148 + (i % 5) * 27,
      sy = VH + 12 + Math.floor(i / 5) * 23;
    if (p.x >= sx - 1 && p.x <= sx + 25 && p.y >= sy - 1 && p.y <= sy + 21) return i;
  }
  return -1;
}
// phones: go fullscreen (and landscape where the browser allows it) when a game starts from a tap
function touchFullscreen() {
  if (fullscreenEl()) return;
  toggleFullscreen();
  try {
    const o = screen.orientation;
    if (o && o.lock) o.lock('landscape').catch(() => {});
  } catch (err) {
    /* not supported (iOS) */
  }
}

function onTouchStart(e) {
  e.preventDefault(); // also suppresses the emulated mouse events, so input.js never sees these taps
  touchOn = true;
  audio();
  for (const ct of e.changedTouches) {
    const p = canvasPos(ct);
    if (state === 'title') {
      const was = state;
      titleClick(p);
      if (state !== was) touchFullscreen();
      continue;
    }
    if (state !== 'play') {
      advanceMenu();
      continue;
    }
    if (paused) {
      setPaused(false);
      continue;
    }
    if (inRect(p, TOUCH.PAUSE)) {
      setPaused(true);
      continue;
    }
    if (p.y >= VH) {
      const i = weaponSlotAt(p);
      if (i >= 0) selectWeapon(i);
      continue;
    }
    const kind =
      Math.hypot(p.x - TOUCH.FIRE.x, p.y - TOUCH.FIRE.y) <= TOUCH.FIRE.r * 1.25
        ? 'fire'
        : p.x < W / 2
          ? 'stick'
          : 'look';
    // only one stick at a time; a second finger on the left half just turns
    const k = kind === 'stick' && [...fingers.values()].some((t) => t.kind === 'stick') ? 'look' : kind;
    fingers.set(ct.identifier, { kind: k, x0: p.x, y0: p.y, x: p.x, y: p.y });
  }
}
function onTouchMove(e) {
  e.preventDefault();
  for (const ct of e.changedTouches) {
    const t = fingers.get(ct.identifier);
    if (!t) continue;
    const p = canvasPos(ct);
    if (t.kind !== 'stick' && state === 'play' && !paused) player.angle += (p.x - t.x) * TOUCH.LOOK * sens;
    t.x = p.x;
    t.y = p.y;
  }
}
function onTouchEnd(e) {
  e.preventDefault();
  audio(); // iOS unlocks audio on touchend
  for (const ct of e.changedTouches) fingers.delete(ct.identifier);
}
canvas.addEventListener('touchstart', onTouchStart, { passive: false });
canvas.addEventListener('touchmove', onTouchMove, { passive: false });
canvas.addEventListener('touchend', onTouchEnd, { passive: false });
canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

// on-screen controls, drawn over the view while playing on a touch device
function drawTouch() {
  if (!touchOn || state !== 'play' || paused) return;
  const circle = (x, y, r, fill, stroke) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };
  // stick: where the finger is, or a faint hint when idle
  let st = null;
  for (const t of fingers.values()) if (t.kind === 'stick') st = t;
  const bx = st ? st.x0 : TOUCH.HINT.x,
    by = st ? st.y0 : TOUCH.HINT.y;
  circle(
    bx,
    by,
    TOUCH.STICK_R,
    'rgba(255,255,255,' + (st ? 0.1 : 0.05) + ')',
    'rgba(255,255,255,' + (st ? 0.35 : 0.18) + ')',
  );
  let kx = bx,
    ky = by;
  if (st) {
    const dx = st.x - st.x0,
      dy = st.y - st.y0,
      d = Math.hypot(dx, dy),
      k = d > TOUCH.STICK_R ? TOUCH.STICK_R / d : 1;
    kx += dx * k;
    ky += dy * k;
  }
  circle(kx, ky, 18, 'rgba(255,255,255,' + (st ? 0.4 : 0.15) + ')');
  // fire button
  const F = TOUCH.FIRE,
    on = touchFiring();
  circle(F.x, F.y, F.r, on ? 'rgba(255,90,60,0.45)' : 'rgba(255,90,60,0.2)', 'rgba(255,160,140,0.6)');
  ctx.strokeStyle = 'rgba(255,230,220,0.85)';
  ctx.lineWidth = 2;
  circle(F.x, F.y, 11, null, 'rgba(255,230,220,0.85)');
  ctx.beginPath();
  ctx.moveTo(F.x - 20, F.y);
  ctx.lineTo(F.x - 6, F.y);
  ctx.moveTo(F.x + 6, F.y);
  ctx.lineTo(F.x + 20, F.y);
  ctx.moveTo(F.x, F.y - 20);
  ctx.lineTo(F.x, F.y - 6);
  ctx.moveTo(F.x, F.y + 6);
  ctx.lineTo(F.x, F.y + 20);
  ctx.stroke();
  // pause button
  const P = TOUCH.PAUSE;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(P.x, P.y, P.w, P.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(P.x + 0.5, P.y + 0.5, P.w - 1, P.h - 1);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(P.x + 12, P.y + 7, 4, 14);
  ctx.fillRect(P.x + 20, P.y + 7, 4, 14);
}
