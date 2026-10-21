// Character heads drawn in local space facing +x (3/4 view), origin = head center.
// face: 1 faces right, -1 faces left (mirrored).

const HEAD = 'M -66 -58 C -68 -112 -18 -134 26 -126 C 70 -118 94 -84 96 -40 C 98 -12 99 12 94 36 C 88 66 70 96 42 110 C 22 119 -2 116 -18 104 C -46 84 -62 52 -67 18 C -71 -10 -68 -34 -66 -58 Z';
const HEAD_SQUARE = 'M -70 -56 C -72 -112 -20 -134 26 -126 C 72 -118 98 -84 100 -40 C 102 -10 104 18 100 44 C 96 76 82 104 50 114 C 26 121 -4 120 -22 108 C -52 88 -66 54 -70 18 C -74 -10 -72 -34 -70 -56 Z';
const HEAD_SOFT = 'M -64 -56 C -66 -110 -18 -130 24 -122 C 66 -114 90 -82 92 -40 C 94 -12 94 12 88 36 C 80 64 62 92 36 104 C 18 111 -4 108 -18 98 C -44 80 -60 50 -64 18 C -68 -10 -66 -34 -64 -56 Z';
const EAR = 'M -44 -16 C -62 -36 -86 -14 -79 10 C -74 30 -58 37 -44 24 Z';
const NOSES = {
  reg: 'M 66 -32 C 76 -10 104 12 103 30 C 102 43 86 46 74 41 C 70 39 69 34 72 31 Z',
  big: 'M 62 -36 C 74 -8 116 14 114 36 C 112 52 90 54 74 47 C 68 44 67 37 72 34 Z',
  small: 'M 74 -14 C 82 2 96 16 95 27 C 94 36 84 38 77 35 Z',
  soft: 'M 70 -24 C 80 -4 100 14 99 28 C 98 39 85 41 76 37 C 72 35 72 31 75 29 Z',
};
const HAIR = {
  varun: [
    'M -74 -24 C -92 -94 -40 -152 22 -146 C 82 -142 112 -104 102 -54 C 96 -64 86 -70 76 -68 C 80 -58 78 -50 72 -46 C 68 -60 56 -72 42 -70 C 44 -60 40 -52 34 -50 C 28 -66 10 -76 -6 -70 C -16 -64 -24 -52 -32 -42 C -38 -28 -40 -12 -46 -2 C -58 -4 -68 -12 -74 -24 Z',
    'M -40 -100 C -20 -130 20 -134 40 -120 C 20 -124 -10 -118 -40 -100 Z',
  ],
  father: [
    'M -74 -18 C -82 -66 -56 -112 -4 -122 C 22 -126 14 -110 -6 -102 C -30 -92 -44 -70 -46 -42 C -48 -26 -50 -10 -54 2 C -66 0 -72 -8 -74 -18 Z',
    'M -10 -118 C 20 -128 60 -122 80 -100 C 60 -112 24 -116 -10 -108 Z',
  ],
  mother: [
    'M -74 -28 C -82 -100 -30 -142 30 -136 C 78 -130 102 -96 99 -58 C 84 -84 54 -98 22 -94 C -8 -90 -34 -70 -46 -40 C -52 -24 -56 -8 -62 4 C -70 -4 -74 -16 -74 -28 Z',
  ],
  elias: [
    'M -72 -40 C -66 -30 -60 -10 -54 -2 C -64 -4 -74 -20 -72 -40 Z',
    'M 70 -60 C 84 -58 96 -50 100 -40 C 92 -46 82 -48 74 -46 Z',
  ],
  sister: [
    'M -76 -36 C -88 -108 -32 -148 30 -142 C 82 -136 106 -100 101 -56 C 92 -72 74 -82 56 -78 C 58 -66 54 -58 46 -54 C 40 -66 24 -74 8 -70 C -10 -58 -28 -38 -42 -16 C -52 4 -56 44 -58 86 C -76 56 -82 4 -76 -36 Z',
  ],
};

function brow(x1, y1, x2, y2, w, c, bend = -4) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + bend;
  return `<path d="${limb([[x1, y1], [mx, my], [x2, y2]], [w * 0.7, w, w * 0.6])}" fill="${c}"/>`;
}

function eye(S, cx, cy, rx, ry, o) {
  const cp = S.id('c');
  const d = `M ${cx - rx} ${cy} C ${cx - rx * .5} ${cy - ry * 1.3} ${cx + rx * .5} ${cy - ry * 1.3} ${cx + rx} ${cy} C ${cx + rx * .5} ${cy + ry * 1.15} ${cx - rx * .5} ${cy + ry * 1.15} ${cx - rx} ${cy} Z`;
  S.defs.push(`<clipPath id="${cp}"><path d="${d}"/></clipPath>`);
  const look = o.look || [0, 0];
  const ir = Math.min(rx, ry) * 0.8;
  const ix = cx + look[0] * (rx - ir * 0.7), iy = cy + look[1] * ry * 0.35;
  const top = cy - ry * 1.0, ly = top + (o.lid || 0) * ry * 1.9;
  const lidC = o.lidC, ln = o.line || '#2a140c';
  let s = `<g clip-path="url(#${cp})"><path d="${d}" fill="${o.white || '#efe4d6'}"/>`;
  s += `<circle cx="${P(ix)}" cy="${P(iy)}" r="${P(ir)}" fill="${o.iris || '#4a2a16'}"/>`;
  s += `<circle cx="${P(ix)}" cy="${P(iy)}" r="${P(ir * 0.52)}" fill="#120806"/>`;
  s += `<circle cx="${P(ix - ir * .32)}" cy="${P(iy - ir * .38)}" r="${P(ir * .24)}" fill="${o.spec || '#fff'}" opacity=".9"/>`;
  s += `<rect x="${cx - rx - 4}" y="${cy - ry * 2.5}" width="${rx * 2 + 8}" height="${P(ly - (cy - ry * 2.5))}" fill="${lidC}"/>`;
  s += `<rect x="${cx - rx - 4}" y="${P(ly)}" width="${rx * 2 + 8}" height="${P(ry * 0.6)}" fill="#3a1a10" opacity=".35" filter="${S.blur(2)}"/>`;
  s += `</g>`;
  const curve = (o.lid || 0) < 0.15 ? -ry * 0.25 : -3;
  s += `<path d="M ${cx - rx - 2} ${P(ly + 2)} Q ${cx} ${P(ly + curve)} ${cx + rx + 4} ${P(ly - 1)}" stroke="${ln}" stroke-width="${o.lw || 4}" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M ${cx - rx * .6} ${P(cy + ry * 1.05)} Q ${cx} ${P(cy + ry * 1.2)} ${cx + rx * .7} ${P(cy + ry * .95)}" stroke="${ln}" stroke-width="1.6" fill="none" opacity=".45" stroke-linecap="round"/>`;
  if (o.crease !== false) s += `<path d="M ${cx - rx * .7} ${P(top - 6)} Q ${cx} ${P(top - 11)} ${cx + rx * .8} ${P(top - 7)}" stroke="${ln}" stroke-width="1.8" fill="none" opacity=".35" stroke-linecap="round"/>`;
  return s;
}

// o: x,y,s,face, skin, skinSh, hairC, hair, head, nose, eyes{look,lid}, brows{inY,outY}, mouth, extras...
function head(S, o) {
  const f = o.face || 1, s = o.s || 1;
  const L = [S.L[0] * f, S.L[1]], R = [S.R[0] * f, S.R[1]];
  const sk = o.skin, line = o.line || '#2c140c';
  const shC = o.shadow || S.sh, rimC = o.rimC || S.rim;
  const F = (d, x = {}) => S.form(d, { fill: sk, L, R, sh: shC, rim: rimC, sd: 30, rd: 7, sho: .62, key: true, ...x });
  let g = `<g transform="translate(${o.x} ${o.y}) scale(${s * f} ${s})">`;
  // back hair mass (bun, braid, long hair behind)
  if (o.hair === 'mother') {
    g += S.form('M -66 -88 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0', { fill: o.hairC, L, R, sh: shC, rim: rimC, sd: 22, rd: 6 });
    g += `<path d="M -96 -96 C -80 -110 -60 -112 -40 -98" stroke="${line}" stroke-width="2" fill="none" opacity=".35"/>`;
  }
  if (o.hair === 'sister') {
    let bx = -58, by = 70; 
    for (let i = 0; i < 6; i++) { g += S.form(`M ${bx} ${by} m -17 0 a 17 21 0 1 0 34 0 a 17 21 0 1 0 -34 0`, { fill: o.hairC, L, R, sh: shC, rim: rimC, sd: 12, rd: 4 }); by += 30; bx += 3; }
    g += `<path d="${limb([[bx - 3, by - 14], [bx - 1, by + 10]], 14)}" fill="${o.ribbon || '#c23b3b'}"/>`;
  }
  g += F(o.headShape || HEAD);
  // ear
  g += F(EAR, { sd: 12, rd: 5 });
  g += `<path d="M -52 -8 C -66 -18 -74 -2 -69 10 C -66 18 -58 20 -52 14" stroke="${o.skinSh || line}" stroke-width="3" fill="none" opacity=".7"/>`;
  // cheek warmth
  g += `<ellipse cx="38" cy="32" rx="30" ry="18" fill="${o.blush || '#d0604a'}" opacity="${o.blushO ?? .28}" filter="${S.blur(8)}"/>`;
  if (o.stubble) g += `<path d="M -40 50 C -18 96 24 120 58 104 C 82 92 94 62 96 36 C 86 52 76 62 62 64 C 40 66 6 56 -40 50 Z" fill="${o.hairC}" opacity="${o.stubble}" filter="${S.blur(3)}"/>`;
  // eyes
  const E = o.eyes || {};
  const ez = { look: E.look, lid: E.lid, lidC: o.lidC || sk, line, iris: o.iris };
  g += eye(S, 88, -20, 8, 10.5, { ...ez, lw: 3.4, crease: false });
  g += eye(S, 36, -20, 16, 12, ez);
  // nose
  g += F(NOSES[o.nose || 'reg'], { sd: 14, rd: 6, sho: .6 });
  g += `<path d="M 80 40 C 86 44 94 44 98 40" stroke="${line}" stroke-width="2.2" fill="none" opacity=".55" stroke-linecap="round"/>`;
  // brows
  const B = o.brows || {};
  const bc = o.browC || o.hairC;
  g += brow(12, -44 + (B.out || 0), 56, -48 + (B.in || 0), B.w || 9, bc, B.bend ?? -5);
  g += brow(76, -48 + (B.in || 0), 98, -46 + (B.out || 0) * 0.5, (B.w || 9) * 0.75, bc, -2);
  // mouth
  const M = o.mouth || 'flat';
  const mouths = {
    flat: `<path d="M 50 72 Q 70 74 90 69" stroke="${line}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    frown: `<path d="M 50 76 Q 70 67 92 73" stroke="${line}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    tight: `<path d="M 48 72 L 92 70" stroke="${line}" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="M 56 80 Q 72 84 86 79" stroke="${line}" stroke-width="1.6" fill="none" opacity=".4"/>`,
    sigh: `<path d="M 54 70 Q 72 64 90 70 Q 74 82 54 70 Z" fill="#3a140e"/>`,
    open: `<path d="M 54 68 Q 74 64 92 68 Q 80 92 58 78 Z" fill="#3a120c"/><path d="M 60 70 Q 74 68 88 70" stroke="#e8dccc" stroke-width="3" fill="none"/>`,
    smirk: `<path d="M 50 74 Q 70 76 92 66" stroke="${line}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  };
  g += mouths[M];
  if (o.lips) g += `<path d="M 56 80 Q 72 88 88 78" stroke="${o.lips}" stroke-width="5" fill="none" opacity=".5" stroke-linecap="round"/>`;
  if (o.lines) g += `<path d="M 70 46 Q 56 62 58 84" stroke="${line}" stroke-width="2" fill="none" opacity=".35"/><path d="M -20 -10 Q -14 0 -16 12" stroke="${line}" stroke-width="1.5" fill="none" opacity=".25"/><path d="M 20 -76 Q 50 -80 80 -74 M 24 -86 Q 50 -90 76 -84" stroke="${line}" stroke-width="1.6" fill="none" opacity=".25"/>`;
  if (o.mustache) g += S.form('M 54 56 C 66 44 100 44 112 56 C 112 66 100 68 90 64 C 80 70 66 70 56 66 C 50 64 50 60 54 56 Z', { fill: o.hairC, L, R, sh: shC, rim: rimC, sd: 8, rd: 4 });
  // hair
  (HAIR[o.hair] || []).forEach(d => { g += S.form(d, { fill: o.hairC, L, R, sh: shC, rim: rimC, sd: 26, rd: 7 }); });
  if (o.hair === 'varun') g += `<path d="M -30 -120 C 0 -132 40 -130 60 -116 M -50 -90 C -30 -110 0 -116 20 -112" stroke="${o.hairHi || '#5a4040'}" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>`;
  if (o.beanie) {
    g += S.form('M -80 -34 C -88 -112 -30 -160 30 -152 C 88 -144 114 -102 106 -48 Z', { fill: o.beanie, L, R, sh: shC, rim: rimC, sd: 30, rd: 7 });
    for (let i = 0; i < 9; i++) { const x = -60 + i * 18; g += `<path d="M ${x} -60 Q ${x + 4} -100 ${x + 10} -138" stroke="#000" stroke-width="2" opacity=".12" fill="none"/>`; }
    g += S.form('M -84 -52 C -24 -68 50 -70 110 -58 L 108 -28 C 50 -40 -20 -38 -82 -22 Z', { fill: o.beanieCuff || o.beanie, L, R, sh: shC, rim: rimC, sd: 10, rd: 5 });
    g += S.form('M 0 -156 m -24 0 a 24 22 0 1 0 48 0 a 24 22 0 1 0 -48 0', { fill: o.pom || '#efe6d8', L, R, sh: shC, rim: rimC, sd: 14, rd: 5 });
  }
  if (o.earmuff) g += S.form('M -60 6 m -26 0 a 26 30 0 1 0 52 0 a 26 30 0 1 0 -52 0', { fill: o.earmuff, L, R, sh: shC, rim: rimC, sd: 14, rd: 5 });
  if (o.glasses) g += `<g stroke="${o.glasses}" stroke-width="3.5" fill="none"><rect x="16" y="-36" width="42" height="32" rx="10"/><path d="M 58 -24 Q 68 -28 76 -24"/><path d="M 76 -36 L 100 -34 L 100 -6 L 78 -4 Z"/><path d="M 16 -26 L -40 -20"/></g><rect x="16" y="-36" width="42" height="32" rx="10" fill="#bfe6ff" opacity=".12"/>`;
  return g + '</g>';
}

// Torso in local space (same transform convention as head). Shoulders ~ y 180.
function torso(S, o) {
  const f = o.face || 1, s = o.s || 1;
  const L = [S.L[0] * f, S.L[1]], R = [S.R[0] * f, S.R[1]];
  const shC = o.shadow || S.sh, rimC = o.rimC || S.rim;
  const F = (d, x = {}) => S.form(d, { L, R, sh: shC, rim: rimC, sd: 60, rd: 7, sho: .6, rimo: .6, ...x });
  let g = `<g transform="translate(${o.x} ${o.y - 24 * s}) scale(${s * f} ${s})">`;
  const w = o.wide || 1;
  if (o.neck) g += F('M -36 50 C -38 90 -40 120 -42 160 L 50 160 C 48 120 46 96 48 64 Z', { fill: o.neck, sd: 40, rd: 4, key: false });
  g += F(`M ${-40 * w} 150 C ${-110 * w} 158 ${-162 * w} 190 ${-176 * w} 262 C ${-188 * w} 330 ${-196 * w} 430 ${-200 * w} 620 L ${210 * w} 620 C ${206 * w} 430 ${198 * w} 330 ${188 * w} 266 C ${172 * w} 200 ${130 * w} 164 ${66 * w} 154 Z`, { fill: o.color });
  if (o.ribs) for (let i = -8; i <= 8; i++) { const x = i * 22 * w; g += `<path d="M ${x} 240 Q ${x * 1.06} 420 ${x * 1.1} 620" stroke="#000" stroke-width="3" opacity=".08" fill="none"/>`; }
  if (o.collar) g += F('M -48 136 C -30 176 50 180 74 140 C 82 160 80 186 60 198 C 20 216 -36 210 -62 186 C -72 170 -62 148 -48 136 Z', { fill: o.collar, sd: 16 });
  if (o.scarf) {
    g += F('M -56 132 C -26 176 52 180 84 142 C 96 160 92 192 66 206 C 22 224 -44 214 -72 186 C -82 168 -72 146 -56 132 Z', { fill: o.scarf, sd: 18 });
    g += F(limb([[40, 196], [52, 260], [58, 330]], [44, 40, 36]), { fill: o.scarf2 || o.scarf, sd: 14 });
    for (let i = 0; i < 4; i++) g += `<path d="M ${40 + i * 7} 330 l 2 22" stroke="${o.scarf2 || o.scarf}" stroke-width="4" stroke-linecap="round"/>`;
    g += `<path d="M 34 250 L 70 246 M 36 290 L 72 286" stroke="#fff" stroke-width="5" opacity=".18"/>`;
  }
  if (o.shawl) g += F('M -170 250 C -120 190 -40 170 40 180 C 120 186 180 220 196 280 C 150 330 60 360 0 380 C -60 360 -130 320 -170 250 Z', { fill: o.shawl, sd: 30 });
  return g + '</g>';
}
