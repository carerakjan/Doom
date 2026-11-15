// Doom-like: Keyboard and mouse input.
// Classic script (works from file://); top-level names are shared with the other js/*.js files.
'use strict';

// ===================================================================
// Input
// ===================================================================
const BTN = [0, 1, 2].map((i) => ({ x: W / 2 - 215 + i * 150, y: 236, w: 136, h: 34 }));
const CONT_BTN = { x: W / 2 - 215, y: 274, w: 286, h: 28 },
  NEW_BTN = { x: W / 2 + 79, y: 274, w: 136, h: 28 };
function canvasPos(e) {
  // the drawn image may be letterboxed inside the element (object-fit: contain in fullscreen)
  const r = canvas.getBoundingClientRect(),
    k = Math.min(r.width / W, r.height / H);
  const ox = r.left + (r.width - W * k) / 2,
    oy = r.top + (r.height - H * k) / 2;
  return { x: (e.clientX - ox) / k, y: (e.clientY - oy) / k };
}
function fullscreenEl() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}
function toggleFullscreen() {
  try {
    if (fullscreenEl()) {
      const x = document.exitFullscreen || document.webkitExitFullscreen;
      if (x) {
        const r = x.call(document);
        if (r && r.catch) r.catch(() => {});
      }
    } else {
      const q = canvas.requestFullscreen || canvas.webkitRequestFullscreen;
      if (q) {
        const r = q.call(canvas);
        if (r && r.catch) r.catch(() => {});
      }
    }
  } catch (err) {
    /* fullscreen not allowed here (e.g. inside an iframe) */
  }
}

addEventListener('keydown', (e) => {
  keys[e.code] = true;
  audio();
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  // held keys stay in `keys` for movement/fire, but auto-repeat must not trigger one-shot actions
  // (otherwise holding Space to shoot skips the death / level-complete screens instantly)
  if (e.repeat) return;
  if (e.code === 'KeyF') toggleFullscreen();
  if (e.code === 'KeyM') cycleSound();
  if (state === 'play' && (e.code === 'BracketLeft' || e.code === 'Minus')) changeSens(-1);
  if (state === 'play' && (e.code === 'BracketRight' || e.code === 'Equal')) changeSens(1);
  if (state === 'play' && paused) {
    // Esc can also arrive right after the browser released pointer lock (which already paused us): don't undo that
    if (e.code === 'KeyP' || e.code === 'Enter' || (e.code === 'Escape' && performance.now() - pausedAt > 300))
      setPaused(false);
    return;
  }
  if (state === 'play' && (e.code === 'KeyP' || e.code === 'Escape')) {
    setPaused(true);
    return;
  }
  if (state === 'title') {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') diffIdx = (diffIdx + 2) % 3;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') diffIdx = (diffIdx + 1) % 3;
    if (e.code === 'Digit1') diffIdx = 0;
    if (e.code === 'Digit2') diffIdx = 1;
    if (e.code === 'Digit3') diffIdx = 2;
    if (e.code === 'Enter' || e.code === 'Space') titleStart();
    if (e.code === 'KeyN') requestNewGame();
    return;
  }
  if (e.code === 'Enter' || e.code === 'Space') advanceMenu();
  if (state === 'play') {
    if (e.code === 'Digit1') selectWeapon(0);
    if (e.code === 'Digit2') selectWeapon(1);
    if (e.code === 'Digit3') selectWeapon(2);
    if (e.code === 'Digit4') selectWeapon(3);
    for (let k = 5; k <= 9; k++) if (e.code === 'Digit' + k) selectWeapon(k - 1);
    if (e.code === 'Digit0') selectWeapon(9);
    if (e.code === 'KeyQ') cycleWeapon(-1);
    if (e.code === 'KeyE') cycleWeapon(1);
  }
  if (e.code === 'KeyR' && (state === 'play' || state === 'dead')) startLevel(level, true, true);
});
addEventListener('keyup', (e) => {
  keys[e.code] = false;
});
function lockPointer() {
  if (document.pointerLockElement === canvas || !canvas.requestPointerLock) return;
  try {
    const r = canvas.requestPointerLock();
    if (r && r.catch) r.catch(() => {});
  } catch (err) {
    /* optional */
  }
}
canvas.addEventListener('mousedown', (e) => {
  audio();
  // a click that resumes the game must not also fire the weapon
  if (state === 'play' && paused) {
    setPaused(false);
    lockPointer();
    e.preventDefault();
    return;
  }
  mouseDown = true;
  if (state === 'title') {
    const p = canvasPos(e);
    const inBtn = (b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
    for (let i = 0; i < 3; i++)
      if (inBtn(BTN[i])) {
        diffIdx = i;
        e.preventDefault();
        return;
      }
    // with a save, only the two buttons start a game; without one, a click anywhere starts as before
    if (!savedGame) newGame();
    else if (inBtn(CONT_BTN)) continueGame();
    else if (inBtn(NEW_BTN)) requestNewGame();
    e.preventDefault();
    return;
  }
  if (!advanceMenu()) lockPointer();
  e.preventDefault();
});
addEventListener('mouseup', () => {
  mouseDown = false;
});
// keyup / mouseup never arrive while the window is unfocused, so drop all held input on focus loss
function releaseInput() {
  for (const k in keys) keys[k] = false;
  mouseDown = false;
}
function setPaused(v) {
  paused = v;
  releaseInput();
  if (v) {
    pausedAt = performance.now();
    shake = 0;
    if (document.pointerLockElement === canvas && document.exitPointerLock) document.exitPointerLock();
  }
}
// focus loss / hidden tab / losing pointer lock (Esc in the browser) all pause a running game
addEventListener('blur', () => {
  releaseInput();
  if (state === 'play') setPaused(true);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    releaseInput();
    if (state === 'play') setPaused(true);
  }
});
const onFsChange = () => {
  if (!fullscreenEl() && state === 'play' && !paused) setPaused(true);
};
document.addEventListener('fullscreenchange', onFsChange);
document.addEventListener('webkitfullscreenchange', onFsChange);
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== canvas && state === 'play' && !paused) setPaused(true);
});
addEventListener('mousemove', (e) => {
  if (document.pointerLockElement === canvas && state === 'play' && !paused)
    player.angle += e.movementX * MOUSE_BASE * sens;
});
canvas.addEventListener(
  'wheel',
  (e) => {
    if (state === 'play' && !paused) {
      cycleWeapon(e.deltaY > 0 ? 1 : -1);
      e.preventDefault();
    }
  },
  { passive: false },
);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function advanceMenu() {
  if (state === 'title') {
    titleStart();
    return true;
  }
  if (state === 'dead') {
    if (screenReady()) startLevel(level, true, true);
    return true;
  }
  if (state === 'complete') {
    if (!screenReady()) return true;
    if (level >= MAX_LEVEL) {
      showScreen('victory');
      return true;
    }
    player.hp = Math.min(100, player.hp + completeHeal());
    startLevel(level + 1, false);
    return true;
  }
  if (state === 'victory') {
    if (screenReady()) state = 'title';
    return true;
  }
  return false;
}
function completeHeal() {
  return Math.round(25 * DIFFS[diffIdx].heal);
}
function selectWeapon(i) {
  const w = WEAPONS[i];
  if (!player.own[w.id]) {
    toast('ЦІЄЇ ЗБРОЇ ЩЕ НЕМАЄ');
    return;
  }
  if (player.weapon !== i) {
    player.weapon = i;
    cooldown = Math.max(cooldown, 0.25);
    switchT = 0.25;
    tone(220, 0.06, 'square', 0.03, 330);
  }
}
function cycleWeapon(dir) {
  let i = player.weapon;
  const nw = WEAPONS.length;
  for (let k = 0; k < nw; k++) {
    i = (i + dir + nw) % nw;
    if (player.own[WEAPONS[i].id]) {
      selectWeapon(i);
      return;
    }
  }
}
