// Character presets
const CAST = {
  varun:  { skin: '#b27a5c', skinSh: '#8a5640', hairC: '#1d1313', hair: 'varun', nose: 'reg', stubble: .25, iris: '#3a2214', browC: '#170d0d', headShape: HEAD },
  father: { skin: '#a46c4c', skinSh: '#7c4a34', hairC: '#8e8a86', browC: '#5e5853', hair: 'father', nose: 'big', mustache: true, lines: true, headShape: HEAD_SQUARE, iris: '#3a2416' },
  mother: { skin: '#bb8366', skinSh: '#91593f', hairC: '#2a1c18', hair: 'mother', nose: 'soft', lips: '#9a4a44', headShape: HEAD_SOFT, iris: '#4a2e18' },
  elias:  { skin: '#ad7454', skinSh: '#86523a', hairC: '#231715', hair: 'elias', nose: 'reg', beanie: '#2f5d5a', beanieCuff: '#24494a', pom: '#e9dccb', headShape: HEAD, iris: '#3a2214' },
  sister: { skin: '#be8769', skinSh: '#94603f', hairC: '#2b1a16', hair: 'sister', nose: 'small', headShape: HEAD_SOFT, earmuff: '#d4574a', ribbon: '#d4574a', lips: '#a44c48', iris: '#4a2e18' },
};

// Simple hand from finger polylines. fingers: [[pts, widths], ...]
function handFromParts(S, palm, fingers, o) {
  let g = '';
  const F = (d, x = {}) => S.form(d, { fill: o.skin, key: true, sd: o.sd ?? 10, rd: o.rd ?? 4, sho: .55, sh: o.sh, rim: o.rim, L: o.L, R: o.R, ...x });
  fingers.filter(f => f.back).forEach(f => g += F(limb(f.p, f.w)));
  g += F(palm, { sd: (o.sd ?? 10) * 1.5 });
  fingers.filter(f => !f.back).forEach(f => g += F(limb(f.p, f.w)));
  return g;
}
