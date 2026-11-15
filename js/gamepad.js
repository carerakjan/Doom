// Doom-like: gamepad controls (Gamepad API, "standard" mapping: Xbox / PlayStation / most USB and Bluetooth pads).
// Classic script (works from file://); top-level names are shared with the other js/*.js files.
'use strict';

// ===================================================================
// Gamepad
// ===================================================================
// Left stick / D-pad: move. Right stick: turn. RT: fire. LB / RB, Y: switch weapon.
// Start: pause / resume. Back (View / Share): sound volume. A / Start: confirm on menus; left / right picks difficulty on the title.
// The pad is polled once per frame from main.js (padPoll); browsers expose it only after a button is pressed.
const PAD = {
  DEAD: 0.2, // stick dead zone
  TURN: 3.2, // max turn speed, rad/s at full deflection (times the mouse sensitivity setting)
  TRIGGER: 0.3, // analog trigger threshold
};
const PAD_BTN = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  BACK: 8,
  START: 9,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15,
};
let pad = null, // the active gamepad snapshot for this frame
  padPrev = []; // button states last frame, for press edges

function padDead(v) {
  const a = Math.abs(v);
  return a < PAD.DEAD ? 0 : (Math.sign(v) * (a - PAD.DEAD)) / (1 - PAD.DEAD);
}
function padBtn(i) {
  const b = pad && pad.buttons[i];
  return !!b && (b.pressed || b.value > PAD.TRIGGER);
}
const padPressed = (i) => padBtn(i) && !padPrev[i];

// movement from the left stick (or D-pad): { f: forward, s: strafe right }, length 0..1; null when idle
function padStick() {
  if (!pad) return null;
  let s = padDead(pad.axes[0] || 0),
    f = -padDead(pad.axes[1] || 0);
  if (padBtn(PAD_BTN.UP)) f = 1;
  if (padBtn(PAD_BTN.DOWN)) f = -1;
  if (padBtn(PAD_BTN.LEFT)) s = -1;
  if (padBtn(PAD_BTN.RIGHT)) s = 1;
  if (!f && !s) return null;
  const len = Math.hypot(f, s);
  return len > 1 ? { f: f / len, s: s / len } : { f, s };
}
function padFiring() {
  return padBtn(PAD_BTN.RT); // not A: A also resumes from pause and must not fire straight away
}
// short rumble on pads that support it (Chrome / Edge: vibrationActuator)
function padRumble(strength, ms) {
  const va = pad && pad.vibrationActuator;
  if (!va || !va.playEffect) return;
  try {
    const r = va.playEffect('dual-rumble', {
      duration: ms,
      strongMagnitude: strength,
      weakMagnitude: strength * 0.6,
    });
    if (r && r.catch) r.catch(() => {});
  } catch (err) {
    /* not supported */
  }
}

function padPoll(dt) {
  let found = null;
  try {
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of list) if (g && g.connected && g.mapping === 'standard') found = found || g;
    if (!found) for (const g of list) if (g && g.connected) found = found || g;
  } catch (err) {
    /* gamepads blocked (e.g. by permissions policy) */
  }
  pad = found;
  if (!pad) {
    padPrev = [];
    return;
  }
  if (pad.buttons.some((b) => b.pressed)) audio();

  if (padPressed(PAD_BTN.BACK)) cycleSound();
  if (state === 'title') {
    const ax = pad.axes[0] || 0,
      axPrev = padPrev.ax || 0;
    if (padPressed(PAD_BTN.LEFT) || (ax < -0.6 && axPrev >= -0.6)) diffIdx = (diffIdx + 2) % 3;
    if (padPressed(PAD_BTN.RIGHT) || (ax > 0.6 && axPrev <= 0.6)) diffIdx = (diffIdx + 1) % 3;
    if (padPressed(PAD_BTN.A) || padPressed(PAD_BTN.START)) titleStart();
    else if (padPressed(PAD_BTN.X)) requestNewGame();
  } else if (state !== 'play') {
    if (padPressed(PAD_BTN.A) || padPressed(PAD_BTN.START)) advanceMenu();
  } else if (paused) {
    if (padPressed(PAD_BTN.START) || padPressed(PAD_BTN.A)) setPaused(false);
  } else {
    if (padPressed(PAD_BTN.START)) setPaused(true);
    if (padPressed(PAD_BTN.RB) || padPressed(PAD_BTN.Y)) cycleWeapon(1);
    if (padPressed(PAD_BTN.LB)) cycleWeapon(-1);
    const tx = padDead(pad.axes[2] || 0);
    // squared response: fine aim near the centre, fast turns at full deflection
    player.angle += Math.sign(tx) * tx * tx * PAD.TURN * sens * dt;
  }

  padPrev = pad.buttons.map((b) => b.pressed || b.value > PAD.TRIGGER);
  padPrev.ax = pad.axes[0] || 0;
}

// losing the pad mid-game pauses, like losing focus
addEventListener('gamepaddisconnected', () => {
  if (state === 'play' && !paused) setPaused(true);
});
