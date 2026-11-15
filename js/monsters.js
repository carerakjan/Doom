// Doom-like: Monster sprites (painted procedurally) and monster definitions.
// Classic script (works from file://); top-level names are shared with the other js/*.js files.
'use strict';

// ===================================================================
// Monster sprites (all original designs; roles inspired by classic shooters)
// ===================================================================
// Shared shape helpers bound to a 2D context: E ellipse, R rect, P polygon (flat x,y list), Ln line.
function painter(g) {
  return {
    E: (x, y, rx, ry, col) => {
      g.fillStyle = col;
      g.beginPath();
      g.ellipse(x, y, rx, ry, 0, 0, 6.283);
      g.fill();
    },
    R: (x, y, w, h, col) => {
      g.fillStyle = col;
      g.fillRect(x, y, w, h);
    },
    P: (pts, col) => {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
      g.closePath();
      g.fill();
    },
    Ln: (x1, y1, x2, y2, col, w) => {
      g.strokeStyle = col;
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
    },
  };
}
// Redesigned silhouettes: distinct, original shapes for the signature monsters and bosses.
function paintRedesign(type, f, g) {
  const bob = f === 1 ? 2 : 0,
    atk = f === 2;
  const { E, R, P, Ln } = painter(g);
  const legA = f === 1 ? 7 : 11,
    legB = f === 1 ? 11 : 7;
  switch (type) {
    case 'imp': // winged gargoyle
      P([32, 28, 2, 10 + bob, 8, 44], '#2e4650');
      P([32, 28, 62, 10 + bob, 56, 44], '#2e4650');
      P([32, 30, 6, 18, 12, 46], '#3a5662');
      P([32, 30, 58, 18, 52, 46], '#3a5662');
      R(23, 62 - legA, 8, legA, '#2a3c44');
      R(34, 62 - legB, 8, legB, '#2a3c44');
      E(32, 42 + bob, 13, 16, '#4a6670');
      E(32, 46 + bob, 8, 10, '#6a8892');
      if (atk) {
        R(14, 22, 5, 20, '#4a6670');
        E(15, 20, 7, 7, '#ffb030');
        E(15, 20, 3.5, 3.5, '#fff2a8');
        R(45, 28, 5, 16, '#4a6670');
      } else {
        R(16, 38 + bob, 5, 14, '#4a6670');
        R(43, 38 + bob, 5, 14, '#4a6670');
        P([15, 52 + bob, 18, 59, 21, 52 + bob], '#e8e4d0');
        P([43, 52 + bob, 46, 59, 49, 52 + bob], '#e8e4d0');
      }
      P([24, 20 + bob, 12, 8 + bob, 24, 27 + bob], '#4a6670');
      P([40, 20 + bob, 52, 8 + bob, 40, 27 + bob], '#4a6670');
      E(32, 24 + bob, 9, 9, '#5a7882');
      R(26, 22 + bob, 4, 2, '#ffa030');
      R(34, 22 + bob, 4, 2, '#ffa030');
      R(28, 29 + bob, 8, 2, '#1a0a0a');
      P([29, 29 + bob, 30, 33 + bob, 31, 29 + bob], '#fff');
      P([33, 29 + bob, 34, 33 + bob, 35, 29 + bob], '#fff');
      break;
    case 'bull': // armored boar
      R(14, 50 - (f === 1 ? 3 : 0), 8, 12, '#2a2218');
      R(24, 50, 8, 12 - (f === 1 ? 0 : 3), '#2a2218');
      R(34, 50 - (f === 1 ? 0 : 3), 8, 12, '#2a2218');
      R(44, 50, 8, 12 - (f === 1 ? 3 : 0), '#2a2218');
      E(34, 40 + bob, 24, 15, '#6a5642');
      for (let i = 0; i < 6; i++) P([14 + i * 8, 30 + bob, 17 + i * 8, 19 + bob, 20 + i * 8, 30 + bob], '#2a2218');
      E(21, 25, 4, 5, '#5a4634');
      E(43, 25, 4, 5, '#5a4634');
      E(32, 32 + bob, 14, 12, '#7a6450');
      E(32, 39 + bob, 8, 6, '#a08468');
      E(29, 39 + bob, 1.5, 1.8, '#2a1a14');
      E(35, 39 + bob, 1.5, 1.8, '#2a1a14');
      P([23, 40 + bob, 18, 28 + bob, 27, 37 + bob], '#f2ecd8');
      P([41, 40 + bob, 46, 28 + bob, 37, 37 + bob], '#f2ecd8');
      E(26, 29 + bob, 2.2, 2.2, '#ff3a2a');
      E(38, 29 + bob, 2.2, 2.2, '#ff3a2a');
      if (atk) R(28, 42 + bob, 8, 4, '#2a0a0a');
      break;
    case 'lord': // steel-blue armored warlord with golden horns
      R(21, 62 - legA - 3, 10, legA + 3, '#1c2040');
      R(34, 62 - legB - 3, 10, legB + 3, '#1c2040');
      P([5, 30 + bob, 11, 20 + bob, 15, 34 + bob], '#d9a73a');
      P([59, 30 + bob, 53, 20 + bob, 49, 34 + bob], '#d9a73a');
      if (atk) {
        R(5, 12, 8, 24, '#2c3560');
        R(51, 12, 8, 24, '#2c3560');
        E(9, 10, 7, 7, '#7ae8ff');
        E(55, 10, 7, 7, '#7ae8ff');
        E(9, 10, 3, 3, '#fff');
        E(55, 10, 3, 3, '#fff');
      } else {
        R(6, 28 + bob, 8, 26, '#2c3560');
        R(50, 28 + bob, 8, 26, '#2c3560');
        P([6, 54 + bob, 10, 62, 14, 54 + bob], '#d9a73a');
        P([50, 54 + bob, 54, 62, 58, 54 + bob], '#d9a73a');
      }
      P([16, 22 + bob, 48, 22 + bob, 52, 54, 12, 54], '#2c3560');
      P([22, 26 + bob, 42, 26 + bob, 44, 50, 20, 50], '#4a5a96');
      E(32, 38 + bob, 5, 5, atk ? '#ffd23f' : '#7ae8ff');
      E(32, 38 + bob, 2, 2, '#fff');
      P([20, 12, 8, 0, 18, 22], '#d9a73a');
      P([44, 12, 56, 0, 46, 22], '#d9a73a');
      E(32, 14 + bob, 11, 10, '#8a8fb0');
      R(23, 12 + bob, 18, 5, '#101830');
      R(26, 13 + bob, 4, 2, '#7ae8ff');
      R(34, 13 + bob, 4, 2, '#7ae8ff');
      R(26, 21 + bob, 12, 5, '#6a6f90');
      break;
    case 'mancubus': // bloated toad with arm cannons
      R(20, 60, 8, 4, '#2a3a1a');
      R(36, 60, 8, 4, '#2a3a1a');
      E(32, 42 + bob, 25, 20, '#5a7a3a');
      E(32, 46 + bob, 17, 13, '#a8c27a');
      R(2, 30 + bob, 14, 11, '#3a3a42');
      R(48, 30 + bob, 14, 11, '#3a3a42');
      E(3, 35 + bob, atk ? 6 : 3, atk ? 6 : 3, atk ? '#ffb030' : '#ff6a1a');
      E(61, 35 + bob, atk ? 6 : 3, atk ? 6 : 3, atk ? '#ffb030' : '#ff6a1a');
      E(32, 22 + bob, 14, 8, '#6a8a46');
      E(23, 15 + bob, 5, 5, '#ffe060');
      E(41, 15 + bob, 5, 5, '#ffe060');
      E(23, 15 + bob, 1.6, 4, '#111');
      E(41, 15 + bob, 1.6, 4, '#111');
      R(22, 26 + bob, 20, 2, '#1a2a0a');
      if (atk) R(26, 27 + bob, 12, 4, '#2a0a0a');
      break;
    case 'skeleton': {
      // bone knight with a shoulder cannon
      const bn = '#e8e4d0',
        bd = '#9a9684';
      P([22, 30 + bob, 10, 58, 24, 52, 32, 60, 40, 52, 54, 58, 42, 30 + bob], '#3a2a40');
      R(23, 62 - legA, 4, legA, bn);
      R(37, 62 - legB, 4, legB, bn);
      R(21, 60, 8, 3, bd);
      R(35, 60, 8, 3, bd);
      R(24, 34 + bob, 16, 18, bd);
      for (let i = 0; i < 4; i++) R(22, 36 + i * 4 + bob, 20, 2, bn);
      R(31, 34 + bob, 2, 18, bn);
      E(32, 24 + bob, 9, 9, '#8a8e9a');
      R(25, 22 + bob, 14, 4, '#15151a');
      E(28, 24 + bob, 1.4, 1.4, '#ff3b1a');
      E(36, 24 + bob, 1.4, 1.4, '#ff3b1a');
      R(26, 29 + bob, 12, 4, bn);
      R(38, 14 + bob, 20, 10, '#4a4a52');
      R(56, 15 + bob, 6, 8, atk ? '#ffb030' : '#c0301a');
      if (atk) E(62, 19, 3, 3, '#fff2a8');
      R(14, 30 + bob, 3, 20, bn);
      R(47, 30 + bob, 3, 14, bn);
      break;
    }
    case 'spawner': // pulsating hive pod
      for (let i = 0; i < 5; i++) Ln(8 + i * 12, 63, 14 + i * 9, 46, '#3a2a46', 3);
      E(32, 32 + bob, 22, 21, '#5a4a6a');
      E(32, 28 + bob, 16, 13, '#7a6a8a');
      for (const [x, y, s] of [
        [22, 24, 1],
        [41, 26, 0],
        [32, 16, 1],
        [26, 38, 0],
        [39, 39, 1],
      ]) {
        E(x, y + bob, 4.5, 4, '#1a1020');
        if (s) E(x, y + bob, 1.8, 1.8, '#ece6d0');
      }
      for (let i = 0; i < 4; i++) Ln(14 + i * 12, 20 + bob, 18 + i * 9, 48, 'rgba(40,20,50,0.7)', 1.4);
      if (atk) {
        E(32, 46 + bob, 9, 6, '#1a1020');
        E(32, 45 + bob, 4, 4, '#ece6d0');
      }
      break;
    case 'necro': // cloaked mask-bearer with a staff
      P([32, 8 + bob, 6, 62, 58, 62], '#1a1830');
      P([32, 14 + bob, 18, 62, 46, 62], '#2a2850');
      Ln(50, 22, 53, 62, '#6a4a30', 2.5);
      E(50, 18 + bob, 5, 5, atk ? '#ff5aff' : '#9a5aff');
      if (atk) {
        R(8, 20, 6, 22, '#2a2850');
        E(11, 18, 6, 6, '#ff7a1a');
        E(11, 18, 3, 3, '#fff2a8');
      } else R(12, 34 + bob, 6, 18, '#2a2850');
      E(32, 20 + bob, 10, 10, '#1a1830');
      E(32, 22 + bob, 6.5, 7.5, '#e8e8f0');
      R(28, 20 + bob, 3, 2, '#46e6ff');
      R(33, 20 + bob, 3, 2, '#46e6ff');
      R(30, 27 + bob, 4, 2, '#555');
      break;
    case 'titan': // heavy walker with rocket pods
      R(16, 44, 14, 20 - (f === 1 ? 3 : 0), '#4a5060');
      R(34, 44, 14, 20 - (f === 1 ? 0 : 3), '#4a5060');
      R(13, 60, 19, 4, '#2a2e36');
      R(32, 60, 19, 4, '#2a2e36');
      R(12, 18 + bob, 40, 30, '#5a6070');
      for (let i = 0; i < 5; i++) R(14 + i * 8, 44 + bob, 4, 4, '#e0b020');
      R(20, 22 + bob, 24, 18, '#7a8090');
      E(32, 31 + bob, 5, 5, atk ? '#ffd23f' : '#ff7a1a');
      E(32, 31 + bob, 2, 2, '#fff2a8');
      E(32, 14 + bob, 10, 7, '#6a7080');
      R(23, 13 + bob, 18, 3, '#ff3b1a');
      R(1, 14 + bob, 13, 18, '#3a3e48');
      R(50, 14 + bob, 13, 18, '#3a3e48');
      for (let i = 0; i < 3; i++) {
        E(7, 18 + i * 5 + bob, 2, 2, atk ? '#ffb030' : '#c0301a');
        E(57, 18 + i * 5 + bob, 2, 2, atk ? '#ffb030' : '#c0301a');
      }
      R(3, 34 + bob, 8, 18, '#4a5060');
      R(53, 34 + bob, 8, 18, '#4a5060');
      break;
    case 'heart': // pulsating biomechanical heart
      for (let i = 0; i < 5; i++) Ln(10 + i * 11, 64, 16 + i * 8, 42, '#4a4a54', 3.5);
      R(26, 4, 5, 18, '#5a1230');
      R(34, 7, 5, 15, '#5a1230');
      R(18, 10, 4, 14, '#5a1230');
      E(22, 30, 16, 17, '#7a1a3e');
      E(42, 30, 16, 17, '#7a1a3e');
      P([7, 34, 57, 34, 32, 61], '#6a1434');
      E(17, 23, 5, 8, '#a8305a');
      E(39, 23, 5, 8, '#a8305a');
      for (let i = 0; i < 6; i++) Ln(10 + i * 9, 20 + (i % 2) * 8, 14 + i * 7, 52, '#4a0c24', 1.5);
      R(5, 28, 54, 4, '#6a6a74');
      R(8, 41, 48, 3, '#6a6a74');
      for (let i = 0; i < 6; i++) {
        E(9 + i * 9.2, 30, 1.2, 1.2, '#aaa');
      }
      E(32, 36, atk ? 10 : 8, atk ? 10 : 8, atk ? '#fff6c0' : '#ff9a2a');
      E(32, 36, 4, 4, '#fff');
      break;
    case 'general': {
      // domed mech-spider
      const col = '#3a3a4a',
        glow = '#ff3b1a';
      for (let i = 0; i < 4; i++) {
        const o = (i + f) % 2 ? 3 : -3;
        Ln(24, 38, 6 + i * 4 + o, 52 + o * 0.5, col, 4);
        Ln(6 + i * 4 + o, 52 + o * 0.5, 4 + i * 4, 62, col, 3);
        Ln(40, 38, 58 - i * 4 - o, 52 - o * 0.5, col, 4);
        Ln(58 - i * 4 - o, 52 - o * 0.5, 60 - i * 4, 62, col, 3);
      }
      E(32, 38 + bob, 16, 11, col);
      E(32, 35 + bob, 11, 6, '#5a5a6a');
      R(18, 14 + bob, 4, 18, '#222');
      R(42, 14 + bob, 4, 18, '#222');
      R(30, 6 + bob, 4, 20, '#222');
      E(32, 25 + bob, 10, 9, 'rgba(140,210,255,0.6)');
      E(32, 26 + bob, 4, 4, glow);
      if (atk) {
        E(20, 12, 4, 4, glow);
        E(44, 12, 4, 4, glow);
        E(32, 5, 4, 4, glow);
      }
      break;
    }
    case 'bat': {
      // winged swarm flyer
      const fl = f === 1 ? 6 : -2;
      P([32, 26, 2, 14 + fl, 10, 40], '#3a2a4a');
      P([32, 26, 62, 14 + fl, 54, 40], '#3a2a4a');
      P([32, 28, 10, 26 + fl, 16, 44], '#52386a');
      P([32, 28, 54, 26 + fl, 48, 44], '#52386a');
      E(32, 36, 8, 10, '#2a1c38');
      P([26, 22, 24, 12, 31, 20], '#2a1c38');
      P([38, 22, 40, 12, 33, 20], '#2a1c38');
      E(32, 27, 7, 6, '#3a2a4a');
      E(29, 26, 1.6, 1.6, '#ff4a4a');
      E(35, 26, 1.6, 1.6, '#ff4a4a');
      if (atk) {
        R(29, 30, 6, 4, '#1a0a0a');
        P([30, 30, 31, 34, 32, 30], '#fff');
        P([33, 30, 34, 34, 35, 30], '#fff');
      }
      break;
    }
    case 'ghoul': // hunched crawler with long arms
      R(22, 62 - legA, 6, legA, '#4a5a3a');
      R(36, 62 - legB, 6, legB, '#4a5a3a');
      E(32, 40 + bob, 12, 14, '#7a8a5a');
      E(32, 44 + bob, 7, 8, '#a0aa80');
      R(10, 34 + bob, 6, 26, '#6a7a4a');
      R(48, 34 + bob, 6, 26, '#6a7a4a');
      P([8, 60, 12, 64, 16, 60], '#d8d4b8');
      P([48, 60, 52, 64, 56, 60], '#d8d4b8');
      E(32, 24 + bob, 9, 9, '#8a9a68');
      E(28, 23 + bob, 2.2, 2.2, '#ffe040');
      E(36, 23 + bob, 2.2, 2.2, '#ffe040');
      R(26, 29 + bob, 12, 3, '#2a0a0a');
      if (atk) R(27, 29, 10, 6, '#2a0a0a');
      break;
    case 'leaper': // lean blade-armed jumper
      E(32, 44 + bob, 14, 12, '#2a5a6a');
      P([18, 52, 8, 62, 22, 62], '#1e4452');
      P([46, 52, 56, 62, 42, 62], '#1e4452');
      E(32, 30 + bob, 8, 10, '#3a7a8a');
      E(32, 20 + bob, 8, 7, '#4a8a9a');
      R(26, 19 + bob, 5, 2, '#ffee40');
      R(33, 19 + bob, 5, 2, '#ffee40');
      P([22, 32 + bob, 6, atk ? 14 : 22, 20, 40 + bob], '#d8e4ea');
      P([42, 32 + bob, 58, atk ? 14 : 22, 44, 40 + bob], '#d8e4ea');
      if (atk) R(28, 24, 8, 4, '#1a0a0a');
      break;
    case 'bomber': // walking powder keg
      R(23, 62 - legA, 7, legA, '#3a3a2a');
      R(34, 62 - legB, 7, legB, '#3a3a2a');
      E(32, 42 + bob, 15, 17, '#8a6a3a');
      for (let i = 0; i < 3; i++) R(18, 36 + i * 7 + bob, 28, 3, '#3a2a1a');
      for (let i = 0; i < 3; i++) {
        R(21 + i * 9, 40 + bob, 6, 12, '#c03a2a');
        R(21 + i * 9, 40 + bob, 6, 2, '#ffd040');
      }
      E(32, 24 + bob, 9, 9, '#c8a878');
      R(26, 22 + bob, 4, 3, '#111');
      R(34, 22 + bob, 4, 3, '#111');
      R(27, 28 + bob, 10, 3, '#4a1a10');
      R(31, 8 + bob, 2, 8, '#5a4a2a');
      E(32, 7 + bob, atk ? 4 : 2.4, atk ? 4 : 2.4, atk ? '#fff6a0' : '#ff9a2a');
      R(8, 38 + bob, 6, 16, '#8a6a3a');
      R(50, 38 + bob, 6, 16, '#8a6a3a');
      break;
    case 'sniper': // hooded cultist with a long rifle
      P([32, 10 + bob, 14, 62, 50, 62], '#2a1a1a');
      P([32, 14 + bob, 22, 62, 42, 62], '#4a2a24');
      E(32, 20 + bob, 8, 9, '#1a1010');
      E(32, 22 + bob, 5, 5, '#c8a080');
      R(28, 21 + bob, 3, 2, '#ff3a3a');
      R(34, 21 + bob, 3, 2, '#ff3a3a');
      R(4, 34 + bob, 52, 4, '#2a2a30');
      R(44, 31 + bob, 8, 5, '#3a3a44');
      R(2, 33 + bob, 6, 6, '#1a1a1e');
      if (atk) E(2, 36, 6, 6, '#fff2a8');
      R(30, 36 + bob, 10, 10, '#c8a080');
      break;
    case 'shield': // armored guard behind a tower shield
      R(21, 62 - legA, 9, legA, '#3a3a44');
      R(34, 62 - legB, 9, legB, '#3a3a44');
      R(20, 24 + bob, 24, 28, '#5a5a68');
      E(32, 16 + bob, 9, 9, '#7a7a8a');
      R(25, 14 + bob, 14, 4, '#111');
      R(27, 15 + bob, 4, 2, '#ff8a2a');
      R(33, 15 + bob, 4, 2, '#ff8a2a');
      P([32, 3 + bob, 28, 10 + bob, 36, 10 + bob], '#c0302a');
      R(46, 20 + bob, 5, 24, '#5a5a68');
      if (atk) E(50, 16, 6, 6, '#ccc');
      else E(48, 40 + bob, 5, 5, '#aaa');
      P([2, 12 + bob, 26, 8 + bob, 26, 58, 2, 52], '#6a7a9a');
      P([5, 15 + bob, 23, 12 + bob, 23, 52, 5, 48], '#8a9ab8');
      R(12, 24 + bob, 3, 18, '#d9a73a');
      break;
    case 'frost': // robed ice mage
      P([32, 10 + bob, 10, 62, 54, 62], '#2a5a7a');
      P([32, 16 + bob, 20, 62, 44, 62], '#4a8ab0');
      E(32, 20 + bob, 9, 9, '#c8f0ff');
      E(32, 22 + bob, 6, 6, '#1a3a5a');
      R(28, 21 + bob, 3, 2, '#e0ffff');
      R(34, 21 + bob, 3, 2, '#e0ffff');
      P([22, 14, 16, 0, 26, 12], '#a8e8ff');
      P([42, 14, 48, 0, 38, 12], '#a8e8ff');
      P([32, 12, 32, 0, 35, 12], '#d8f8ff');
      R(50, 24 + bob, 3, 36, '#8ac8e8');
      P([51.5, 12 + bob, 46, 24 + bob, 57, 24 + bob], atk ? '#fff' : '#a8e8ff');
      if (atk) E(11, 26, 6, 6, '#e0ffff');
      else R(12, 36 + bob, 6, 16, '#4a8ab0');
      break;
    case 'golem': // living rock
      R(16, 44, 14, 20 - (f === 1 ? 3 : 0), '#5a5448');
      R(34, 44, 14, 20 - (f === 1 ? 0 : 3), '#5a5448');
      E(32, 34 + bob, 22, 20, '#7a7468');
      E(26, 28 + bob, 8, 6, '#8a8478');
      E(40, 38 + bob, 9, 7, '#6a645a');
      Ln(20, 30, 30, 44, '#3a362e', 1.5);
      Ln(42, 26, 36, 40, '#3a362e', 1.5);
      E(32, 16 + bob, 10, 9, '#8a8478');
      R(26, 14 + bob, 4, 3, '#ffa030');
      R(34, 14 + bob, 4, 3, '#ffa030');
      R(27, 21 + bob, 10, 3, '#2a261e');
      if (atk) E(8, 18, 9, 9, '#8a8478');
      else E(8, 44 + bob, 8, 10, '#7a7468');
      E(56, 44 + bob, 8, 10, '#7a7468');
      R(10, 28 + bob, 6, 16, '#6a645a');
      break;
    default:
      return false;
  }
  return true;
}
function paintMonster(type, f) {
  const c = mkCanvas(64, 64),
    g = c.getContext('2d');
  const bob = f === 1 ? 2 : 0,
    atk = f === 2;
  const { E, R, P, Ln } = painter(g);
  const legA = f === 1 ? 7 : 11,
    legB = f === 1 ? 11 : 7;
  if (paintRedesign(type, f, g)) return c; // redesigned types are painted there; only the rest is below
  const human = (skin, cloth, pants, helm, gun, belt, bulk) => {
    const bw = bulk || 0;
    R(23, 62 - legA, 7, legA, pants);
    R(34, 62 - legB, 7, legB, pants);
    R(21 - bw, 34 + bob, 22 + bw * 2, 20, cloth);
    if (belt) R(21 - bw, 48 + bob, 22 + bw * 2, 3, belt);
    R(13 - bw, 36 + bob, 8, 15, cloth);
    E(17 - bw, 52 + bob, 3.6, 3.6, skin);
    E(32, 25 + bob, 8.5, 9, skin);
    if (helm) {
      P([22, 24 + bob, 22, 15 + bob, 32, 11 + bob, 42, 15 + bob, 42, 24 + bob], helm);
      R(21, 23 + bob, 22, 3, sh(helm, 0.7));
    }
    const gx = 42 + bw,
      gy = 38 + bob;
    if (atk) {
      E(gx + 3, gy - 10, 7, 7, '#ffd23f');
      E(gx + 3, gy - 10, 3.5, 3.5, '#fff');
    }
    if (gun === 'pistol') R(gx, gy - 4, 6, 10, '#222');
    else if (gun === 'shotgun') {
      R(gx, gy - 8, 5, 26, '#2a2a2a');
      R(gx - 1, gy + 8, 7, 7, '#7a4a28');
    } else if (gun === 'chain') {
      R(gx - 2, gy - 6, 9, 22, '#2a2a2a');
      R(gx - 7, gy + 4, 6, 9, '#8a7a2a');
    } else {
      R(gx, gy - 4, 6, 18, '#2a2a30');
      R(gx + 1, gy + 8, 4, 7, '#3a3a40');
    }
    E(gx + 3, gy + 12, 3.6, 3.6, skin);
  };
  switch (type) {
    case 'zombie':
      human('#8fa273', '#5a4a38', '#34342a', null, 'pistol');
      R(25, 40 + bob, 7, 6, '#3a2a1e');
      R(36, 45 + bob, 5, 4, '#6a1a1a');
      R(28, 22 + bob, 2, 2, '#e22');
      R(34, 22 + bob, 2, 2, '#e22');
      R(29, 30 + bob, 6, 2, '#2a0a0a');
      break;
    case 'shotgunner':
      human('#c49a78', '#556b3a', '#3a3f2a', '#6b7a4a', 'shotgun');
      R(28, 25 + bob, 2, 2, '#111');
      R(34, 25 + bob, 2, 2, '#111');
      break;
    case 'chaingunner':
      human('#b88a68', '#3a4a7a', '#2a2a44', '#26262e', 'chain', '#d9a73a', 3);
      R(28, 25 + bob, 2, 2, '#111');
      R(34, 25 + bob, 2, 2, '#111');
      break;
    case 'guard':
      human('#c49a78', '#25262c', '#1c1c20', '#3a3e46', 'smg', '#555', 1);
      R(24, 24 + bob, 16, 3, '#7ae8ff');
      E(19, 37 + bob, 4, 3, '#d9a73a');
      E(45, 37 + bob, 4, 3, '#d9a73a');
      break;
    case 'ghost': {
      const body = '#8fb4d8',
        dark = '#5a7a9a';
      P([14, 30, 50, 30, 56, 62 - bob, 32, 54, 8, 62 - bob], dark);
      E(32, 28 + bob, 17, 17, body);
      P([6, 40, 16, 34, 18, 50], body);
      P([58, 40, 48, 34, 46, 50], body);
      E(32, 28 + bob, 13, 11, sh(body, 1.1));
      E(26, 27 + bob, 3, 3, '#111');
      E(38, 27 + bob, 3, 3, '#111');
      if (atk) {
        E(32, 37 + bob, 7, 4, '#2a0a0a');
        P([26, 34 + bob, 28, 40 + bob, 30, 34 + bob], '#fff');
        P([34, 34 + bob, 36, 40 + bob, 38, 34 + bob], '#fff');
      }
      break;
    }
    case 'medusa':
      g.strokeStyle = '#1e5a68';
      g.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(20 + i * 8, 40);
        g.quadraticCurveTo(20 + i * 8 + (f === 1 ? 6 : -6), 52, 20 + i * 8 + (f === 1 ? -3 : 3), 62);
        g.stroke();
      }
      P([16, 22, 20, 6, 26, 16], '#165060');
      P([48, 22, 44, 6, 38, 16], '#165060');
      E(32, 30 + bob, 20, 19, '#2a7a8c');
      E(32, 33 + bob, 13, 12, '#4bb5c8');
      E(32, 29 + bob, 10, 9, '#f4f0ff');
      E(32, 29 + bob, 4.5, 7, atk ? '#ff3b1a' : '#106070');
      E(32, 29 + bob, 1.5, 5, '#111');
      E(18, 34 + bob, 3, 3, '#f4f0ff');
      E(46, 34 + bob, 3, 3, '#f4f0ff');
      if (atk) {
        E(32, 46, 8, 6, '#9affd0');
        E(32, 46, 4, 3, '#fff');
      }
      break;
    case 'skull':
      P([20, 20, 22, 2, 28, 14, 32, 0, 36, 14, 42, 2, 44, 20], '#ff7a1a');
      P([25, 20, 28, 8, 32, 16, 36, 8, 39, 20], '#ffd23f');
      E(32, 34 + bob, 17, 16, '#ece6d0');
      E(32, 44 + bob, 12, 9, '#d8d0b8');
      E(25, 32 + bob, 5, 6, '#1a0a00');
      E(39, 32 + bob, 5, 6, '#1a0a00');
      E(25, 33 + bob, 2, 2.5, '#ff5a1a');
      E(39, 33 + bob, 2, 2.5, '#ff5a1a');
      P([31, 38 + bob, 29, 43 + bob, 35, 43 + bob], '#1a0a00');
      for (let i = 0; i < 5; i++) R(23 + i * 4, 48 + bob, 3, atk ? 6 : 4, '#fff');
      break;
    case 'knight':
      R(19, 62 - legA - 2, 12, legA + 2, '#383c46');
      R(34, 62 - legB - 2, 12, legB + 2, '#383c46');
      if (atk) {
        R(4, 10, 10, 26, '#6a6e7a');
        R(50, 10, 10, 26, '#6a6e7a');
        E(9, 9, 7, 7, '#7aff90');
      } else {
        R(4, 28 + bob, 10, 24, '#6a6e7a');
        R(50, 28 + bob, 10, 24, '#6a6e7a');
        E(9, 54 + bob, 6, 5, '#454954');
        E(55, 54 + bob, 6, 5, '#454954');
      }
      R(14, 22 + bob, 36, 30, '#7a7e8c');
      R(22, 28 + bob, 20, 14, '#4a4e5a');
      E(14, 26 + bob, 9, 8, '#9a9eac');
      E(50, 26 + bob, 9, 8, '#9a9eac');
      E(32, 17 + bob, 11, 9, '#8a8e9c');
      P([22, 14 + bob, 18, 4 + bob, 26, 12 + bob], '#e9dcc0');
      P([42, 14 + bob, 46, 4 + bob, 38, 12 + bob], '#e9dcc0');
      E(28, 16 + bob, 2.5, 2, '#7aff90');
      E(36, 16 + bob, 2.5, 2, '#7aff90');
      break;
    case 'spider': {
      const col = '#4a3a5a',
        glow = '#46b6ff';
      for (let i = 0; i < 4; i++) {
        const o = (i + f) % 2 ? 3 : -3;
        Ln(24, 36, 6 + i * 4 + o, 52 + o * 0.5, col, 3);
        Ln(6 + i * 4 + o, 52 + o * 0.5, 4 + i * 4, 62, col, 2);
        Ln(40, 36, 58 - i * 4 - o, 52 - o * 0.5, col, 3);
        Ln(58 - i * 4 - o, 52 - o * 0.5, 60 - i * 4, 62, col, 2);
      }
      E(32, 36 + bob, 15, 11, col);
      E(32, 33 + bob, 10, 6, sh(col, 1.4));
      E(32, 24 + bob, 8, 7, sh(col, 1.2));
      for (let i = 0; i < 3; i++) E(27 + i * 5, 23 + bob, 1.8, 1.8, '#ff3b1a');
      R(30, 6 + bob, 4, 16, '#222');
      E(32, 5 + bob, atk ? 5 : 2.5, atk ? 5 : 2.5, glow);
      break;
    }
  }
  return c;
}
function hurtTex(t) {
  const o = new Uint32Array(t.length);
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c >>> 24)
      o[i] =
        0xff000000 |
        (((((c >> 16) & 255) + 510) / 3) << 16) |
        (((((c >> 8) & 255) + 510) / 3) << 8) |
        (((c & 255) + 510) / 3);
  }
  return o;
}
// Monster sprites are painted at 64px, upscaled to 128px and given a detail pass
// (unsharp mask, grain, rim light, thick outline) for a richer look.
function sprUp(c) {
  const d = mkCanvas(128, 128),
    g = d.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(c, 0, 0, 128, 128);
  return d;
}
function deadCanvas128(c) {
  const d = mkCanvas(128, 128),
    g = d.getContext('2d');
  g.drawImage(c, 0, 0, 128, 128, 0, 80, 128, 48);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(70,0,0,0.5)';
  g.fillRect(0, 0, 128, 128);
  return d;
}
function finishTex128(d) {
  const S = 128,
    n = S * S,
    t = toTex(d),
    o = new Uint32Array(n);
  const sol = new Uint8Array(n),
    ch = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  for (let i = 0; i < n; i++) {
    const p = t[i];
    sol[i] = p >>> 24 >= 110 ? 1 : 0;
    ch[0][i] = p & 255;
    ch[1][i] = (p >> 8) & 255;
    ch[2][i] = (p >> 16) & 255;
  }
  const blur = (a) => {
    const tmp = new Float32Array(n),
      out = new Float32Array(n);
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        let sm = 0,
          c = 0;
        for (let k = -2; k <= 2; k++) {
          const xx = x + k;
          if (xx < 0 || xx >= S) continue;
          const j = y * S + xx;
          if (sol[j]) {
            sm += a[j];
            c++;
          }
        }
        tmp[y * S + x] = c ? sm / c : 0;
      }
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        let sm = 0,
          c = 0;
        for (let k = -2; k <= 2; k++) {
          const yy = y + k;
          if (yy < 0 || yy >= S) continue;
          const j = yy * S + x;
          if (sol[j]) {
            sm += tmp[j];
            c++;
          }
        }
        out[y * S + x] = c ? sm / c : 0;
      }
    return out;
  };
  const bl = ch.map(blur),
    at = (x, y) => (x >= 0 && y >= 0 && x < S && y < S ? sol[y * S + x] : 0);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const i = y * S + x;
      if (!sol[i]) continue;
      const edge = !at(x - 2, y) || !at(x + 2, y) || !at(x, y - 2) || !at(x, y + 2);
      let k = (1.14 - 0.36 * (y / 127)) * (1 + (((x * 73 + y * 151) % 13) - 6) / 110);
      if (!at(x - 4, y - 4)) k *= 1.22;
      if (!at(x + 4, y + 4)) k *= 0.74;
      if (edge) k *= 0.3;
      const c = ch.map((a, q) => clamp((a[i] + 1.0 * (a[i] - bl[q][i])) * k, 0, 255) | 0);
      o[i] = 0xff000000 | (c[2] << 16) | (c[1] << 8) | c[0];
    }
  return o;
}
const TYPES = [
  'zombie',
  'shotgunner',
  'chaingunner',
  'guard',
  'imp',
  'bull',
  'ghost',
  'medusa',
  'skull',
  'knight',
  'lord',
  'spider',
  'skeleton',
  'mancubus',
  'spawner',
  'necro',
  'general',
  'titan',
  'heart',
  'bat',
  'ghoul',
  'leaper',
  'bomber',
  'sniper',
  'shield',
  'frost',
  'golem',
];
// Monster textures are built lazily on first access (the full set used to block startup);
// genLevel touches every type a level can contain, so the cost lands on level load, not mid-fight.
const MON_TEX = {};
function buildMonTex(t) {
  const a = sprUp(paintMonster(t, 0)),
    b = sprUp(paintMonster(t, 1)),
    at = sprUp(paintMonster(t, 2));
  const wa = finishTex128(a);
  return {
    walk: [wa, finishTex128(b)],
    atk: finishTex128(at),
    hurt: hurtTex(wa),
    dead: finishTex128(deadCanvas128(a)),
  };
}
for (const t of TYPES)
  Object.defineProperty(MON_TEX, t, {
    enumerable: true,
    configurable: true,
    get() {
      const v = buildMonTex(t);
      Object.defineProperty(MON_TEX, t, { value: v, enumerable: true });
      return v;
    },
  });

function paintItem(kind) {
  const c = mkCanvas(64, 64),
    g = c.getContext('2d');
  const { R, E } = painter(g);
  const glowT = (inner, outer) => {
    const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    grd.addColorStop(0, '#fff6c0');
    grd.addColorStop(0.3, inner);
    grd.addColorStop(1, outer);
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
  };
  let soft = false;
  if (kind === 'health') {
    R(10, 20, 44, 36, '#e8e8ee');
    R(10, 20, 44, 4, '#fff');
    R(10, 52, 44, 4, '#b0b0ba');
    R(27, 26, 10, 24, '#d02a2a');
    R(20, 33, 24, 10, '#d02a2a');
  } else if (kind === 'bullets') {
    R(8, 32, 48, 24, '#5a4a22');
    R(8, 32, 48, 4, '#7a6830');
    for (let i = 0; i < 6; i++) {
      R(12 + i * 7, 18, 5, 18, '#e0b040');
      R(12 + i * 7, 14, 5, 6, '#b06020');
    }
    R(14, 42, 36, 6, '#d9c070');
  } else if (kind === 'shells') {
    R(8, 36, 48, 20, '#5a2216');
    R(8, 36, 48, 4, '#7a3222');
    for (let i = 0; i < 5; i++) {
      R(12 + i * 9, 18, 7, 22, '#c43a2a');
      R(12 + i * 9, 34, 7, 6, '#d9a73a');
    }
  } else if (kind === 'key') {
    soft = true;
    const grd = g.createRadialGradient(32, 32, 4, 32, 32, 30);
    grd.addColorStop(0, 'rgba(120,240,255,0.9)');
    grd.addColorStop(1, 'rgba(120,240,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#7ae8ff';
    g.beginPath();
    g.moveTo(32, 8);
    g.lineTo(46, 32);
    g.lineTo(32, 56);
    g.lineTo(18, 32);
    g.closePath();
    g.fill();
    g.fillStyle = '#d6faff';
    g.beginPath();
    g.moveTo(32, 8);
    g.lineTo(40, 32);
    g.lineTo(32, 38);
    g.lineTo(24, 32);
    g.closePath();
    g.fill();
  } else if (kind === 'shotgun') {
    R(6, 26, 52, 8, '#4a4a52');
    R(6, 36, 52, 8, '#3a3a42');
    R(2, 32, 20, 18, '#7a4a28');
    R(2, 32, 20, 4, '#9a6038');
  } else if (kind === 'rifle') {
    R(4, 28, 56, 8, '#34343a');
    R(14, 34, 22, 12, '#2a2a30');
    R(40, 36, 6, 16, '#202026');
    R(2, 30, 14, 12, '#5a4028');
    R(52, 24, 10, 4, '#202026');
  } else if (kind === 'rockets') {
    R(8, 38, 48, 20, '#3a4a2a');
    R(8, 38, 48, 4, '#5a6a42');
    for (let i = 0; i < 3; i++) {
      R(12 + i * 15, 14, 9, 28, '#8a8a94');
      R(12 + i * 15, 10, 9, 6, '#d03a2a');
    }
  } else if (kind === 'cells') {
    R(10, 26, 44, 32, '#1e3a5a');
    R(10, 26, 44, 4, '#3a6a9a');
    for (let i = 0; i < 3; i++) {
      R(16 + i * 14, 32, 9, 20, '#60e0ff');
      R(16 + i * 14, 32, 9, 3, '#e0ffff');
    }
  } else if (kind === 'fuel') {
    R(20, 16, 24, 42, '#b03a1a');
    R(20, 16, 24, 5, '#d05a3a');
    R(28, 8, 8, 10, '#444');
    R(24, 32, 16, 8, '#f0c030');
  } else if (kind.startsWith('w_')) {
    const wc = {
      w_minigun: '#8a8a96',
      w_rocket: '#6a7a52',
      w_plasma: '#60b0ff',
      w_flame: '#e0602a',
      w_rail: '#8ab0ff',
      w_destroyer: '#c05ae0',
    }[kind];
    R(4, 28, 56, 9, wc);
    R(10, 36, 16, 14, '#2a2a30');
    R(2, 30, 14, 12, '#5a4028');
    R(46, 22, 10, 6, wc);
    R(8, 54, 48, 3, wc);
  } else if (kind === 'fire_e') {
    soft = true;
    glowT('#e0ffff', 'rgba(120,220,255,0)');
  } else if (kind === 'exit_off' || kind === 'exit_on') {
    soft = true;
    const on = kind === 'exit_on';
    const grd = g.createRadialGradient(32, 40, 4, 32, 40, 30);
    grd.addColorStop(0, on ? 'rgba(120,255,160,0.95)' : 'rgba(120,120,130,0.8)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    g.strokeStyle = on ? '#b8ffd0' : '#55555e';
    g.lineWidth = 4;
    g.beginPath();
    g.ellipse(32, 44, 22, 10, 0, 0, 6.283);
    g.stroke();
    g.strokeStyle = on ? '#3ddc84' : '#3a3a42';
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(32, 44, 14, 6, 0, 0, 6.283);
    g.stroke();
    if (on) {
      g.fillStyle = 'rgba(200,255,220,0.5)';
      g.fillRect(24, 4, 16, 40);
    }
  } else if (kind === 'fire_a') {
    soft = true;
    glowT('#ffb030', 'rgba(255,60,0,0)');
  } else if (kind === 'fire_b') {
    soft = true;
    glowT('#d070ff', 'rgba(120,0,200,0)');
  } else if (kind === 'fire_c') {
    soft = true;
    glowT('#60ff80', 'rgba(0,160,40,0)');
  } else if (kind === 'fire_d') {
    soft = true;
    glowT('#60c0ff', 'rgba(0,80,220,0)');
  } else if (kind === 'rocket') {
    soft = true;
    glowT('#ffe060', 'rgba(255,120,0,0)');
    R(24, 28, 16, 8, '#6a6a72');
  } else if (kind === 'ember') {
    soft = true;
    glowT('#ff9a2a', 'rgba(255,60,0,0)');
  } else if (kind === 'spark') {
    soft = true;
    glowT('#ffe880', 'rgba(255,200,40,0)');
  } else if (kind === 'warn') {
    soft = true;
    g.strokeStyle = 'rgba(255,60,40,0.9)';
    g.lineWidth = 4;
    g.beginPath();
    g.ellipse(32, 52, 26, 9, 0, 0, 6.283);
    g.stroke();
    g.strokeStyle = 'rgba(255,200,80,0.7)';
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(32, 52, 15, 5, 0, 0, 6.283);
    g.stroke();
  } else if (kind === 'blood') {
    soft = true;
    const grd = g.createRadialGradient(28, 28, 2, 32, 32, 26);
    grd.addColorStop(0, '#e03030');
    grd.addColorStop(0.7, '#a01018');
    grd.addColorStop(1, 'rgba(120,0,10,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
  } else if (kind === 'gib') {
    g.fillStyle = '#7a0a14';
    g.beginPath();
    g.moveTo(10, 30);
    g.lineTo(28, 8);
    g.lineTo(52, 22);
    g.lineTo(54, 46);
    g.lineTo(30, 56);
    g.lineTo(12, 48);
    g.closePath();
    g.fill();
    g.fillStyle = '#c42030';
    g.fillRect(24, 22, 14, 8);
  } else if (kind === 'pool') {
    soft = true;
    const grd = g.createRadialGradient(32, 54, 2, 32, 54, 30);
    grd.addColorStop(0, 'rgba(110,4,10,0.95)');
    grd.addColorStop(0.75, 'rgba(90,4,10,0.85)');
    grd.addColorStop(1, 'rgba(70,0,6,0)');
    g.fillStyle = grd;
    g.save();
    g.translate(0, 54);
    g.scale(1, 0.32);
    g.translate(0, -54);
    g.fillRect(0, 0, 64, 110);
    g.restore();
  } else if (kind === 'brazier') {
    R(26, 36, 12, 24, '#3a3a42');
    R(18, 56, 28, 6, '#2a2a30');
    R(16, 30, 32, 8, '#4a4a54');
    R(18, 38, 4, 3, '#2a2a30');
    g.fillStyle = '#ff7a1a';
    g.beginPath();
    g.moveTo(20, 30);
    g.quadraticCurveTo(24, 10, 32, 2);
    g.quadraticCurveTo(40, 12, 44, 30);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffd23f';
    g.beginPath();
    g.moveTo(26, 30);
    g.quadraticCurveTo(30, 16, 32, 10);
    g.quadraticCurveTo(36, 18, 38, 30);
    g.closePath();
    g.fill();
  } else if (kind === 'brazier2') {
    R(26, 36, 12, 24, '#3a3a42');
    R(18, 56, 28, 6, '#2a2a30');
    R(16, 30, 32, 8, '#4a4a54');
    g.fillStyle = '#ff6a1a';
    g.beginPath();
    g.moveTo(21, 30);
    g.quadraticCurveTo(28, 14, 36, 6);
    g.quadraticCurveTo(42, 16, 43, 30);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffe060';
    g.beginPath();
    g.moveTo(27, 30);
    g.quadraticCurveTo(32, 18, 36, 12);
    g.quadraticCurveTo(38, 20, 38, 30);
    g.closePath();
    g.fill();
  } else if (kind === 'barrel') {
    R(18, 14, 28, 46, '#5a6a3a');
    R(18, 14, 28, 4, '#7a8a50');
    R(18, 56, 28, 4, '#3a4624');
    R(18, 26, 28, 3, '#2a3018');
    R(18, 44, 28, 3, '#2a3018');
    R(28, 32, 8, 10, '#e0c020');
  } else if (kind === 'bones') {
    R(8, 50, 48, 6, '#d8d4c0');
    E(20, 46, 8, 7, '#ece6d0');
    R(22, 44, 3, 3, '#222');
    R(28, 44, 3, 3, '#222');
    R(34, 44, 20, 5, '#c8c4b0');
    R(14, 56, 36, 4, '#b0ac98');
  }
  return soft ? toTex(c) : finishTex(c);
}
const ITEM_TEX = {};
for (const k of [
  'health',
  'bullets',
  'shells',
  'key',
  'shotgun',
  'rifle',
  'exit_off',
  'exit_on',
  'fire_a',
  'fire_b',
  'fire_c',
  'fire_d',
  'rocket',
  'ember',
  'spark',
  'warn',
  'blood',
  'gib',
  'pool',
  'brazier',
  'brazier2',
  'barrel',
  'bones',
  'fire_e',
  'rockets',
  'cells',
  'fuel',
  'w_minigun',
  'w_rocket',
  'w_plasma',
  'w_flame',
  'w_rail',
  'w_destroyer',
])
  ITEM_TEX[k] = paintItem(k);

// ===================================================================
// Monster definitions
// ===================================================================
const DEFS = {
  zombie: {
    name: 'Зомбі-рядовий',
    hp: 20,
    spd: 0.9,
    hr: 0.33,
    scale: 0.85,
    z: 0,
    drop: 0.35,
    atk: 'hit',
    range: 6,
    dmg: 5,
    pellets: 1,
    cd: 1.7,
    spread: 0.1,
  },
  shotgunner: {
    name: 'Солдат з дробовиком',
    hp: 30,
    spd: 1.0,
    hr: 0.33,
    scale: 0.88,
    z: 0,
    drop: 0.4,
    atk: 'hit',
    range: 5.5,
    dmg: 4,
    pellets: 3,
    cd: 2.1,
    spread: 0.18,
  },
  chaingunner: {
    name: 'Кулеметник',
    hp: 42,
    spd: 0.9,
    hr: 0.36,
    scale: 0.92,
    z: 0,
    drop: 0.4,
    atk: 'hit',
    range: 6.5,
    dmg: 3,
    pellets: 1,
    burst: 5,
    gap: 0.16,
    cd: 2.0,
    spread: 0.12,
  },
  guard: {
    name: 'Гвардієць у чорному',
    hp: 60,
    spd: 1.3,
    hr: 0.35,
    scale: 0.9,
    z: 0,
    drop: 0.4,
    atk: 'hit',
    range: 5,
    dmg: 4,
    pellets: 1,
    burst: 4,
    gap: 0.14,
    cd: 1.5,
    spread: 0.1,
  },
  imp: {
    name: 'Чортеня',
    hp: 32,
    spd: 1.25,
    hr: 0.35,
    scale: 0.85,
    z: 0,
    drop: 0.25,
    atk: 'ball',
    range: 5,
    dmg: 8,
    ball: 'a',
    n: 1,
    cd: 2.2,
    melee: 7,
    bspd: 5,
  },
  bull: {
    name: 'Бугай',
    hp: 75,
    spd: 2.1,
    hr: 0.45,
    scale: 0.9,
    z: 0,
    drop: 0.3,
    atk: 'melee',
    range: 0.85,
    melee: 14,
  },
  ghost: {
    name: 'Привид',
    hp: 75,
    spd: 2.1,
    hr: 0.42,
    scale: 0.9,
    z: 0,
    drop: 0.3,
    atk: 'melee',
    range: 0.85,
    melee: 14,
    ghost: true,
  },
  medusa: {
    name: 'Медуза-стрілець',
    hp: 55,
    spd: 1.0,
    hr: 0.38,
    scale: 0.8,
    z: 0.22,
    drop: 0.3,
    atk: 'ball',
    range: 6,
    keep: 3.5,
    dmg: 9,
    ball: 'b',
    n: 1,
    cd: 2.2,
    bspd: 5,
    float: true,
  },
  skull: {
    name: 'Череп-камікадзе',
    hp: 22,
    spd: 3.0,
    hr: 0.3,
    scale: 0.5,
    z: 0.3,
    drop: 0.1,
    atk: 'melee',
    range: 0.7,
    melee: 7,
    float: true,
  },
  knight: {
    name: "Кам'яний воїн",
    hp: 125,
    spd: 1.5,
    hr: 0.45,
    scale: 1.05,
    z: 0,
    drop: 0.45,
    atk: 'ball',
    range: 4.5,
    dmg: 10,
    ball: 'c',
    n: 1,
    cd: 3,
    melee: 15,
    bspd: 5.5,
  },
  lord: {
    name: 'Рогатий Володар',
    hp: 190,
    spd: 1.3,
    hr: 0.5,
    scale: 1.2,
    z: 0,
    drop: 0.5,
    atk: 'ball',
    range: 4.5,
    dmg: 11,
    ball: 'a',
    n: 2,
    spread: 0.2,
    cd: 2.4,
    melee: 18,
    bspd: 5.5,
  },
  spider: {
    name: 'Павук-плазмомет',
    hp: 115,
    spd: 1.5,
    hr: 0.45,
    scale: 0.9,
    z: 0,
    drop: 0.4,
    atk: 'ball',
    range: 5,
    dmg: 5,
    ball: 'd',
    n: 1,
    burst: 4,
    gap: 0.1,
    cd: 2,
    bspd: 8,
  },
  skeleton: {
    name: 'Скелет-ракетник',
    hp: 95,
    spd: 1.5,
    hr: 0.38,
    scale: 1.0,
    z: 0,
    drop: 0.4,
    atk: 'rocket',
    range: 5.5,
    dmg: 14,
    n: 1,
    cd: 2.6,
    melee: 10,
    bspd: 5,
  },
  mancubus: {
    name: 'Товстун-вогнемет',
    hp: 210,
    spd: 0.8,
    hr: 0.55,
    scale: 1.1,
    z: 0,
    drop: 0.5,
    atk: 'ball',
    range: 5,
    dmg: 11,
    ball: 'a',
    n: 3,
    spread: 0.25,
    cd: 2.8,
    melee: 15,
    bspd: 4.5,
  },
  spawner: {
    name: 'Породжувач черепів',
    hp: 160,
    spd: 0.9,
    hr: 0.55,
    scale: 1.1,
    z: 0.25,
    drop: 0.4,
    atk: 'spawn',
    range: 7,
    cd: 4.5,
    float: true,
  },
  necro: {
    name: 'Некромант',
    hp: 115,
    spd: 1.1,
    hr: 0.4,
    scale: 1.05,
    z: 0,
    drop: 0.4,
    atk: 'necro',
    range: 6,
    cd: 3.2,
    dmg: 18,
    revive: 5,
  },
  general: {
    name: 'ПАВУЧИЙ ГЕНЕРАЛ',
    boss: true,
    hp: 700,
    spd: 1.0,
    hr: 0.8,
    scale: 1.7,
    z: 0,
    drop: 1,
    atk: 'ball',
    range: 5,
    dmg: 5,
    ball: 'd',
    n: 1,
    burst: 8,
    gap: 0.09,
    cd: 1.8,
    bspd: 8,
    melee: 20,
  },
  titan: {
    name: 'СТАЛЕВИЙ ТИТАН',
    boss: true,
    hp: 1400,
    spd: 1.0,
    hr: 0.85,
    scale: 1.85,
    z: 0,
    drop: 1,
    atk: 'rocket',
    range: 6,
    dmg: 18,
    n: 2,
    spread: 0.2,
    cd: 2.0,
    melee: 25,
    bspd: 5.5,
  },
  heart: {
    name: 'СЕРЦЕ БЕЗОДНІ',
    boss: true,
    hp: 2400,
    spd: 0,
    hr: 1.0,
    scale: 2.3,
    z: 0,
    drop: 1,
    atk: 'heart',
    range: 30,
    cd: 2.4,
    dmg: 12,
    bspd: 5.5,
  },
  bat: {
    name: 'Кажан-рояльник',
    hp: 14,
    spd: 3.2,
    hr: 0.28,
    scale: 0.5,
    z: 0.32,
    drop: 0.05,
    atk: 'melee',
    range: 0.7,
    melee: 5,
    float: true,
  },
  ghoul: {
    name: 'Гуль-повзун',
    hp: 42,
    spd: 2.7,
    hr: 0.36,
    scale: 0.78,
    z: 0,
    drop: 0.25,
    atk: 'melee',
    range: 0.8,
    melee: 9,
  },
  leaper: {
    name: 'Стрибун-різник',
    hp: 58,
    spd: 1.7,
    hr: 0.38,
    scale: 0.85,
    z: 0,
    drop: 0.3,
    atk: 'melee',
    range: 0.85,
    melee: 14,
    leap: true,
  },
  bomber: { name: 'Підривник', hp: 30, spd: 2.3, hr: 0.4, scale: 0.85, z: 0, drop: 0.2, atk: 'melee', range: 0.9 },
  sniper: {
    name: 'Снайпер-культист',
    hp: 42,
    spd: 0.9,
    hr: 0.33,
    scale: 0.9,
    z: 0,
    drop: 0.45,
    atk: 'hit',
    range: 11,
    keep: 6,
    dmg: 16,
    pellets: 1,
    cd: 3.2,
    sure: 0.75,
  },
  shield: {
    name: 'Щитоносець',
    hp: 130,
    spd: 1.2,
    hr: 0.45,
    scale: 1.0,
    z: 0,
    drop: 0.4,
    atk: 'hit',
    range: 4,
    dmg: 6,
    pellets: 2,
    cd: 1.8,
    spread: 0.1,
    melee: 12,
    armor: 0.5,
  },
  frost: {
    name: 'Крижаний маг',
    hp: 75,
    spd: 1.1,
    hr: 0.38,
    scale: 0.95,
    z: 0,
    drop: 0.4,
    atk: 'ball',
    range: 6,
    keep: 3.5,
    dmg: 7,
    ball: 'e',
    n: 2,
    spread: 0.22,
    cd: 2.4,
    bspd: 5.5,
  },
  golem: {
    name: "Кам'яний голем",
    hp: 270,
    spd: 0.95,
    hr: 0.58,
    scale: 1.25,
    z: 0,
    drop: 0.5,
    atk: 'ball',
    range: 4.5,
    dmg: 13,
    ball: 'c',
    n: 1,
    cd: 3,
    melee: 24,
    bspd: 5,
  },
};
for (const k of ['ghost', 'necro', 'frost', 'skeleton', 'golem']) DEFS[k].dry = true;
DEFS.skeleton.chunk = 'bones';
DEFS.golem.chunk = 'bones';
// armed monsters also strike in melee when you get close; unarmed ones only fight up close
for (const [k, v] of Object.entries({
  zombie: 6,
  shotgunner: 7,
  chaingunner: 6,
  guard: 7,
  medusa: 8,
  spider: 10,
  necro: 10,
  sniper: 8,
  frost: 8,
}))
  if (!DEFS[k].melee) DEFS[k].melee = v;
// walk / ranged-attack / melee animation styles and death animations, one set per monster
const ANIM = {
  zombie: { walk: 'sway', atk: 'recoil', melee: 'slam' },
  shotgunner: { walk: 'march', atk: 'recoil', melee: 'slam' },
  chaingunner: { walk: 'stomp', atk: 'recoil', melee: 'slam' },
  guard: { walk: 'march', atk: 'recoil', melee: 'slash' },
  imp: { walk: 'hop', atk: 'raise', melee: 'slash' },
  bull: { walk: 'stomp', melee: 'lunge' },
  ghost: { walk: 'glide', melee: 'bite' },
  medusa: { walk: 'glide', atk: 'raise', melee: 'slash' },
  skull: { walk: 'flap', melee: 'bite' },
  knight: { walk: 'stomp', atk: 'raise', melee: 'slam' },
  lord: { walk: 'stomp', atk: 'raise', melee: 'slam' },
  spider: { walk: 'slither', atk: 'recoil', melee: 'slash' },
  skeleton: { walk: 'march', atk: 'recoil', melee: 'slash' },
  mancubus: { walk: 'sway', atk: 'recoil', melee: 'slam' },
  spawner: { walk: 'pulse', atk: 'raise', melee: 'bite' },
  necro: { walk: 'glide', atk: 'raise', melee: 'slash' },
  general: { walk: 'slither', atk: 'recoil', melee: 'slam' },
  titan: { walk: 'stomp', atk: 'recoil', melee: 'slam' },
  heart: { walk: 'pulse', atk: 'raise', melee: 'slam' },
  bat: { walk: 'flap', melee: 'bite' },
  ghoul: { walk: 'lurch', melee: 'slash' },
  leaper: { walk: 'hop', melee: 'slash' },
  bomber: { walk: 'hop', melee: 'lunge' },
  sniper: { walk: 'sway', atk: 'recoil', melee: 'slam' },
  shield: { walk: 'march', atk: 'recoil', melee: 'slam' },
  frost: { walk: 'glide', atk: 'raise', melee: 'slash' },
  golem: { walk: 'stomp', atk: 'raise', melee: 'slam' },
};
const DEATH = {
  zombie: ['collapse', 0.7],
  shotgunner: ['collapse', 0.7],
  chaingunner: ['topple', 0.8],
  guard: ['collapse', 0.6],
  imp: ['spin', 0.7],
  bull: ['topple', 0.9],
  ghost: ['dissolve', 1.0],
  medusa: ['drop', 0.8],
  skull: ['burst', 0.35],
  knight: ['crumble', 1.0],
  lord: ['topple', 1.1],
  spider: ['collapse', 0.9],
  skeleton: ['crumble', 0.8],
  mancubus: ['melt', 1.2],
  spawner: ['burst', 0.6],
  necro: ['dissolve', 1.0],
  general: ['crumble', 1.3],
  titan: ['crumble', 1.4],
  heart: ['burst', 1.2],
  bat: ['spin', 0.6],
  ghoul: ['melt', 0.9],
  leaper: ['spin', 0.7],
  bomber: ['burst', 0.25],
  sniper: ['topple', 0.8],
  shield: ['collapse', 0.9],
  frost: ['shatter', 0.6],
  golem: ['crumble', 1.2],
};
// level where each ordinary monster first shows up
const INTRO = {
  zombie: 1,
  shotgunner: 2,
  chaingunner: 3,
  imp: 4,
  bull: 6,
  ghost: 7,
  medusa: 8,
  skull: 9,
  guard: 11,
  knight: 12,
  spider: 13,
  skeleton: 14,
  mancubus: 16,
  spawner: 17,
  necro: 18,
  lord: 19,
  bat: 5,
  ghoul: 8,
  leaper: 10,
  bomber: 12,
  sniper: 14,
  shield: 16,
  frost: 20,
  golem: 22,
};
const BOSS_PLAN = {
  5: [{ type: 'lord', mul: 3.4, name: 'ВОЖДЬ РОГАТИХ' }],
  10: [{ type: 'general', mul: 1 }],
  15: [{ type: 'mancubus', mul: 3.2, name: 'КОРОЛЬ-ТОВСТУН' }],
  20: [{ type: 'titan', mul: 1 }],
  25: [
    { type: 'lord', mul: 2.6, name: 'РОГАТИЙ БЛИЗНЮК', dx: -2 },
    { type: 'lord', mul: 2.6, name: 'РОГАТИЙ БЛИЗНЮК', dx: 2 },
  ],
  30: [{ type: 'heart', mul: 1 }],
};
