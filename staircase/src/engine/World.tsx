import {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {brushStrokes, carveText, cloudTexture, glowTexture, mix, rng, stoneTexture, toTexture} from '../scene/paint';
import {toon} from '../scene/toon';
import {Look} from './look';
import {DEPTH, RISE, WALL_X, WIDTH, stepTop} from './stairs';

// ---------------- textures (built once) ----------------
let ASSETS: ReturnType<typeof buildAssets> | null = null;

const mossy = (seed: number, w: number, h: number, base: string) => {
  const c = stoneTexture(seed, {blocksX: 4, blocksY: 1, base, w, h});
  const ctx = c.getContext('2d')!;
  const r = rng(seed + 9);
  // Moss creeping over the stone, darker in the seams.
  brushStrokes(ctx, w, h, ['#6fae5a', '#8cc86a', '#4f8f50', '#a6d67a'], 260, 26, 0.55, r);
  brushStrokes(ctx, w, h, ['#3f7a48', '#2f6a40'], 60, 14, 0.5, r);
  return c;
};

// A worn mark nobody can read: a spiral, a ring of dots and broken strokes, mostly eroded.
const glyphStone = (seed: number) => {
  const c = stoneTexture(seed, {blocksX: 2, blocksY: 3, base: '#d9a08a'});
  const ctx = c.getContext('2d')!;
  const r = rng(seed + 3);
  ctx.save();
  ctx.translate(512, 470);
  ctx.strokeStyle = '#4a1f33';
  ctx.fillStyle = '#4a1f33';
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 20;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 5; a += 0.08) {
    const rad = 14 + a * 13;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (a === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 285, Math.sin(a) * 285, 18, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 16;
  [[-300, 360, -120, 330], [60, 350, 260, 380], [-80, -330, 120, -350]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
  ctx.restore();
  // Erosion: blotches of stone colour painted back over the mark, then moss.
  brushStrokes(ctx, 1024, 1024, ['#d9a08a', '#e8b59a', '#c98f7a'], 420, 60, 0.5, r);
  brushStrokes(ctx, 1024, 1024, ['#6fae5a', '#8cc86a', '#4f8f50'], 120, 30, 0.6, r);
  return c;
};

// Carved slabs: taller than plain wall slabs, with canvases in the slab's true proportions so
// text keeps its shape. The steps rise across the slab, so everything drawn on it is kept above
// the highest tread behind it (canvas left = downhill, right = uphill).
export const CARVED_H = 2.6;
const CARVED_LEN = DEPTH * 5 + 0.02;
const CW = 1024;
const CH = Math.round((CW * CARVED_H) / CARVED_LEN);
// Lowest canvas y (largest value) a mark spanning canvas x0..x1 may reach without dipping under a tread.
export const carvedFloor = (x0: number, x1: number, margin = 0.16) => {
  let top = -Infinity;
  for (let x = Math.max(0, x0); x <= Math.min(CW, x1); x += 4) {
    const dz = (0.5 - x / CW) * CARVED_LEN;
    top = Math.max(top, Math.round(-dz / DEPTH) * RISE);
  }
  const yWorld = top + margin; // relative to the tread at the slab centre
  return ((CARVED_H - 0.6 - yWorld) / CARVED_H) * CH;
};

// A wall slab covered in many hands' carvings, tally marks and a butterfly doodle.
const graffitiWall = (seed: number) => {
  const c = stoneTexture(seed, {blocksX: 3, blocksY: 2, base: '#e58f86', w: CW, h: CH});
  const ctx = c.getContext('2d')!;
  const r = rng(seed + 1);
  const scratch = (x: number, y: number, txt: string, size: number, rot: number) => {
    ctx.save();
    ctx.font = `700 ${size}px "DejaVu Sans", sans-serif`;
    // Keep the word (including its tilt) above the steps behind it.
    const half = ctx.measureText(txt).width / 2;
    const dip = Math.abs(Math.sin(rot)) * half + size * 0.25;
    y = Math.min(y, carvedFloor(x - half, x + half) - dip);
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,236,200,0.85)';
    ctx.fillText(txt, 2, 3);
    ctx.fillStyle = '#4a1f33';
    ctx.fillText(txt, 0, 0);
    ctx.restore();
  };
  // Hand-placed so nothing overlaps; every mark sits above the steps (canvas is CW x CH).
  const words: [string, number, number, number, number][] = [
    ['NEARLY', 220, 130, 44, -0.08],
    ['DONT STOP', 600, 122, 52, 0.05],
    ['ONE MORE STEP', 300, 252, 46, 0.06],
    ['UP', 935, 300, 46, 0.1],
    ['HIGHER', 225, 378, 40, -0.1],
    ['ALMOST', 525, 372, 50, -0.05],
    ['WINGS SOON', 230, 482, 40, -0.07],
    ['NOT FAR NOW', 565, 474, 40, 0.07],
    ['KEEP CLIMBING', 330, 592, 50, -0.04],
  ];
  words.forEach(([w, x, y, size, rot]) => scratch(x, y, w, size, rot + (r() - 0.5) * 0.04));
  // Tally marks: someone counting steps.
  ctx.strokeStyle = '#4a1f33';
  ctx.lineWidth = 7;
  for (let g = 0; g < 3; g++) {
    const gx = 60 + g * 100 + r() * 12;
    const gy = Math.min(652 + r() * 10, carvedFloor(gx - 12, gx + 84) - 64);
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(gx + k * 18, gy);
      ctx.lineTo(gx + k * 18 + 3, gy + 60);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(gx - 10, gy + 50);
    ctx.lineTo(gx + 72, gy + 8);
    ctx.stroke();
  }
  // Butterfly doodle.
  ctx.save();
  ctx.translate(770, Math.min(250, carvedFloor(700, 840) - 90));
  ctx.lineWidth = 8;
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.ellipse(s * 40, -20, 40, 52, s * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(s * 30, 40, 26, 32, -s * 0.4, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.moveTo(0, -50);
  ctx.lineTo(0, 70);
  ctx.stroke();
  ctx.restore();
  return c;
};

const grassTexture = () => {
  const W = 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = W;
  const ctx = c.getContext('2d')!;
  const r = rng(77);
  ctx.fillStyle = '#5fbf5a';
  ctx.fillRect(0, 0, W, W);
  brushStrokes(ctx, W, W, ['#7fd36a', '#4aa64e', '#9be07a', '#3f9a50', '#b6e88a'], 2400, 30, 0.45, r, -Math.PI / 2);
  return c;
};

const tileTexture = () => {
  const c = stoneTexture(91, {blocksX: 4, blocksY: 4, base: '#e9c09a'});
  const ctx = c.getContext('2d')!;
  brushStrokes(ctx, 1024, 1024, ['#6fae5a', '#8cc86a', '#4f8f50'], 140, 22, 0.45, rng(5));
  return c;
};

function buildAssets() {
  const step = toTexture(stoneTexture(11, {blocksX: 4, blocksY: 1, base: '#ffe6c4', w: 1024, h: 200}));
  const stepMoss = toTexture(mossy(12, 1024, 200, '#f2d6b4'));
  const wall = toTexture(stoneTexture(21, {blocksX: 3, blocksY: 2, base: '#e58f86'}));
  const under = toTexture(stoneTexture(31, {blocksX: 4, blocksY: 4, base: '#a77bb0'}));
  under.repeat.set(1, 60);
  const plaza = toTexture(tileTexture(), 3);
  const grass = toTexture(grassTexture(), 14);
  const clouds = [0, 1, 2, 3, 4, 5].map((i) => toTexture(cloudTexture(100 + i)));
  return {
    step: toon({map: step}),
    stepMoss: toon({map: stepMoss}),
    wall: toon({map: wall}),
    under: toon({map: under}),
    post: toon({color: '#ffe0bd'}),
    plaza: toon({map: plaza}),
    grass: toon({map: grass}),
    glyph: toon({map: toTexture(glyphStone(61))}),
    graffiti: toon({map: toTexture(graffitiWall(71))}),
    clouds,
    glow: toTexture(glowTexture('rgba(255,244,210,1)', 'rgba(255,190,140,0)')),
    leaf: toon({color: '#4fb84a'}),
    leafDark: toon({color: '#3a9a46'}),
    stem: toon({color: '#3f8a3a'}),
  };
}
export const assets = () => (ASSETS ??= buildAssets());

const carvedCache = new Map<string, THREE.MeshToonMaterial>();
export const carvedMaterial = (lines: string[], seed: number) => {
  const key = lines.join('/') + seed;
  let m = carvedCache.get(key);
  if (!m) {
    const c = stoneTexture(41 + seed, {blocksX: 3, blocksY: 2, base: '#e58f86', w: CW, h: CH});
    carveText(c, lines, 50 + seed, carvedFloor);
    m = toon({map: toTexture(c)});
    carvedCache.set(key, m);
  }
  return m;
};

// ---------------- instancing helper ----------------
const Instances: React.FC<{
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: THREE.Matrix4[];
  colors?: THREE.Color[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}> = ({geometry, material, matrices, colors, castShadow = true, receiveShadow = true}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    matrices.forEach((mat, i) => m.setMatrixAt(i, mat));
    if (colors) colors.forEach((c, i) => m.setColorAt(i, c));
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [matrices, colors]);
  return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} castShadow={castShadow} receiveShadow={receiveShadow} frustumCulled={false} />;
};

const M = (x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz));

// ---------------- sky ----------------
const SkyDome: React.FC<{look: Look}> = ({look}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: {value: new THREE.Color()},
          mid: {value: new THREE.Color()},
          low: {value: new THREE.Color()},
          sun: {value: new THREE.Color()},
          sunDir: {value: new THREE.Vector3()},
          sunSize: {value: 1},
          stars: {value: 0},
        },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform vec3 top, mid, low, sun, sunDir; uniform float sunSize, stars; varying vec3 vDir;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
          void main(){
            vec3 d = normalize(vDir);
            float h = d.y;
            vec3 c = mix(low, mid, smoothstep(-0.08, 0.32, h));
            c = mix(c, top, smoothstep(0.32, 0.9, h));
            float s = max(dot(d, normalize(sunDir)), 0.0);
            c = mix(c, sun, pow(s, 22.0) * 0.8 * min(sunSize, 1.0));
            // Crisp cartoon disc with a soft halo.
            float disc = smoothstep(0.9994 - sunSize * 0.0012, 0.99965 - sunSize * 0.0012, s);
            c = mix(c, sun * 1.05, disc * step(0.01, sunSize));
            c += sun * pow(s, 60.0) * 0.5 * min(sunSize, 1.0);
            if (stars > 0.0) {
              vec2 g = vec2(atan(d.z, d.x) * 120.0, asin(clamp(d.y, -1.0, 1.0)) * 120.0);
              vec2 cell = floor(g);
              vec2 f = fract(g) - 0.5;
              float rnd = hash(cell);
              vec2 off = vec2(hash(cell + 1.7), hash(cell + 3.1)) - 0.5;
              float star = smoothstep(0.12, 0.0, length(f - off * 0.6)) * step(0.93, rnd);
              c += vec3(1.0, 0.96, 0.9) * star * stars * smoothstep(0.0, 0.25, h) * (0.5 + 0.5 * hash(cell + 9.0));
            }
            gl_FragColor = vec4(min(c, vec3(1.0)), 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  const u = mat.uniforms;
  u.top.value.set(look.skyTop);
  u.mid.value.set(look.skyMid);
  u.low.value.set(look.skyLow);
  u.sun.value.set(look.sunColor);
  u.sunDir.value.set(...look.sunDir);
  u.sunSize.value = look.sunSize;
  u.stars.value = look.stars;
  return (
    <mesh material={mat} renderOrder={-10} layers={1}>
      <sphereGeometry args={[900, 48, 32]} />
    </mesh>
  );
};

// ---------------- clouds ----------------
export const Card: React.FC<{
  tex: THREE.Texture;
  position: [number, number, number];
  scale: [number, number];
  opacity?: number;
  additive?: boolean;
  fog?: boolean;
  color?: string;
}> = ({tex, position, scale, opacity = 1, additive = false, fog = true, color = '#ffffff'}) => {
  const mat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        fog,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      }),
    [tex, additive, fog],
  );
  mat.opacity = opacity;
  mat.color.set(color);
  return <sprite material={mat} position={position} scale={[scale[0], scale[1], 1]} layers={1} />;
};

type CloudDef = {x: number; y: number; z: number; s: number; tex: number};
const cloudField = (seed: number) => {
  const r = rng(seed);
  const sea: CloudDef[] = [];
  // Sea of clouds on both sides of the staircase, laid out relative to the shot's centre.
  for (let i = 0; i < 110; i++) {
    const side = i % 3 === 0 ? -1 : 1;
    sea.push({x: side * (4 + Math.pow(r(), 0.7) * 85), y: r() * 4, z: 60 - r() * 260, s: 9 + r() * 18, tex: i % 6});
  }
  // A denser band close to the staircase, so nearby shots always have clouds below.
  for (let i = 0; i < 70; i++) {
    const side = i % 4 === 0 ? -1 : 1;
    sea.push({x: side * (3 + r() * 14), y: r() * 3, z: 30 - r() * 60, s: 6 + r() * 9, tex: i % 6});
  }
  const high: CloudDef[] = [];
  for (let i = 0; i < 24; i++) {
    high.push({x: (r() - 0.4) * 90, y: r() * 14, z: -r() * 200, s: 10 + r() * 16, tex: i % 6});
  }
  return {sea, high};
};
const CLOUDS = cloudField(5);

// Stair style for the picture book's stills (set by BookStill only; the film keeps the original look).
// solid: each step is a deep stone block whose sides are flush with its neighbours, and there is no separate
// sloped body under the stairs, so the side of the staircase reads as stacked masonry with nothing sticking out.
export const STAIR_STYLE = {solid: false};
const SOLID_DEPTH = 2.4; // block height (the original step blocks are 0.6)

// A step block of height h whose side faces tile the stone texture instead of stretching it.
const deepStepGeometry = (h: number) => {
  const g = new THREE.BoxGeometry(WIDTH, h, DEPTH + 0.01);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const k = h / 0.6;
  // BoxGeometry faces, 4 vertices each: +x, -x, +y, -y, +z, -z. Scale v on the four side faces.
  for (const face of [0, 1, 4, 5]) for (let v = face * 4; v < face * 4 + 4; v++) uv.setY(v, uv.getY(v) * k);
  uv.needsUpdate = true;
  return g;
};

// ---------------- plaza & meadow ----------------
// A rounded bush: a cluster of cel-shaded puffs.
const Bush: React.FC<{pos: [number, number, number]; s: number; dark?: boolean; seed: number}> = ({pos, s, dark, seed}) => {
  const a = assets();
  const r = rng(seed);
  const puffs = Array.from({length: 6}, (_, i) => {
    const ang = (i / 6) * Math.PI * 2 + r();
    const d = i === 0 ? 0 : 0.55 + r() * 0.25;
    return {p: [Math.cos(ang) * d, 0.35 + r() * 0.35 + (i === 0 ? 0.35 : 0), Math.sin(ang) * d] as [number, number, number], k: 0.6 + r() * 0.35};
  });
  return (
    <group position={pos} scale={s}>
      {puffs.map((q, i) => (
        <mesh key={i} position={q.p} scale={q.k} material={(i + (dark ? 1 : 0)) % 2 ? a.leafDark : a.leaf} castShadow receiveShadow>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
      ))}
    </group>
  );
};

const Plaza: React.FC = () => {
  const a = assets();
  const bushes = useMemo(() => {
    const r = rng(31);
    const out: {pos: [number, number, number]; s: number; dark: boolean; seed: number}[] = [];
    for (let i = 0; i < 40; i++) {
      const ang = r() * Math.PI * 2;
      const rad = 13 + r() * 30;
      const x = Math.cos(ang) * rad;
      const z = 6 + Math.sin(ang) * rad;
      if (z < 4 && Math.abs(x) < 9) continue;
      out.push({pos: [x, -0.3, z], s: 1.6 + r() * 2.8, dark: r() > 0.5, seed: i + 1});
    }
    return out;
  }, []);
  return (
    <group>
      {/* Stone plaza at the foot of the stairs (top at y = 0). */}
      <mesh position={[0, -0.3, 5.7]} material={a.plaza} receiveShadow castShadow>
        <boxGeometry args={[16, 0.6, 12.02]} />
      </mesh>
      {/* Meadow. */}
      <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]} material={a.grass} receiveShadow>
        <circleGeometry args={[220, 64]} />
      </mesh>
      {bushes.map((b, i) => (
        <Bush key={i} {...b} />
      ))}
      {/* The cornerstone: the oldest block, carrying a mark nobody can read. */}
      <mesh position={[WALL_X - 0.2, 1.6, -0.6]} material={a.glyph} castShadow receiveShadow>
        <boxGeometry args={[0.9, 3.8, 2.6]} />
      </mesh>
    </group>
  );
};

// ---------------- the staircase ----------------
export type Carving = {slab: number; lines?: string[]; graffiti?: boolean; seed?: number};

export const World: React.FC<{
  look: Look;
  plaza: boolean;
  cloudSeaY: number;
  carvings?: Carving[];
  t: number;
  iMin?: number;
  iMax?: number;
  highClouds?: boolean;
  topGlow?: number; // extra glow at the top (the voice)
  cloudZ?: number; // centre of the cloud field along the stairs
}> = ({look, plaza, cloudSeaY, carvings = [], t, iMin: iMinP, iMax: iMaxP, highClouds = true, topGlow = 0, cloudZ = 0}) => {
  const a = assets();
  const iMin = plaza ? 1 : (iMinP ?? -260);
  const iMax = iMaxP ?? 620;
  const mossTo = plaza ? 14 : iMin - 1;

  const geo = useMemo(
    () => ({
      step: STAIR_STYLE.solid ? deepStepGeometry(SOLID_DEPTH) : new THREE.BoxGeometry(WIDTH, 0.6, DEPTH + 0.01),
      wall: new THREE.BoxGeometry(0.5, 1, DEPTH * 5 + 0.02),
      postShaft: new THREE.BoxGeometry(0.22, 0.64, 0.22),
      postBall: new THREE.BoxGeometry(0.3, 0.08, 0.3),
    }),
    [],
  );

  const inst = useMemo(() => {
    const r = rng(3);
    const steps: THREE.Matrix4[] = [];
    const stepColors: THREE.Color[] = [];
    const moss: THREE.Matrix4[] = [];
    const posts: THREE.Matrix4[] = [];
    const balls: THREE.Matrix4[] = [];
    for (let i = iMin; i <= iMax; i++) {
      const [y, z] = stepTop(i);
      const m = M(0, y - (STAIR_STYLE.solid ? SOLID_DEPTH / 2 : 0.3), z);
      if (i <= mossTo) moss.push(m);
      else {
        steps.push(m);
        const v = 0.94 + r() * 0.1;
        stepColors.push(new THREE.Color(v, v * (0.97 + r() * 0.05), v * (0.95 + r() * 0.06)));
      }
      if (((i % 4) + 4) % 4 === 2) {
        posts.push(M(WIDTH / 2 - 0.18, y + 0.32, z));
        balls.push(M(WIDTH / 2 - 0.18, y + 0.68, z));
      }
    }
    const carved = new Set(carvings.map((c) => c.slab));
    const walls: THREE.Matrix4[] = [];
    const r2 = rng(9);
    const k0 = Math.floor(iMin / 5);
    const k1 = Math.floor(iMax / 5);
    for (let k = k0; k <= k1; k++) {
      const h = 1.5 + (r2() - 0.5) * 0.3;
      if (carved.has(k) || (plaza && k === 0)) continue;
      const [y, z] = stepTop(k * 5 + 2);
      walls.push(M(WALL_X, y + h / 2 - 0.6, z, 1, h, 1));
    }
    return {steps, stepColors, moss, posts, balls, walls};
  }, [iMin, iMax, mossTo, carvings, plaza]);

  // Sloped body under the stairs.
  const [y0, z0] = stepTop(iMin);
  const [y1, z1] = stepTop(iMax);
  const len = Math.hypot(y1 - y0, z1 - z0) + 4;
  const angle = Math.atan2(RISE, DEPTH);
  const cy = (y0 + y1) / 2 - 2.4;
  const cz = (z0 + z1) / 2 - 0.4;

  const [gy, gz] = stepTop(iMax + 40);
  const drift = t * 0.6;

  return (
    <group>
      <SkyDome look={look} />
      <Instances geometry={geo.step} material={a.step} matrices={inst.steps} colors={inst.stepColors} />
      {inst.moss.length ? <Instances geometry={geo.step} material={a.stepMoss} matrices={inst.moss} /> : null}
      <Instances geometry={geo.wall} material={a.wall} matrices={inst.walls} />
      <Instances geometry={geo.postShaft} material={a.post} matrices={inst.posts} />
      <Instances geometry={geo.postBall} material={a.post} matrices={inst.balls} />
      {carvings.map((c) => {
        const [y, z] = stepTop(c.slab * 5 + 2);
        const h = CARVED_H;
        return (
          <mesh
            key={c.slab}
            position={[WALL_X, y + h / 2 - 0.6, z]}
            material={c.graffiti ? a.graffiti : carvedMaterial(c.lines ?? [''], c.seed ?? c.slab)}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.5, h, CARVED_LEN]} />
          </mesh>
        );
      })}
      {STAIR_STYLE.solid ? null : (
        <mesh position={[0, cy, cz]} rotation={[angle, 0, 0]} material={a.under} receiveShadow>
          <boxGeometry args={[WIDTH - 0.1, 3.6, len]} />
        </mesh>
      )}
      {plaza ? <Plaza /> : null}
      {CLOUDS.sea.map((c, i) => (
        <Card
          key={`s${i}`}
          tex={a.clouds[c.tex]}
          position={[c.x + drift * (0.5 + (i % 5) * 0.2), cloudSeaY + c.y - c.z * 0.02, cloudZ + c.z]}
          scale={[c.s, c.s * 0.5]}
          color={look.cloudTint}
        />
      ))}
      {highClouds
        ? CLOUDS.high.map((c, i) => {
            const [hy, hz] = stepTop(160 + i * 18);
            return (
              <Card
                key={`h${i}`}
                tex={a.clouds[c.tex]}
                position={[c.x + drift * 0.3, hy + c.y - 4, hz + c.z * 0.2]}
                scale={[c.s, c.s * 0.5]}
                color={mix(look.cloudTint, '#ffffff', 0.2)}
                opacity={0.95}
              />
            );
          })
        : null}
      {/* The promise at the top. */}
      <Card tex={a.glow} position={[0, gy, gz]} scale={[110, 110]} opacity={Math.min(1, look.glow + topGlow)} additive fog={false} color={look.glowColor} />
      <Card tex={a.glow} position={[0, gy, gz]} scale={[34, 34]} opacity={Math.min(1, look.glow * 1.5 + topGlow)} additive fog={false} color={look.glowColor} />
    </group>
  );
};
