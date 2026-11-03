// Procedural "hand-painted" textures drawn on a canvas.
// Everything is seeded so every frame renders identically.
import * as THREE from 'three';

export const rng = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
};

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const mix = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

export const toTexture = (c: HTMLCanvasElement, repeat = 1) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  return t;
};

// Short, soft brush daubs layered over a base colour.
export const brushStrokes = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: string[],
  count: number,
  size: number,
  alpha: number,
  r: () => number,
  angle = 0,
) => {
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const x = r() * w;
    const y = r() * h;
    const len = size * (0.6 + r() * 1.2);
    const a = angle + (r() - 0.5) * 0.9;
    ctx.strokeStyle = colors[Math.floor(r() * colors.length)];
    ctx.globalAlpha = alpha * (0.4 + r() * 0.6);
    ctx.lineWidth = size * (0.25 + r() * 0.35);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(a) * len * 0.5 + (r() - 0.5) * size * 0.4,
      y + Math.sin(a) * len * 0.5 + (r() - 0.5) * size * 0.4,
      x + Math.cos(a) * len,
      y + Math.sin(a) * len,
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

const wobblyLine = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: () => number,
  wob: number,
) => {
  const steps = 8;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    ctx.lineTo(x1 + (x2 - x1) * t + (r() - 0.5) * wob, y1 + (y2 - y1) * t + (r() - 0.5) * wob);
  }
  ctx.stroke();
};

// Warm sandstone with painted blocks.
export const stoneTexture = (
  seed: number,
  opts: {blocksX: number; blocksY: number; base?: string; w?: number; h?: number},
) => {
  const W = opts.w ?? 1024;
  const H = opts.h ?? 1024;
  const c = canvas(W, H);
  const ctx = c.getContext('2d')!;
  const r = rng(seed);
  const base = opts.base ?? '#f0b77a';
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  // Big tonal patches, then smaller strokes.
  brushStrokes(ctx, W, H, ['#f7cf8f', '#e79c68', '#f4a98a', '#ffd9a0', '#d98b62'], 260, 120, 0.35, r);
  brushStrokes(ctx, W, H, ['#ffe2b0', '#e48f63', '#f2b48c', '#c97a5a', '#ffd08a'], 1400, 34, 0.35, r);
  // Blocks: each gets its own slight tint, a lit top edge and a shaded bottom edge.
  const bw = W / opts.blocksX;
  const bh = H / opts.blocksY;
  for (let j = 0; j < opts.blocksY; j++) {
    const off = j % 2 ? bw / 2 : 0;
    for (let i = -1; i < opts.blocksX + 1; i++) {
      const x = i * bw + off;
      const y = j * bh;
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = ['#ffcf96', '#e0956b', '#f6b38f', '#ffe0a8'][Math.floor(r() * 4)];
      ctx.fillRect(x + 4, y + 4, bw - 8, bh - 8);
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#fff0c8';
      ctx.lineWidth = 5;
      wobblyLine(ctx, x + 10, y + 10, x + bw - 10, y + 10, r, 4);
      ctx.strokeStyle = '#a85a4a';
      ctx.lineWidth = 7;
      wobblyLine(ctx, x + 10, y + bh - 8, x + bw - 10, y + bh - 8, r, 4);
      ctx.globalAlpha = 1;
    }
  }
  // Ink seams.
  ctx.strokeStyle = '#5a2c3a';
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 5;
  for (let j = 0; j <= opts.blocksY; j++) wobblyLine(ctx, 0, j * bh, W, j * bh, r, 5);
  for (let j = 0; j < opts.blocksY; j++) {
    const off = j % 2 ? bw / 2 : 0;
    for (let i = 0; i <= opts.blocksX; i++) {
      const x = i * bw + off;
      wobblyLine(ctx, x, j * bh, x, (j + 1) * bh, r, 5);
    }
  }
  // A few chips and cracks.
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const x = r() * W;
    const y = r() * H;
    ctx.globalAlpha = 0.35;
    wobblyLine(ctx, x, y, x + (r() - 0.5) * 70, y + r() * 50, r, 14);
  }
  ctx.globalAlpha = 1;
  return c;
};

// Carve words into a stone canvas (dark recess, lit lower lip, shaded upper lip).
export const carveText = (c: HTMLCanvasElement, lines: string[], seed: number) => {
  const ctx = c.getContext('2d')!;
  const r = rng(seed);
  const W = c.width;
  const H = c.height;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate((r() - 0.5) * 0.08);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = W / 7.2;
  ctx.font = `900 ${size}px "Trebuchet MS", "DejaVu Sans", sans-serif`;
  lines.forEach((line, i) => {
    const y = (i - (lines.length - 1) / 2) * size * 1.15;
    ctx.fillStyle = 'rgba(255,240,200,0.9)';
    ctx.fillText(line, 3, y + 5);
    ctx.fillStyle = '#4a1f33';
    ctx.fillText(line, 0, y);
    ctx.fillStyle = 'rgba(120,50,70,0.6)';
    ctx.fillText(line, -2, y - 3);
  });
  ctx.restore();
};

// A soft painted cloud puff with a pale outline, like a cel-animation background cloud.
export const cloudTexture = (seed: number, tint = '#ffffff', shade = '#b9a6e8', rim = '#ffe1c2') => {
  const W = 1024;
  const H = 512;
  const c = canvas(W, H);
  const ctx = c.getContext('2d')!;
  const r = rng(seed);
  const puffs: [number, number, number][] = [];
  const n = 9 + Math.floor(r() * 5);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = 140 + t * (W - 280) + (r() - 0.5) * 60;
    const rad = 70 + Math.sin(t * Math.PI) * 120 * (0.7 + r() * 0.5);
    const y = H - 110 - rad * 0.55 - (r() - 0.5) * 30;
    puffs.push([x, y, rad]);
  }
  const shape = () => {
    ctx.beginPath();
    puffs.forEach(([x, y, rad]) => {
      ctx.moveTo(x + rad, y);
      ctx.arc(x, y, rad, 0, Math.PI * 2);
    });
    ctx.rect(150, H - 160, W - 300, 70);
  };
  // Pale outline, drawn a little larger.
  ctx.save();
  ctx.lineWidth = 16;
  ctx.strokeStyle = rim;
  ctx.globalAlpha = 0.8;
  shape();
  ctx.stroke();
  ctx.restore();
  // Base fill with a vertical gradient: lit top, cool shaded belly.
  const g = ctx.createLinearGradient(0, 40, 0, H - 90);
  g.addColorStop(0, tint);
  g.addColorStop(0.55, mix(tint, shade, 0.25));
  g.addColorStop(1, shade);
  ctx.fillStyle = g;
  shape();
  ctx.fill();
  // Hard-edged cel shadow band along the belly.
  ctx.save();
  shape();
  ctx.clip();
  ctx.fillStyle = shade;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  puffs.forEach(([x, y, rad]) => {
    ctx.moveTo(x + rad, y + rad * 0.55);
    ctx.arc(x, y + rad * 0.55, rad * 0.95, 0, Math.PI * 2);
  });
  ctx.rect(0, H - 150, W, 200);
  ctx.fill();
  brushStrokes(ctx, W, H, ['#ffffff', rim, shade], 220, 40, 0.18, r);
  ctx.restore();
  return c;
};

// Radial glow sprite.
export const glowTexture = (inner: string, outer: string) => {
  const c = canvas(512, 512);
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  return c;
};

// Body skin for the caterpillar: painted green-teal with a soft belly.
export const skinTexture = (seed: number, base: string, light: string, dark: string, spot: string) => {
  const W = 512;
  const H = 256;
  const c = canvas(W, H);
  const ctx = c.getContext('2d')!;
  const r = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  brushStrokes(ctx, W, H, [light, dark, base], 500, 22, 0.25, r);
  // Soft lighter belly band, then a row of small dots along the back.
  ctx.fillStyle = light;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, H * 0.68, W, H * 0.32);
  ctx.globalAlpha = 1;
  ctx.fillStyle = spot;
  for (let i = 0; i < 12; i++) {
    const u = (i + 0.5) / 12;
    ctx.beginPath();
    ctx.arc(u * W, H * 0.3 + Math.sin(i * 2.1) * 6, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
};

// Equirect face map for a sphere head. Front of a SphereGeometry is u = 0.25.
export type Face = {
  look: [number, number]; // pupil offset, -1..1
  lid: number; // 0 open .. 1 closed (upper lid)
  brow: number; // -1 sad/worried .. 1 determined
  mouth: 'flat' | 'smile' | 'open' | 'grit' | 'o' | 'scream' | 'soft' | 'pant';
  sweat?: boolean;
  squeeze?: boolean; // eyes squeezed shut (> <)
  catchColor?: string; // colour of the eye catch-lights (fire, glow)
  elder?: boolean; // white bushy brows and a moustache
};

export const faceTexture = (base: string, light: string, dark: string, face: Face) => {
  const W = 2048;
  const H = 1024;
  const c = canvas(W, H);
  const ctx = c.getContext('2d')!;
  const r = rng(7);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  brushStrokes(ctx, W, H, [light, dark, base], 1600, 40, 0.22, r);
  const cx = W * 0.25;
  const cy = H * 0.5;
  const ink = '#24152e';
  // Cheeks.
  ctx.fillStyle = face.mouth === 'scream' ? 'rgba(0,0,0,0)' : 'rgba(255,120,160,0.7)';
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.ellipse(cx + s * 175, cy + 95, 52, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  // Eyes: tall white ovals, big pupils with a catch-light, then lids and brows.
  [-1, 1].forEach((s) => {
    const ex = cx + s * 92;
    const ey = cy - 30;
    const rx = 70;
    const ry = 96;
    if (face.squeeze) {
      // Anguish: eyes screwed shut (thick > <), tears streaming, brows pinched up in the middle.
      ctx.strokeStyle = ink;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.moveTo(ex - s * 55, ey - 45);
      ctx.lineTo(ex + s * 35, ey + 5);
      ctx.lineTo(ex - s * 55, ey + 50);
      ctx.stroke();
      ctx.lineWidth = 9;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(ex + s * (40 + k * 6), ey - 70 + k * 40);
        ctx.lineTo(ex + s * (70 + k * 8), ey - 80 + k * 44);
        ctx.stroke();
      }
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(ex + s * 60, ey - ry - 40);
      ctx.quadraticCurveTo(ex, ey - ry - 10, ex - s * 60, ey - ry + 5);
      ctx.stroke();
      // Tears.
      ctx.fillStyle = '#8fdcff';
      ctx.strokeStyle = ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(ex - s * 30, ey + 40);
      ctx.bezierCurveTo(ex - s * 60, ey + 120, ex - s * 20, ey + 200, ex - s * 45, ey + 260);
      ctx.lineTo(ex - s * 75, ey + 255);
      ctx.bezierCurveTo(ex - s * 55, ey + 190, ex - s * 85, ey + 120, ex - s * 55, ey + 40);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, ey, rx, ry, s * -0.08, 0, Math.PI * 2);
    ctx.fillStyle = '#fffaf0';
    ctx.fill();
    ctx.clip();
    const px = ex + face.look[0] * 26;
    const py = ey + face.look[1] * 34;
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.ellipse(px, py, 38, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = face.catchColor ?? '#ffffff';
    ctx.beginPath();
    ctx.ellipse(px + 13, py - 18, 13, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px - 12, py + 18, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Upper lid, tilted by brow so it reads as a mood.
    if (face.lid > 0) {
      ctx.fillStyle = mix(base.length === 7 ? base : '#7fd36a', '#2a6b52', 0.15);
      ctx.beginPath();
      const lidY = ey - ry + face.lid * ry * 1.6;
      const tilt = face.brow * 26 * s;
      ctx.moveTo(ex - rx - 10, ey - ry - 20);
      ctx.lineTo(ex + rx + 10, ey - ry - 20);
      ctx.lineTo(ex + rx + 10, lidY + tilt);
      ctx.lineTo(ex - rx - 10, lidY - tilt);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(ex - rx - 10, lidY - tilt);
      ctx.lineTo(ex + rx + 10, lidY + tilt);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.ellipse(ex, ey, rx, ry, s * -0.08, 0, Math.PI * 2);
    ctx.stroke();
    // Brow.
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const by = ey - ry - 34;
    ctx.moveTo(ex - s * 62, by + face.brow * 34);
    ctx.quadraticCurveTo(ex, by - 10 + face.brow * 4, ex + s * 58, by - face.brow * 26);
    ctx.stroke();
  });
  if (face.elder) {
    ctx.fillStyle = '#f4f1ff';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 7;
    [-1, 1].forEach((s) => {
      // Bushy brow tufts.
      ctx.beginPath();
      const bx = cx + s * 92;
      const by = cy - 165;
      ctx.ellipse(bx, by, 78, 26, s * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Moustache wing.
      ctx.beginPath();
      ctx.moveTo(cx, cy + 82);
      ctx.bezierCurveTo(cx + s * 40, cy + 60, cx + s * 110, cy + 70, cx + s * 135, cy + 118);
      ctx.bezierCurveTo(cx + s * 95, cy + 112, cx + s * 45, cy + 118, cx, cy + 102);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }
  if (face.sweat) {
    // Sweat drop on the temple, light blue with a white glint.
    const sx = cx + 178;
    const sy = cy - 150;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 52);
    ctx.bezierCurveTo(sx + 34, sy - 5, sx + 30, sy + 30, sx, sy + 30);
    ctx.bezierCurveTo(sx - 30, sy + 30, sx - 34, sy - 5, sx, sy - 52);
    ctx.fillStyle = '#9fe3ff';
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = ink;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(sx - 9, sy + 4, 6, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Mouth.
  ctx.strokeStyle = ink;
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  const my = cy + 120;
  ctx.beginPath();
  if (face.mouth === 'smile') {
    ctx.arc(cx, my - 30, 50, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  } else if (face.mouth === 'flat') {
    ctx.moveTo(cx - 34, my);
    ctx.quadraticCurveTo(cx, my + 6, cx + 34, my - 4);
    ctx.stroke();
  } else if (face.mouth === 'soft') {
    ctx.moveTo(cx - 30, my - 4);
    ctx.quadraticCurveTo(cx, my + 16, cx + 30, my - 4);
    ctx.stroke();
  } else if (face.mouth === 'scream') {
    // Wail: top lip arched up (corners down), sides flaring to a wide jaw. Reads as anguish, not a laugh.
    const wail = () => {
      ctx.beginPath();
      ctx.moveTo(cx - 52, my - 4);
      ctx.quadraticCurveTo(cx, my - 78, cx + 52, my - 4);
      ctx.quadraticCurveTo(cx + 84, my + 44, cx + 94, my + 106);
      ctx.quadraticCurveTo(cx, my + 132, cx - 94, my + 106);
      ctx.quadraticCurveTo(cx - 84, my + 44, cx - 52, my - 4);
      ctx.closePath();
    };
    wail();
    ctx.fillStyle = '#4a0f26';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#ff6f8e';
    ctx.beginPath();
    ctx.ellipse(cx, my + 118, 62, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    wail();
    ctx.stroke();
  } else if (face.mouth === 'pant' || (face.mouth === 'open' && face.brow > 0.3)) {
    // Tired pant: lopsided open mouth with a tongue.
    ctx.moveTo(cx - 44, my - 6);
    ctx.quadraticCurveTo(cx - 6, my - 22, cx + 40, my - 2);
    ctx.quadraticCurveTo(cx + 30, my + 50, cx - 4, my + 48);
    ctx.quadraticCurveTo(cx - 40, my + 44, cx - 44, my - 6);
    ctx.closePath();
    ctx.fillStyle = '#5a1530';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#ff6f8e';
    ctx.beginPath();
    ctx.ellipse(cx + 2, my + 46, 30, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(cx - 44, my - 6);
    ctx.quadraticCurveTo(cx - 6, my - 22, cx + 40, my - 2);
    ctx.quadraticCurveTo(cx + 30, my + 50, cx - 4, my + 48);
    ctx.quadraticCurveTo(cx - 40, my + 44, cx - 44, my - 6);
    ctx.stroke();
  } else if (face.mouth === 'o') {
    ctx.ellipse(cx, my, 20, 26, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#5a1530';
    ctx.fill();
    ctx.stroke();
  } else {
    // open / grit: a D-shaped mouth with teeth.
    ctx.moveTo(cx - 58, my - 12);
    ctx.quadraticCurveTo(cx, my + (face.mouth === 'open' ? 80 : 40), cx + 58, my - 12);
    ctx.closePath();
    ctx.fillStyle = '#5a1530';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(cx - 70, my - 20, 140, face.mouth === 'grit' ? 60 : 22);
    if (face.mouth === 'grit') {
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let i = -2; i <= 2; i++) {
        ctx.moveTo(cx + i * 22, my - 20);
        ctx.lineTo(cx + i * 22, my + 40);
      }
      ctx.moveTo(cx - 70, my + 8);
      ctx.lineTo(cx + 70, my + 8);
      ctx.stroke();
    }
    ctx.restore();
    ctx.lineWidth = 11;
    ctx.stroke();
  }
  return c;
};

// Butterfly-shaped luggage tag: the hero's dream, drawn like a child's sticker.
export const butterflyTagTexture = () => {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d')!;
  const ink = '#24152e';
  ctx.translate(128, 128);
  const wing = (s: number) => {
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.bezierCurveTo(s * 40, -110, s * 125, -80, s * 100, -10);
    ctx.bezierCurveTo(s * 120, 40, s * 70, 105, 0, 20);
    ctx.closePath();
  };
  [-1, 1].forEach((s) => {
    wing(s);
    ctx.fillStyle = '#ffb347';
    ctx.fill();
    ctx.lineWidth = 9;
    ctx.strokeStyle = ink;
    ctx.stroke();
    ctx.fillStyle = '#ff6f8e';
    ctx.beginPath();
    ctx.arc(s * 62, -35, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7ad3ff';
    ctx.beginPath();
    ctx.arc(s * 50, 35, 13, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.ellipse(0, 5, 10, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  return c;
};

// Sun-bleached bone.
export const boneTexture = (seed: number) => {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d')!;
  const r = rng(seed);
  ctx.fillStyle = '#f3ead2';
  ctx.fillRect(0, 0, 256, 256);
  brushStrokes(ctx, 256, 256, ['#e2d3b0', '#fffaf0', '#cdbb98'], 160, 20, 0.35, r);
  return c;
};

// Worn leather for suitcases.
export const leatherTexture = (seed: number, base: string) => {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d')!;
  const r = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  brushStrokes(ctx, 256, 256, [mix(base, '#ffffff', 0.25), mix(base, '#000000', 0.25)], 220, 18, 0.3, r);
  // Scuffs.
  ctx.strokeStyle = mix(base, '#ffe9c8', 0.5);
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 3;
  for (let i = 0; i < 14; i++) {
    const x = r() * 256;
    const y = r() * 256;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 40, y + (r() - 0.5) * 12);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return c;
};
