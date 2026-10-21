const SCENES = {};

// ---------- FRAME 1: Varun's office, night. Screen glow vs. warm lamp ----------
SCENES.office = () => {
  const S = new Scene({ L: [-1, -0.15], R: [1, -0.35], sh: '#1a0f24', rim: '#ffb066', key: '#7fbcff', kd: 46, keyo: .38 });
  const r = rng(3);
  let b = '';
  // wall
  b += `<rect width="1920" height="1080" fill="${S.lin([[0, '#1d2a3e'], [1, '#0c111b']])}"/>`;
  // window
  b += `<rect x="110" y="70" width="430" height="560" rx="6" fill="#1a1410"/>`;
  b += `<rect x="130" y="90" width="390" height="520" fill="${S.lin([[0, '#5b7fae'], [0.6, '#36507a'], [1, '#26395a']])}"/>`;
  b += S.glow(400, 200, 220, '#cfe2ff', .55);
  // distant snowy rooftops
  b += `<path d="M 130 520 L 200 470 L 260 500 L 330 440 L 400 490 L 460 460 L 520 500 L 520 610 L 130 610 Z" fill="#1d2c48" opacity=".9"/>`;
  b += `<path d="M 130 520 L 200 470 L 260 500 L 330 440 L 400 490 L 460 460 L 520 500" stroke="#c9dcf5" stroke-width="5" fill="none" opacity=".6"/>`;
  for (let i = 0; i < 70; i++) b += `<circle cx="${130 + r() * 390}" cy="${90 + r() * 520}" r="${1 + r() * 3}" fill="#eaf2ff" opacity="${.4 + r() * .5}"/>`;
  b += `<rect x="130" y="90" width="390" height="520" fill="none" stroke="#e8f1ff" stroke-width="30" opacity=".35" filter="${S.blur(14)}"/>`;
  b += `<rect x="317" y="90" width="16" height="520" fill="#1a1410"/><rect x="130" y="342" width="390" height="16" fill="#1a1410"/>`;
  b += `<rect x="100" y="610" width="450" height="26" fill="#2a1d16"/>`;
  // moonlight shaft
  b += `<path d="M 130 90 L 520 90 L 900 1080 L 300 1080 Z" fill="#9fc0ff" opacity=".07" filter="${S.blur(30)}" style="mix-blend-mode:screen"/>`;
  // bookshelf
  b += `<rect x="1440" y="40" width="520" height="800" fill="#1e140f"/>`;
  const bookC = ['#6b2f2a', '#2f4a5a', '#7a5a2a', '#3a2f4a', '#5a3a2a', '#2f5a44', '#80602f', '#4a2020'];
  [110, 300, 490].forEach(y => {
    let x = 1465;
    while (x < 1900) { const w = 18 + r() * 26, h = 120 + r() * 50; const c = bookC[Math.floor(r() * bookC.length)];
      b += `<rect x="${x}" y="${y + 170 - h}" width="${w}" height="${h}" fill="${c}"/><rect x="${x}" y="${y + 170 - h}" width="${w}" height="${h}" fill="${S.lin([[0, '#000', .5], [1, '#000', 0]], 0, 0, 1, 0)}"/>`;
      x += w + 2; if (r() < .1) x += 30; }
    b += `<rect x="1440" y="${y + 170}" width="520" height="20" fill="#2c1d14"/><rect x="1440" y="${y + 170}" width="520" height="5" fill="#ffb066" opacity=".35"/>`;
  });
  b += `<rect x="1440" y="40" width="520" height="800" fill="${S.lin([[0, '#000', .7], [0.6, '#000', .1], [1, '#000', 0]], 0, 0, 1, 0)}"/>`;
  // lamp glow behind Varun
  b += S.glow(1640, 640, 700, '#ff8a3a', .55);
  b += S.glow(1640, 640, 220, '#ffd08a', .7);
  // lamp
  b += `<path d="M 1640 640 L 1640 880" stroke="#2a1a10" stroke-width="10"/><ellipse cx="1640" cy="884" rx="70" ry="14" fill="#2a1a10"/>`;
  b += S.form('M 1560 640 L 1600 520 L 1690 520 L 1730 640 Z', { fill: '#c6743a', L: [0, 1], R: [-1, 0], sd: 30, rd: 6, rim: '#ffe0a8' });
  b += `<ellipse cx="1645" cy="640" rx="85" ry="12" fill="#ffe8b0"/>`;
  // --- Varun body ---
  const V = { ...CAST.varun, x: 1260, y: 390, s: 1.55, face: -1 };
  b += torso(S, { x: 1262, y: 392, s: 1.5, face: -1, color: '#5e2a30', collar: '#c9b79a', ribs: true, wide: .95, neck: CAST.varun.skinSh });
  b += head(S, { ...V, eyes: { look: [1, .25], lid: .32 }, brows: { in: 5, out: -1, w: 10 }, mouth: 'flat' });
  // desk (in front of torso)
  b += `<path d="M 0 790 L 1920 790 L 1920 1080 L 0 1080 Z" fill="${S.lin([[0, '#4a2c1c'], [1, '#22140c']])}"/>`;
  for (let i = 0; i < 9; i++) b += `<path d="M 0 ${810 + i * 32} Q 900 ${800 + i * 34} 1920 ${815 + i * 30}" stroke="#000" stroke-width="2" opacity=".12" fill="none"/>`;
  b += `<rect x="0" y="788" width="1920" height="6" fill="#ffb066" opacity=".35"/>`;
  b += S.ellipseGlow(1640, 880, 520, 140, '#ff9a4a', .55);
  b += S.ellipseGlow(560, 880, 520, 160, '#8fc0ff', .4);
  // mug
  b += `<ellipse cx="1450" cy="905" rx="46" ry="12" fill="#000" opacity=".4" filter="${S.blur(6)}"/>`;
  b += S.form('M 1406 820 L 1494 820 L 1490 900 C 1470 912 1430 912 1410 900 Z', { fill: '#3e5e6a', L: [-1, 0], R: [1, 0], sd: 30, rd: 7 });
  b += `<path d="M 1494 838 C 1526 838 1526 880 1492 880" stroke="#3e5e6a" stroke-width="12" fill="none"/>`;
  b += `<ellipse cx="1450" cy="820" rx="44" ry="10" fill="#1a0e08"/>`;
  [0, 1].forEach(k => b += `<path d="${limb([[1440 + k * 18, 810], [1430 + k * 22, 770], [1450 + k * 14, 730], [1436 + k * 20, 690]], [10, 12, 10, 4])}" fill="#ffe8cf" opacity=".18" filter="${S.blur(5)}"/>`);
  // papers
  b += `<path d="M 1040 960 L 1300 935 L 1330 1010 L 1060 1040 Z" fill="#cfc2a8"/><path d="M 1040 960 L 1300 935 L 1330 1010 L 1060 1040 Z" fill="${S.lin([[0, '#ffb066', .4], [1, '#5a7aa0', .3]], 1, 0, 0, 0)}"/>`;
  for (let i = 0; i < 5; i++) b += `<path d="M ${1070 + i * 2} ${975 + i * 11} L ${1270 + i * 2} ${955 + i * 11}" stroke="#6a5a48" stroke-width="2" opacity=".5"/>`;
  // laptop
  const TL = [330, 470], TR = [690, 420], BL = [330, 790], BR = [690, 740];
  b += `<ellipse cx="640" cy="840" rx="330" ry="40" fill="#000" opacity=".45" filter="${S.blur(14)}"/>`;
  b += `<path d="M 330 790 L 690 740 L 905 812 L 545 872 Z" fill="#3a3f4a"/>`;
  b += `<path d="M 545 872 L 905 812 L 905 822 L 545 884 Z" fill="#1c1f26"/>`;
  for (let i = 0; i < 5; i++) { const t = .15 + i * .14; b += `<path d="M ${P(330 + 215 * t + 20)} ${P(790 + 82 * t - 4)} L ${P(690 + 215 * t - 30)} ${P(740 + 72 * t)}" stroke="#262a32" stroke-width="9" stroke-dasharray="16 5"/>`; }
  b += `<path d="M 316 466 L 330 470 L 330 790 L 316 792 Z" fill="#20242c"/>`;
  b += `<path d="M 330 470 L 690 420 L 690 740 L 330 790 Z" fill="#2a2e36"/>`;
  b += `<path d="M 342 484 L 678 437 L 678 728 L 342 775 Z" fill="${S.lin([[0, '#eaf4ff'], [1, '#a9cdf2']])}"/>`;
  // screen text (affine mapped)
  const a = (TR[0] - TL[0]) / 400, bb = (TR[1] - TL[1]) / 400, d = (BL[1] - TL[1]) / 320;
  b += `<g transform="matrix(${P(a * 1000) / 1000} ${P(bb * 1000) / 1000} 0 ${P(d * 1000) / 1000} ${TL[0]} ${TL[1]})">`;
  b += `<rect x="14" y="14" width="372" height="18" fill="#c8dcf0"/><circle cx="26" cy="23" r="4" fill="#e06a5a"/><circle cx="40" cy="23" r="4" fill="#e0b45a"/><circle cx="54" cy="23" r="4" fill="#6ab46a"/>`;
  b += `<text x="200" y="92" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="25" letter-spacing="1.5" fill="#1a2433">ARGUMENTS</text>`;
  b += `<text x="200" y="124" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="25" letter-spacing="1.5" fill="#1a2433">AGAINST GOD</text>`;
  b += `<rect x="60" y="150" width="280" height="2" fill="#1a2433" opacity=".25"/>`;
  b += `<rect x="60" y="172" width="3" height="20" fill="#1a2433"/>`;
  b += `</g>`;
  b += S.glow(520, 620, 640, '#8cc4ff', .45);
  b += S.glow(520, 620, 260, '#d8ecff', .35);
  // Varun's arm + tapping hand on desk
  const LV = [-1, -0.1], RV = [1, -0.3];
  b += S.form(limb([[1110, 720], [1060, 860], [990, 900], [930, 895]], [120, 110, 92, 80]), { fill: '#5e2a30', L: LV, R: RV, sd: 40, rd: 8, sh: '#1a0f24' });
  b += `<path d="M 935 862 L 940 930" stroke="#4a1e24" stroke-width="16" stroke-linecap="round"/>`;
  b += `<ellipse cx="860" cy="912" rx="90" ry="12" fill="#000" opacity=".45" filter="${S.blur(6)}"/>`;
  b += handFromParts(S, limb([[935, 892], [880, 884]], [62, 66]), [
    { p: [[892, 902], [866, 908], [854, 917]], w: [18, 15, 13], back: true },
    { p: [[888, 892], [854, 898], [838, 914]], w: [21, 18, 15], back: true },
    { p: [[884, 880], [846, 882], [826, 910]], w: [22, 19, 16] },
    { p: [[886, 866], [846, 852], [818, 858]], w: [22, 19, 16] },
    { p: [[912, 870], [884, 858], [864, 866]], w: [24, 20, 17] },
  ], { skin: '#b27a5c', L: LV, R: RV, sh: '#1a0f24', rim: '#ffb066' });
  b += `<path d="M 808 842 l -14 -10 M 802 858 l -18 0 M 812 828 l -6 -14" stroke="#e8f2ff" stroke-width="3.5" stroke-linecap="round" opacity=".75"/>`;
  b += S.grain(.08) + S.vignette(.75);
  return S.svg(b);
};

// ---------- FRAME 2: Dining room. The broken circle ----------
SCENES.dining = () => {
  const S = new Scene({ L: [0, 1], R: [0, -1], sh: '#2a1224', rim: '#a8cfff', key: '#ffb45a', kd: 50, keyo: .22 });
  const r = rng(11);
  let b = '';
  // wall
  b += `<rect width="1920" height="1080" fill="${S.lin([[0, '#3b2620'], [0.6, '#5a3526'], [1, '#2a1712']])}"/>`;
  // wallpaper stripes
  for (let x = 0; x < 1920; x += 64) b += `<rect x="${x}" y="0" width="22" height="620" fill="#000" opacity=".06"/>`;
  // wainscot
  b += `<rect x="0" y="560" width="1920" height="200" fill="#3a2016"/><rect x="0" y="560" width="1920" height="10" fill="#6a4030"/>`;
  for (let x = 30; x < 1920; x += 170) b += `<rect x="${x}" y="590" width="130" height="150" rx="4" fill="none" stroke="#000" stroke-width="3" opacity=".25"/>`;
  // windows
  [[200, 470], [1450, 1720]].forEach(([x1, x2]) => {
    const w = x2 - x1;
    b += S.glow((x1 + x2) / 2, 330, 420, '#7aa8e8', .35);
    b += `<path d="M ${x1 - 16} 560 L ${x1 - 16} 190 Q ${(x1 + x2) / 2} 60 ${x2 + 16} 190 L ${x2 + 16} 560 Z" fill="#24160f"/>`;
    b += `<path d="M ${x1} 548 L ${x1} 196 Q ${(x1 + x2) / 2} 82 ${x2} 196 L ${x2} 548 Z" fill="${S.lin([[0, '#a8c6ec'], [0.6, '#6f93c4'], [1, '#4f70a0']])}"/>`;
    b += `<path d="M ${x1} 470 Q ${x1 + w * .3} 430 ${x1 + w * .5} 460 Q ${x1 + w * .75} 420 ${x2} 450 L ${x2} 548 L ${x1} 548 Z" fill="#dce8f8" opacity=".8"/>`;
    for (let i = 0; i < 40; i++) b += `<circle cx="${x1 + r() * w}" cy="${120 + r() * 420}" r="${1.5 + r() * 3.5}" fill="#fff" opacity="${.5 + r() * .5}"/>`;
    b += `<path d="M ${x1} 548 L ${x1} 196 Q ${(x1 + x2) / 2} 82 ${x2} 196 L ${x2} 548 Z" fill="none" stroke="#f4f8ff" stroke-width="44" opacity=".55" filter="${S.blur(16)}"/>`;
    b += `<rect x="${(x1 + x2) / 2 - 7}" y="100" width="14" height="450" fill="#24160f"/><rect x="${x1}" y="320" width="${w}" height="12" fill="#24160f"/>`;
    b += `<rect x="${x1 - 30}" y="548" width="${w + 60}" height="22" fill="#4a2e20"/><rect x="${x1 - 30}" y="548" width="${w + 60}" height="4" fill="#cfe2ff" opacity=".6"/>`;
    b += `<path d="M ${x1} 200 L ${x2} 200 L ${x2 + 260} 1080 L ${x1 - 120} 1080 Z" fill="#9fc0ff" opacity=".08" filter="${S.blur(40)}" style="mix-blend-mode:screen"/>`;
  });
  // ----- portrait of the open hand -----
  b += `<g transform="translate(960 0) scale(.84) translate(-960 -6)">`;
  b += S.glow(960, 160, 360, '#ffc865', .45);
  b += `<rect x="790" y="34" width="340" height="236" fill="${S.lin([[0, '#e0b25a'], [0.5, '#a8742c'], [1, '#d4a04a']], 0, 0, 1, 1)}"/>`;
  b += `<rect x="808" y="52" width="304" height="200" fill="${S.rad([[0, '#ffe6a8'], [0.55, '#e0a650'], [1, '#8a5a22']], .5, .55, .7)}"/>`;
  for (let i = 0; i < 14; i++) { const ang = Math.PI + i * Math.PI / 13; b += `<path d="M 960 200 L ${P(960 + Math.cos(ang) * 260)} ${P(200 + Math.sin(ang) * 260)}" stroke="#fff3c8" stroke-width="7" opacity=".22"/>`; }
  // open hand in the painting
  const HL = [0, -1], HR = [0.3, -1];
  b += `<g clip-path="url(#pclip)">`;
  S.defs.push(`<clipPath id="pclip"><rect x="808" y="52" width="304" height="200"/></clipPath>`);
  b += handFromParts(S, limb([[960, 262], [960, 196]], [70, 92]), [
    { p: [[924, 182], [912, 140], [906, 112]], w: [22, 20, 17] },
    { p: [[948, 172], [944, 120], [942, 88]], w: [23, 21, 18] },
    { p: [[972, 172], [976, 122], [978, 92]], w: [23, 21, 18] },
    { p: [[994, 182], [1006, 142], [1014, 116]], w: [21, 19, 16] },
    { p: [[912, 220], [882, 196], [868, 172]], w: [26, 22, 18] },
  ], { skin: '#ffdc94', sh: '#a0601e', rim: '#fff8e0', L: HL, R: HR, sd: 12, rd: 4 });
  b += `</g>`;
  b += `<rect x="790" y="34" width="340" height="236" fill="none" stroke="#5a3a14" stroke-width="3"/>`;
  // wreath garland around frame
  const wr = rng(5);
  const ring = [];
  for (let i = 0; i < 60; i++) { const t = i / 60 * 2 * Math.PI; ring.push([960 + Math.cos(t) * 196 * (1 + .02 * Math.sin(t * 7)), 152 + Math.sin(t) * 148]); }
  ring.forEach(([x, y]) => { for (let k = 0; k < 3; k++) { const a = wr() * 360; b += `<ellipse cx="${P(x + (wr() - .5) * 18)}" cy="${P(y + (wr() - .5) * 18)}" rx="17" ry="7" transform="rotate(${P(a)} ${P(x)} ${P(y)})" fill="${['#2e4a2a', '#3c5e32', '#24391f'][k]}"/>`; } });
  ring.forEach(([x, y], i) => { if (i % 4 === 0) b += `<circle cx="${P(x + 6)}" cy="${P(y - 4)}" r="5" fill="#c23a2e"/><circle cx="${P(x + 4.5)}" cy="${P(y - 5.5)}" r="1.6" fill="#ffd0c0"/>`; });
  b += `<path d="M 960 268 L 960 300" stroke="#1a100a" stroke-width="2"/><circle cx="960" cy="268" r="4" fill="#c8a050"/>`;
  // empty glove hanging
  b += S.form('M 936 300 L 984 300 L 988 336 C 1000 336 1004 352 996 360 L 990 386 C 990 398 980 402 974 398 C 970 404 958 404 954 398 C 948 402 938 400 938 390 L 932 360 C 926 352 928 340 936 336 Z', { fill: '#7a2a24', L: [0, 1], R: [0, -1], sd: 14, rd: 4, rim: '#ffd0a0' });
  b += `<path d="M 936 312 L 984 312 M 936 322 L 984 322" stroke="#e8d8c0" stroke-width="3" opacity=".7"/>`;
  b += `</g>`;
  // ----- family behind table -----
  const lightAt = (x, y) => { const lx = 960 - x, ly = 760 - y; const m = Math.hypot(lx, ly); return [lx / m, ly / m]; };
  const person = (key, x, y, s, face, body, faceO) => {
    S.L = lightAt(x, y);
    let g = torso(S, { x, y, s, face, neck: CAST[key].skinSh, ...body });
    g += head(S, { ...CAST[key], x, y, s, face, ...faceO });
    return g;
  };
  b += person('mother', 645, 470, .8, 1, { color: '#6b3e52', shawl: '#a8875a' }, { eyes: { look: [1, .1], lid: .5 }, brows: { in: -6, out: 4, w: 8 }, mouth: 'sigh' });
  b += person('elias', 1275, 485, .8, 1, { color: '#7a3b2a', scarf: '#d8b24a', scarf2: '#c49a32' }, { eyes: { look: [1, .15], lid: .55 }, brows: { in: 2, out: -2 }, mouth: 'smirk' });
  b += person('father', 960, 486, .92, 1, { color: '#4a4a2e', collar: '#7a6a52', wide: 1.15, ribs: true }, { eyes: { look: [1, .2], lid: .45 }, brows: { in: 10, out: -4, w: 13 }, mouth: 'tight' });
  b += person('sister', 300, 484, .86, 1, { color: '#d9cbb0', scarf: '#b63a36', scarf2: '#9a2e2a', ribs: true }, { eyes: { look: [1, .05], lid: .4 }, brows: { in: -3, out: 2 }, mouth: 'flat' });
  b += person('varun', 1610, 474, .96, -1, { color: '#2d3a52', scarf: '#8a8f99', scarf2: '#767b85' }, { eyes: { look: [.6, .45], lid: .42 }, brows: { in: 4, out: 0, w: 10 }, mouth: 'flat' });
  // ----- table -----
  b += `<path d="M 120 700 L 1800 700 L 1900 950 L 20 950 Z" fill="${S.lin([[0, '#5e3220'], [1, '#8a5232']])}"/>`;
  for (let i = 0; i < 8; i++) b += `<path d="M ${200 + i * 30} ${715 + i * 30} L ${1720 - i * 0} ${715 + i * 30}" stroke="#2a140a" stroke-width="2" opacity=".18"/>`;
  b += `<path d="M 120 700 L 1800 700 L 1900 950 L 20 950 Z" fill="${S.rad([[0, '#ffbf6a', .6], [1, '#ffbf6a', 0]], .5, .3, .55)}"/>`;
  b += `<path d="M 120 700 L 1800 700 L 1806 716 L 114 716 Z" fill="#000" opacity=".35"/>`;
  b += `<path d="M 20 950 L 1900 950 L 1900 1080 L 20 1080 Z" fill="${S.lin([[0, '#a8322c'], [1, '#4a1412']])}"/>`;
  b += `<path d="M 20 950 L 1900 950 L 1900 966 L 20 966 Z" fill="#e8c890" opacity=".6"/>`;
  // plates
  [[300, 840], [645, 830], [1275, 830], [1600, 840]].forEach(([x, y]) => b += `<ellipse cx="${x}" cy="${y + 8}" rx="100" ry="28" fill="#000" opacity=".25"/><ellipse cx="${x}" cy="${y}" rx="98" ry="27" fill="#e8dcc4"/><ellipse cx="${x}" cy="${y}" rx="64" ry="16" fill="#d0c2a6"/><path d="M ${x - 98} ${y} A 98 27 0 0 0 ${x + 98} ${y}" stroke="#ffd8a0" stroke-width="3" fill="none" opacity=".4"/>`);
  b += `<g transform="translate(0 40)">`;
  // stew pot
  b += `<ellipse cx="960" cy="790" rx="150" ry="26" fill="#000" opacity=".35" filter="${S.blur(8)}"/>`;
  b += S.form('M 830 726 L 1090 726 C 1094 770 1070 796 960 798 C 850 796 826 770 830 726 Z', { fill: '#2a2a30', L: [0, -1], R: [0, -1], sd: 26, rd: 6, rim: '#ffc070', sh: '#000' });
  b += `<ellipse cx="960" cy="726" rx="130" ry="20" fill="#6a2e1a"/><ellipse cx="960" cy="726" rx="110" ry="14" fill="#a8502a"/>`;
  b += `<ellipse cx="930" cy="724" rx="16" ry="5" fill="#e8a040"/><ellipse cx="990" cy="728" rx="12" ry="4" fill="#5a8a3a"/>`;
  // bread
  b += S.form('M 1090 770 C 1100 740 1180 736 1200 760 C 1206 776 1180 790 1140 790 C 1104 790 1086 784 1090 770 Z', { fill: '#c8843a', L: [0, -1], R: [0, -1], sd: 14, rd: 4, rim: '#ffe0a0' });
  // candles
  [780, 1440].forEach(x => {
    b += `<rect x="${x - 10}" y="640" width="20" height="90" fill="#efe2c8"/><rect x="${x - 10}" y="640" width="6" height="90" fill="#fff" opacity=".4"/>`;
    b += `<ellipse cx="${x}" cy="732" rx="26" ry="7" fill="#b88a4a"/>`;
    b += `<path d="M ${x} 600 C ${x + 12} 616 ${x + 10} 636 ${x} 640 C ${x - 10} 636 ${x - 12} 616 ${x} 600 Z" fill="#ffd27a"/><path d="M ${x} 616 C ${x + 5} 626 ${x + 4} 634 ${x} 638 C ${x - 4} 634 ${x - 5} 626 ${x} 616 Z" fill="#fff6d8"/>`;
    b += S.glow(x, 622, 260, '#ffb04a', .6);
  });
  b += `</g>`;
  // ----- joined hands across the table -----
  const arm = (pts, ws, c, L) => S.form(limb(pts, ws), { fill: c, L, R: [0, -1], sd: 22, rd: 5 });
  const clasp = (x, y, c1, c2, skA, skB) => {
    let g = '';
    g += S.form(`M ${x - 40} ${y - 6} C ${x - 30} ${y - 26} ${x + 4} ${y - 26} ${x + 14} ${y - 10} C ${x + 18} ${y + 4} ${x + 6} ${y + 16} ${x - 14} ${y + 16} C ${x - 32} ${y + 16} ${x - 44} ${y + 6} ${x - 40} ${y - 6} Z`, { fill: skA, L: [0, 1], R: [0, -1], sd: 10, rd: 4 });
    g += S.form(`M ${x + 40} ${y - 2} C ${x + 30} ${y - 22} ${x - 4} ${y - 24} ${x - 16} ${y - 8} C ${x - 22} ${y + 6} ${x - 6} ${y + 18} ${x + 14} ${y + 18} C ${x + 32} ${y + 18} ${x + 44} ${y + 10} ${x + 40} ${y - 2} Z`, { fill: skB, L: [0, 1], R: [0, -1], sd: 10, rd: 4 });
    for (let k = 0; k < 3; k++) g += `<path d="M ${x - 12 + k * 8} ${y - 14} q 3 10 0 22" stroke="#4a2418" stroke-width="1.6" opacity=".5" fill="none"/>`;
    return g;
  };
  // sister(300) — mother(645): meet at 470
  b += arm([[400, 640], [436, 712], [452, 766]], [62, 52, 34], '#d9cbb0', [1, .3]);
  b += arm([[560, 650], [518, 716], [494, 768]], [58, 50, 34], '#6b3e52', [1, .3]);
  b += clasp(472, 770, null, null, CAST.sister.skin, CAST.mother.skin);
  // mother — father: meet at 805
  b += arm([[730, 650], [772, 716], [788, 768]], [58, 50, 34], '#6b3e52', [1, .3]);
  b += arm([[850, 660], [836, 718], [826, 770]], [70, 58, 38], '#4a4a2e', [0, 1]);
  b += clasp(806, 772, null, null, CAST.mother.skin, CAST.father.skin);
  // father — elias: meet at 1120
  b += arm([[1070, 660], [1090, 718], [1100, 770]], [70, 58, 38], '#4a4a2e', [0, 1]);
  b += arm([[1192, 660], [1158, 718], [1140, 770]], [58, 50, 34], '#7a3b2a', [-1, .3]);
  b += clasp(1120, 772, null, null, CAST.father.skin, CAST.elias.skin);
  // Elias's empty hand reaching toward Varun
  b += arm([[1356, 660], [1392, 724], [1424, 766]], [58, 50, 34], '#7a3b2a', [-1, .3]);
  b += `<g transform="translate(-50 40)">` + handFromParts(S, limb([[1476, 730], [1510, 726]], [30, 34]), [
    { p: [[1516, 714], [1540, 708], [1556, 710]], w: [17, 15, 13] },
    { p: [[1520, 724], [1546, 722], [1562, 726]], w: [17, 15, 13] },
    { p: [[1518, 734], [1542, 736], [1556, 742]], w: [16, 14, 12] },
    { p: [[1510, 742], [1530, 748], [1542, 754]], w: [14, 12, 11] },
    { p: [[1494, 716], [1510, 700], [1526, 696]], w: [18, 15, 13], back: true },
  ], { skin: CAST.elias.skin, L: [-1, .5], R: [0, -1], sd: 8, rd: 3 }) + `</g>`;
  // Varun's crossed arms (refusing)
  b += `<g transform="translate(-50 4)">`;
  b += arm([[1560, 640], [1600, 690], [1690, 680], [1740, 650]], [52, 50, 46, 40], '#26324a', [-1, .6]);
  b += S.form('M 1736 632 C 1760 626 1774 640 1770 656 C 1766 668 1748 672 1738 664 Z', { fill: CAST.varun.skin, L: [-1, .6], R: [0, -1], sd: 8, rd: 3 });
  b += arm([[1770, 630], [1720, 676], [1630, 690], [1580, 660]], [54, 52, 48, 42], '#2d3a52', [-1, .6]);
  b += S.form('M 1584 642 C 1562 636 1546 650 1550 666 C 1554 678 1572 682 1584 674 Z', { fill: CAST.varun.skin, L: [-1, .6], R: [0, -1], sd: 8, rd: 3 });
  b += `</g>`;
  // steam rising from the pot
  for (let k = 0; k < 4; k++) { const x = 900 + k * 40; b += `<path d="${limb([[x, 756], [x + 14, 700], [x - 6, 640], [x + 10, 580], [x - 4, 510]], [18, 26, 30, 24, 8])}" fill="#fff4e6" opacity=".16" filter="${S.blur(8)}"/>`; }
  // warm bloom + cool fill
  b += S.glow(960, 700, 900, '#ff9a40', .25);
  b += S.grain(.08) + S.vignette(.7);
  return S.svg(b);
};

// ---------- FRAME 3: Father's fist. Mother's hand. "Joseph." ----------
SCENES.fist = () => {
  const S = new Scene({ L: [-0.6, -0.8], R: [1, -0.25], sh: '#2a0e12', rim: '#9cc6ff', key: '#ffb45a', kd: 60, keyo: .3 });
  const r = rng(21);
  let b = '';
  b += `<rect width="1920" height="1080" fill="${S.lin([[0, '#2a1812'], [1, '#120a08']])}"/>`;
  // --- out-of-focus background ---
  b += `<g filter="${S.blur(22)}">`;
  b += `<rect x="0" y="0" width="1920" height="520" fill="#3a2418"/>`;
  b += `<path d="M 1100 520 C 1080 300 1160 120 1340 60 C 1500 10 1700 20 1920 60 L 1920 520 Z" fill="#3e3e26"/>`;
  b += `<path d="M 1320 70 C 1400 140 1560 150 1640 60 L 1600 0 L 1360 0 Z" fill="#6a5a44"/>`;
  b += `<rect x="60" y="40" width="300" height="380" fill="#5a7aaa" opacity=".6"/>`;
  b += `</g>`;
  b += S.glow(380, 250, 330, '#ff9a3a', .75);
  b += `<ellipse cx="380" cy="235" rx="18" ry="34" fill="#ffe6a8" filter="${S.blur(8)}"/>`;
  for (let i = 0; i < 14; i++) { const x = r() * 1920, y = r() * 420, rr = 18 + r() * 40, warm = x < 1000; b += `<circle cx="${P(x)}" cy="${P(y)}" r="${P(rr)}" fill="${warm ? '#ffb45a' : '#8fb4ff'}" opacity="${P(.08 + r() * .14)}" style="mix-blend-mode:screen"/>`; }
  // --- table ---
  b += `<path d="M 0 440 L 1920 440 L 1920 1080 L 0 1080 Z" fill="${S.lin([[0, '#4a2a18'], [0.5, '#6e3e22'], [1, '#3a1e10']])}"/>`;
  for (let i = 0; i < 14; i++) { const x = -800 + i * 260; b += `<path d="M ${960 + (x - 960) * 0.3} 440 L ${x} 1080" stroke="#1a0a04" stroke-width="3" opacity=".22"/>`; }
  for (let i = 0; i < 10; i++) { const y = 470 + i * i * 7; b += `<path d="M 0 ${y} Q 960 ${y + 8} 1920 ${y - 4}" stroke="#ffcf8a" stroke-width="1.4" opacity=".07" fill="none"/>`; }
  b += `<rect x="0" y="436" width="1920" height="10" fill="#000" opacity=".4" filter="${S.blur(4)}"/>`;
  b += S.ellipseGlow(560, 560, 700, 220, '#ff9a40', .5);
  // plate + fork (soft focus foreground)
  b += `<g filter="${S.blur(3)}">`;
  b += `<ellipse cx="230" cy="930" rx="300" ry="96" fill="#000" opacity=".3"/><ellipse cx="230" cy="916" rx="296" ry="92" fill="#e2d4ba"/><ellipse cx="230" cy="916" rx="200" ry="58" fill="#cbbb9c"/>`;
  b += `<path d="M 570 1000 L 760 900" stroke="#b8b0a0" stroke-width="14" stroke-linecap="round"/><path d="M 760 900 l 40 -24 M 762 906 l 44 -18 M 764 912 l 44 -10" stroke="#b8b0a0" stroke-width="6" stroke-linecap="round"/>`;
  b += `</g>`;
  // --- father's sleeve + fist ---
  const fs = CAST.father.skin;
  b += `<ellipse cx="980" cy="790" rx="230" ry="30" fill="#000" opacity=".6" filter="${S.blur(14)}"/>`;
  b += S.form(limb([[1760, 170], [1420, 400], [1150, 560]], [340, 280, 210]), { fill: '#4a4a2e', sd: 80, rd: 6, rimo: .4 });
  for (let i = 0; i < 12; i++) b += `<path d="M ${1260 + i * 40} ${300 + i * 14} l -60 120" stroke="#000" stroke-width="4" opacity=".08"/>`;
  b += S.form(limb([[1190, 520], [1110, 580]], [214, 200]), { fill: '#3c3c24', sd: 30, rd: 5, rimo: .4 });
  for (let i = 0; i < 10; i++) b += `<path d="M ${1060 + i * 22} ${640 - i * 18} l 70 70" stroke="#000" stroke-width="3" opacity=".14"/>`;
  // back of hand (foreshortened)
  b += S.form('M 846 690 C 838 610 878 566 958 552 C 1040 538 1120 548 1146 590 C 1166 630 1120 690 1104 726 L 852 726 Z', { fill: fs, sd: 40, rd: 6, key: true });
  b += `<path d="M 940 572 Q 1000 590 1060 572 M 960 600 Q 1010 612 1070 598" stroke="#f0cfae" stroke-width="4" opacity=".22" fill="none" stroke-linecap="round"/>`;
  // four curled fingers, side by side
  const pill = (x1, y1, x2, y2) => { const rr = (x2 - x1) / 2; return `M ${x1} ${y1 + rr} A ${rr} ${rr} 0 0 1 ${x2} ${y1 + rr} L ${x2} ${y2 - rr} A ${rr} ${rr} 0 0 1 ${x1} ${y2 - rr} Z`; };
  [[1036, 652, 1098, 770], [974, 638, 1044, 780], [910, 632, 982, 786], [846, 642, 918, 782]].forEach(([x1, y1, x2, y2]) => {
    b += S.form(pill(x1, y1, x2, y2), { fill: fs, sd: 20, rd: 5, key: true, sho: .7 });
    const cx = (x1 + x2) / 2, my = y1 + (y2 - y1) * .42;
    b += `<path d="M ${x1 + 10} ${my} Q ${cx} ${my + 7} ${x2 - 10} ${my}" stroke="#4a2418" stroke-width="2.6" fill="none" opacity=".6"/>`;
    b += `<path d="M ${x1 + 14} ${my + 9} Q ${cx} ${my + 14} ${x2 - 14} ${my + 9}" stroke="#4a2418" stroke-width="1.6" fill="none" opacity=".35"/>`;
    b += `<ellipse cx="${cx}" cy="${y1 + 24}" rx="${(x2 - x1) * .32}" ry="14" fill="#f6dcc0" opacity=".6" filter="${S.blur(5)}"/>`;
  });
  // thumb wrapped across the front
  b += S.form(limb([[834, 690], [880, 742], [944, 748], [990, 740]], [64, 58, 50, 44]), { fill: fs, sd: 22, rd: 5, key: true });
  b += `<path d="M 984 722 C 1004 722 1012 748 994 758 L 974 758 C 968 746 970 728 984 722 Z" fill="#d6a07e"/>`;
  b += `<path d="M 930 726 Q 924 748 932 768" stroke="#4a2418" stroke-width="2.4" fill="none" opacity=".5"/>`;
  // --- mother's sleeve + hand ---
  const ms = CAST.mother.skin, ML = [-0.6, -0.8];
  b += S.form(limb([[60, 280], [420, 430], [740, 532]], [270, 220, 160]), { fill: '#6b3e52', sd: 70, rd: 6, rimo: .35 });
  for (let i = 0; i < 12; i++) b += `<path d="M ${140 + i * 48} ${300 + i * 20} l 40 -100" stroke="#000" stroke-width="3" opacity=".08"/>`;
  b += S.form(limb([[700, 512], [770, 540]], [168, 156]), { fill: '#552f42', sd: 24, rd: 5, rimo: .35 });
  for (let i = 0; i < 6; i++) b += `<path d="M ${712 + i * 12} ${450 + i * 6} l -14 130" stroke="#000" stroke-width="3" opacity=".15"/>`;
  b += `<ellipse cx="1000" cy="630" rx="140" ry="34" fill="#1a0806" opacity=".35" filter="${S.blur(14)}"/>`;
  b += handFromParts(S, limb([[776, 544], [934, 576]], [112, 124]), [
    { p: [[926, 548], [1000, 558], [1062, 584], [1092, 624]], w: [30, 27, 24, 21], back: true },
    { p: [[934, 570], [1006, 584], [1052, 616], [1070, 654]], w: [33, 30, 27, 23] },
    { p: [[930, 594], [990, 610], [1024, 640], [1036, 676]], w: [31, 28, 25, 21] },
    { p: [[916, 614], [958, 632], [982, 660], [990, 690]], w: [27, 24, 21, 18] },
    { p: [[808, 580], [834, 622], [846, 662]], w: [42, 36, 30] },
  ], { skin: ms, L: ML, R: S.R, sh: S.sh, rim: S.rim, sd: 14, rd: 4 });
  [[988, 686, 75], [1034, 672, 70], [1068, 650, 62], [1090, 620, 55], [846, 660, 80]].forEach(([x, y, a]) => b += `<ellipse cx="${x}" cy="${y}" rx="9" ry="7" transform="rotate(${a} ${x} ${y})" fill="#ecc4a8" opacity=".85"/>`);
  b += `<path d="M 974 596 Q 984 612 980 630" stroke="#e8b84a" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M 972 598 Q 979 607 977 616" stroke="#fff2c0" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  [[948, 556], [952, 580], [946, 604]].forEach(([x, y]) => b += `<path d="M ${x} ${y - 8} q 4 8 0 16" stroke="#6a3424" stroke-width="2" opacity=".35" fill="none"/>`);
  b += S.glow(560, 400, 900, '#ff8a3a', .18);
  b += S.grain(.08) + S.vignette(.85);
  return S.svg(b);
};
