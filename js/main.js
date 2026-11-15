// Doom-like: Main loop and the debug/test hook (window.__doom).
// Classic script (works from file://); top-level names are shared with the other js/*.js files.
'use strict';

// ===================================================================
// Loop
// ===================================================================
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  padPoll(dt);
  const isPaused = state === 'play' && paused;
  if (state === 'title') time += dt;
  else if (!isPaused) update(dt);
  const bossFight = state === 'play' && bosses.some((b) => !b.dead && b.alert);
  music.setMode(
    state === 'dead' || isPaused ? 'off' : state === 'play' ? (bossFight ? 'boss' : 'r' + ((level - 1) % 4)) : 'title',
  );
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__doom = {
  genLevel,
  startLevel,
  newGame,
  update,
  render,
  bfsGrid,
  DEFS,
  TYPES,
  MAX_LEVEL,
  keys,
  MON_TEX,
  WEAPONS,
  MAX_AMMO,
  setDiff(i) {
    diffIdx = i;
  },
  get paused() {
    return paused;
  },
  get state() {
    return state;
  },
  set state(v) {
    state = v;
  },
  get player() {
    return player;
  },
  get enemies() {
    return enemies;
  },
  get L() {
    return L;
  },
  get level() {
    return level;
  },
  get hasKey() {
    return hasKey;
  },
  get exitOpen() {
    return exitOpen;
  },
  get shield() {
    return shield;
  },
  set shield(v) {
    shield = v;
  },
  get parts() {
    return parts.length;
  },
  get pballs() {
    return pballs.length;
  },
  get decals() {
    return decals.length;
  },
  get corpses() {
    return corpses;
  },
};
