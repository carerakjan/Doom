// Doom-like: Sound effects and synthesized music.
// Classic script (works from file://); top-level names are shared with the other js/*.js files.
'use strict';

// ===================================================================
// Audio: sound effects + original synthesized rock/metal music
// ===================================================================
function soundGain() { return SOUND_STEPS[soundLvl] * SOUND_STEPS[soundLvl]; }
function soundLabel() { return soundLvl ? 'ЗВУК ' + Math.round(SOUND_STEPS[soundLvl] * 100) + '%' : 'ЗВУК ВИМКНЕНО'; }
function cycleSound() { soundLvl = (soundLvl + SOUND_STEPS.length - 1) % SOUND_STEPS.length; savePrefs(); toast(soundLabel(), 1.5); if (soundLvl) tone(440, 0.08, 'square', 0.05); }
let AC = null;
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = false; } }
  if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (e) { /* ignore */ } }
  return AC || null;
}
function tone(f, dur, type, vol, slideTo) {
  const a = audio(); if (!a || !soundLvl) return;
  vol = (vol || 0.05) * soundGain();
  try {
    // ramps need an explicit start event on the timeline; assigning .value is not one in every browser
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur);
  } catch (e) { /* ignore */ }
}
// one second of white noise, generated once; each burst plays a random slice of it with a linear fade-out
let sfxNoise = null;
function noise(dur, vol, hp) {
  const a = audio(); if (!a || !soundLvl) return;
  vol = (vol || 0.15) * soundGain();
  try {
    if (!sfxNoise) { sfxNoise = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = sfxNoise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter(), t = a.currentTime;
    s.buffer = sfxNoise; s.loop = true; f.type = 'lowpass'; f.frequency.value = hp || 3000;
    g.gain.setValueAtTime(vol, t); g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(f); f.connect(g); g.connect(a.destination); s.start(t, Math.random() * 0.9); s.stop(t + dur);
  } catch (e) { /* ignore */ }
}

// Music: original heavy rock/metal. Several riffs (picked by level), power chords through distortion, bass, drums, lead.
const music = (function () {
  let a = null, master, gtr, gL, gR, bass, drum, lead, noiseBuf, timer = null, step = 0, nextT = 0, mode = 'off', curMode = 'off';
  const N = m => 440 * Math.pow(2, (m - 69) / 12);
  const _ = null;
  // pat: 32 sixteenth steps (2 bars): number = palm-muted power chord (semitones from root), 'lN' = long ringing chord
  const RF = {
    title: { bpm: 92, pat: ['l0', _, _, _, _, _, _, _, 'l0', _, _, _, 'l-2', _, _, _, 'l-4', _, _, _, _, _, _, _, 'l-2', _, _, _, 'l3', _, _, _], k: 'x.......x.......', s: '....x.......x...', h: 'x...x...x...x...', lead: null },
    r0: { bpm: 140, pat: [0, 0, _, 0, 0, _, 0, 0, 3, 3, _, 3, 3, _, 5, 5, 0, 0, _, 0, 0, _, 0, 0, 6, 6, _, 5, 5, _, 3, 3], k: 'x..x..x.x..x..x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.xo', lead: [7, _, _, 7, 10, _, 12, _, 10, _, 7, _, 5, _, 3, _, 7, _, _, 7, 10, _, 12, 15, 14, _, 12, _, 10, _, 7, _] },
    r1: { bpm: 150, pat: [0, _, 0, 1, 0, _, 0, 3, 0, _, 0, 1, 0, _, 6, 5, 0, _, 0, 1, 0, _, 0, 3, -2, -2, 0, 0, 1, 1, 3, 3], k: 'x.x.x..xx.x.x..x', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', lead: [12, _, 11, _, 12, _, 15, _, 14, _, 12, _, 10, _, _, _, 12, _, 11, _, 12, _, 15, _, 17, _, 15, _, 14, _, 12, _] },
    r2: { bpm: 132, pat: ['l0', _, 0, _, 0, _, 'l3', _, 'l5', _, 3, _, 0, _, 'l-2', _, 'l0', _, 0, _, 0, _, 'l3', _, 'l6', _, 5, _, 3, _, 'l0', _], k: 'x...x.x...x.x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.xo', lead: [_, _, 10, _, 12, _, 15, _, 12, _, 10, _, 7, _, _, _, 10, _, 12, _, 15, _, 17, _, 19, _, 17, _, 15, _, 12, _] },
    r3: { bpm: 160, pat: [0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 6, 6, 5, 5], k: 'x.x.x.x.x.x.x.x.', s: '..x...x...x...x.', h: 'xxxxxxxxxxxxxxxx', lead: [19, _, _, 17, _, _, 15, _, 12, _, _, 10, _, _, 7, _, 19, _, _, 17, _, _, 15, _, 22, _, 19, _, 17, _, 15, _] },
    boss: { bpm: 168, pat: [0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 6, 5, 0, 0, 1, 0, 0, 0, 3, 0, -2, -2, 0, 0, 1, 1, 6, 6], k: 'xxx.xx.xxx.xx.x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.xo', lead: [12, _, 13, _, 12, _, 10, _, 12, _, 13, _, 15, _, _, _, 12, _, 13, _, 12, _, 10, _, 8, _, 10, _, 12, _, 13, _] },
  };
  function curve(k) { const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return c; }
  function init() {
    a = audio(); if (!a) return false;
    master = a.createGain(); master.gain.value = 0.4;
    const comp = a.createDynamicsCompressor(); master.connect(comp); comp.connect(a.destination);
    const ws = a.createWaveShaper(); ws.curve = curve(16); ws.oversample = '2x';
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
    gtr = a.createGain(); gtr.gain.value = 0.6; gtr.connect(ws); ws.connect(lp); lp.connect(master);
    gL = a.createStereoPanner ? a.createStereoPanner() : a.createGain(); gR = a.createStereoPanner ? a.createStereoPanner() : a.createGain();
    if (gL.pan) { gL.pan.value = -0.7; gR.pan.value = 0.7; } gL.connect(gtr); gR.connect(gtr);
    bass = a.createGain(); bass.gain.value = 0.6; const blp = a.createBiquadFilter(); blp.type = 'lowpass'; blp.frequency.value = 520; bass.connect(blp); blp.connect(master);
    drum = a.createGain(); drum.gain.value = 0.7; drum.connect(master);
    lead = a.createGain(); lead.gain.value = 0.5; lead.connect(ws);
    noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    nextT = a.currentTime + 0.1; timer = setInterval(tick, 30);
    return true;
  }
  function env(g, t, atk, dur, vol) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function chord(root, t, dur, vol) {
    for (const [pan, dets] of [[gL, [-9, 4, -3]], [gR, [8, -5, 3]]]) {
      const g = a.createGain(); env(g, t, 0.004, dur, vol * 0.62); g.connect(pan);
      const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(3400, t); f.frequency.exponentialRampToValueAtTime(dur < 0.3 ? 700 : 1800, t + dur); f.connect(g);
      [0, 7, 12].forEach((off, k) => { const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = N(root + off); o.detune.value = dets[k]; o.connect(f); o.start(t); o.stop(t + dur + 0.02); });
    }
  }
  function bassNote(m, t, dur) { const g = a.createGain(); env(g, t, 0.004, Math.max(0.08, dur), 0.45); g.connect(bass); const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = N(m); o.connect(g); o.start(t); o.stop(t + Math.max(0.08, dur) + 0.05); }
  function kick(t) { const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); env(g, t, 0.002, 0.22, 0.95); o.connect(g); g.connect(drum); o.start(t); o.stop(t + 0.24); }
  function nz(t, dur, freq, type, vol) { const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; env(g, t, 0.001, dur, vol); s.connect(f); f.connect(g); g.connect(drum); s.start(t); s.stop(t + dur + 0.02); }
  function snare(t) { nz(t, 0.16, 1800, 'bandpass', 0.6); const o = a.createOscillator(), g = a.createGain(); o.type = 'triangle'; o.frequency.value = 190; env(g, t, 0.002, 0.1, 0.4); o.connect(g); g.connect(drum); o.start(t); o.stop(t + 0.12); }
  function hat(t, open) { nz(t, open ? 0.12 : 0.04, 7000, 'highpass', open ? 0.22 : 0.14); }
  function leadNote(m, t, dur, vol) {
    const g = a.createGain(); env(g, t, 0.01, Math.max(0.1, dur), vol || 0.16); g.connect(lead);
    const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(N(m) * 0.94, t); o.frequency.exponentialRampToValueAtTime(N(m), t + 0.07); o.connect(g); o.start(t); o.stop(t + dur + 0.05);
    const v = a.createOscillator(), vg = a.createGain(); v.frequency.value = 5.5; vg.gain.value = 6; v.connect(vg); vg.connect(o.detune); v.start(t); v.stop(t + dur + 0.05);
  }
  function playStep(s, t, sd) {
    const R = RF[curMode], si = s % 32, sec = Math.floor(s / 32) % 4, tr = [0, 0, -2, 3][sec], root = 40 + tr, v = R.pat[si], c16 = si % 16;
    if (v !== null) { const lg = typeof v === 'string', off = lg ? parseInt(v.slice(1), 10) : v; chord(root + off, t, lg ? sd * 7 : sd * 0.9, lg ? 0.26 : 0.22); bassNote(root + off - 12, t, lg ? sd * 7 : sd * 0.9); }
    if (R.k[c16] === 'x') kick(t);
    const fill = sec === 3 && si >= 26 && curMode !== 'title';
    if (R.s[c16] === 'x' || (fill && si % 2 === 0)) snare(t);
    if (fill && si >= 28) kick(t);
    if (R.h[c16] !== '.') hat(t, R.h[c16] === 'o');
    if (si === 0 && (sec === 0 || sec === 2)) nz(t, 1.1, 5200, 'highpass', 0.3);
    if (R.lead && sec % 2 === 1) { const ld = R.lead[si]; if (ld !== null) { leadNote(64 + tr + ld, t, sd * 2, 0.15); leadNote(76 + tr + ld, t, sd * 2, 0.05); leadNote(71 + tr + ld, t, sd * 2, 0.06); } }
  }
  function tick() {
    if (!a) return;
    if (a.state === 'suspended') { try { a.resume(); } catch (e) { /* ignore */ } return; }
    master.gain.setTargetAtTime(!soundLvl || mode === 'off' ? 0 : 0.4 * soundGain(), a.currentTime, 0.08);
    if (mode === 'off') { nextT = Math.max(nextT, a.currentTime + 0.1); return; }
    if (curMode !== mode) { curMode = mode; step = 0; nextT = a.currentTime + 0.1; }
    const sd = 60 / RF[curMode].bpm / 4;
    // setInterval is throttled in background tabs; drop the missed steps instead of firing them all at once
    if (nextT < a.currentTime) nextT = a.currentTime + 0.05;
    // muted: keep the clock running (so unmuting resumes in time) but create no nodes
    while (nextT < a.currentTime + 0.2) { if (soundLvl) playStep(step, nextT, sd); step++; nextT += sd; }
  }
  return { setMode(m) { mode = m; if (!a && AC) init(); }, init };
})();
