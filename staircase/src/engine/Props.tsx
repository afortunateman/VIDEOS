import {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {boneTexture, glowTexture, leatherTexture, rng, toTexture} from '../scene/paint';
import {toon} from '../scene/toon';
import {ActorSpec, gapsFor, layBody, PALETTES, radiiFor} from './Actor';
import {noise1, solveChain, V3, WALL_X} from './stairs';
import {Card} from './World';

// ---------------- campfire ----------------
const teardrop = (() => {
  // Bulbous base tapering to a curled tip, like a drawn flame tongue.
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    const r = Math.sin(Math.PI * Math.pow(t, 0.42)) * Math.pow(1 - t, 0.9) * 0.62;
    pts.push(new THREE.Vector2(Math.max(r, 0.0001), t));
  }
  return new THREE.LatheGeometry(pts, 24);
})();

const flameMats = {
  outer: new THREE.MeshBasicMaterial({color: '#ff5a2a'}),
  mid: new THREE.MeshBasicMaterial({color: '#ff9a2a'}),
  core: new THREE.MeshBasicMaterial({color: '#ffe36a'}),
};

export const Campfire: React.FC<{pos: V3; t: number; shadows?: boolean}> = ({pos, t, shadows = true}) => {
  const log = useMemo(() => toon({color: '#7a4a2e'}), []);
  const stone = useMemo(() => toon({color: '#8f86a8'}), []);
  const flick = (k: number, f: number) => noise1(t * f, k);
  const layers: [THREE.Material, number, number][] = [
    [flameMats.outer, 1.0, 0],
    [flameMats.mid, 0.72, 1],
    [flameMats.core, 0.45, 2],
  ];
  const light = 5.5 + flick(9, 7) * 1.2 + flick(4, 13) * 0.6;
  return (
    <group position={pos}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 4, Math.PI / 2 - 0.25]} position={[0, 0.08, 0]} material={log} castShadow receiveShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.9, 8]} />
        </mesh>
      ))}
      {Array.from({length: 9}).map((_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return (
          <mesh key={`s${i}`} position={[Math.cos(a) * 0.55, 0.05, Math.sin(a) * 0.55]} scale={[0.16, 0.11, 0.14]} material={stone} castShadow receiveShadow>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        );
      })}
      {layers.map(([m, s, k]) =>
        [0, 1, 2, 3, 4].map((j) => {
          // Five tongues per layer, each with its own height, lean and flicker.
          const spread = [-0.2, -0.09, 0, 0.1, 0.21][j];
          const tall = [0.62, 0.85, 1.12, 0.8, 0.58][j];
          const ox = spread * s + flick(k * 10 + j, 3) * 0.035;
          const oz = [0.05, -0.06, 0, 0.07, -0.04][j] * s;
          const h = s * tall * (0.9 + flick(k * 7 + j, 6.5) * 0.2);
          return (
            <mesh
              key={`${k}-${j}`}
              geometry={teardrop}
              material={m}
              position={[ox, 0.08, oz + k * 0.015]}
              rotation={[flick(k * 3 + j, 3.5) * 0.1, 0, flick(k * 5 + j, 4) * 0.18 - spread * 0.9]}
              scale={[0.42 * s, h, 0.42 * s]}
            />
          );
        }),
      )}
      <pointLight
        position={[0, 0.6, 0]}
        color="#ff9a4a"
        intensity={light}
        distance={14}
        decay={1.3}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={14}
        shadow-bias={-0.002}
      />
    </group>
  );
};

// Embers rising from the fire.
export const Embers: React.FC<{pos: V3; t: number; count?: number}> = ({pos, t, count = 22}) => {
  const tex = useMemo(() => toTexture(glowTexture('rgba(255,220,140,1)', 'rgba(255,120,40,0)')), []);
  const r = rng(13);
  const seeds = Array.from({length: count}, () => [r(), r(), r(), r()]);
  return (
    <group position={pos}>
      {seeds.map(([a, b, c, d], i) => {
        const life = 2.2 + a * 1.6;
        const p = ((t + d * life) % life) / life;
        const y = 0.4 + p * 3.2;
        const x = (b - 0.5) * 0.4 + noise1(t * 0.8 + i, i) * 0.35 * p;
        const z = (c - 0.5) * 0.4 + noise1(t * 0.7 + i, i + 50) * 0.35 * p;
        return <Card key={i} tex={tex} position={[x, y, z]} scale={[0.07, 0.07]} opacity={(1 - p) * 0.95} additive fog={false} />;
      })}
    </group>
  );
};

// Dust motes drifting in sunlight.
export const Dust: React.FC<{center: V3; size: V3; t: number; count?: number; opacity?: number}> = ({center, size, t, count = 40, opacity = 0.5}) => {
  const tex = useMemo(() => toTexture(glowTexture('rgba(255,250,230,1)', 'rgba(255,250,230,0)')), []);
  const r = rng(21);
  return (
    <group position={center}>
      {Array.from({length: count}).map((_, i) => {
        const x = (r() - 0.5) * size[0] + noise1(t * 0.3, i) * 0.3;
        const y = (r() - 0.5) * size[1] + noise1(t * 0.25, i + 99) * 0.3;
        const z = (r() - 0.5) * size[2] + noise1(t * 0.2, i + 199) * 0.3;
        const s = 0.025 + r() * 0.03;
        return <Card key={i} tex={tex} position={[x, y, z]} scale={[s, s]} opacity={opacity * (0.5 + 0.5 * noise1(t, i + 7))} additive fog={false} />;
      })}
    </group>
  );
};

// ---------------- the butterfly shadow ----------------
const butterflyShadowTexture = () => {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.translate(256, 256);
  ctx.fillStyle = '#000';
  ctx.filter = 'blur(6px)';
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.bezierCurveTo(s * 70, -230, s * 250, -170, s * 200, -20);
    ctx.bezierCurveTo(s * 240, 80, s * 140, 210, 0, 40);
    ctx.closePath();
    ctx.fill();
  });
  ctx.beginPath();
  ctx.ellipse(0, 10, 18, 110, 0, 0, Math.PI * 2);
  ctx.fill();
  // Antennae.
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#000';
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.moveTo(0, -90);
    ctx.quadraticCurveTo(s * 30, -170, s * 60, -190);
    ctx.stroke();
  });
  return c;
};

export const ButterflyShadow: React.FC<{pos: V3; size: number; t: number; opacity: number}> = ({pos, size, t, opacity}) => {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: toTexture(butterflyShadowTexture()),
        transparent: true,
        depthWrite: false,
        color: '#1a0e30',
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [],
  );
  mat.opacity = opacity;
  const flap = 0.55 + 0.45 * Math.abs(Math.cos(t * 3.2));
  // Wall's inner face points +x; plane faces +x.
  return (
    <mesh position={pos} rotation={[0, Math.PI / 2, 0]} scale={[size * flap, size, 1]} material={mat} layers={1}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
};

// ---------------- skeleton ----------------
let boneMat: THREE.MeshToonMaterial | null = null;
const bone = () => (boneMat ??= toon({map: toTexture(boneTexture(4))}));
const socketMat = toon({color: '#3a2440'});

export const Skeleton: React.FC<{spec: Pick<ActorSpec, 'body' | 'rear' | 'rearPivot' | 'segs' | 'headR' | 'lookAt'>}> = ({spec}) => {
  const full = {...spec, palette: PALETTES.quitter, face: {look: [0, 0], lid: 0, brow: 0, mouth: 'flat'}, t: 0} as ActorSpec;
  const pts = layBody(full);
  const radii = radiiFor(spec.segs ?? 7, spec.headR ?? 0.46);
  const UPV = new THREE.Vector3(0, 1, 0);
  const head = new THREE.Vector3(...pts[0]);
  const look = new THREE.Vector3(...spec.lookAt);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(look, head, UPV));
  const hr = (spec.headR ?? 0.46) * 0.82;
  // Bones rest on the steps: drop everything so the lowest rib touches the tread.
  const sink = (i: number) => radii[i] * 0.45;
  const verts: THREE.Vector3[] = pts.map((p, i) => new THREE.Vector3(p[0], p[1] - (i === 0 ? sink(0) * 0.6 : sink(i)), p[2]));
  const skullPos = verts[0];
  return (
    <group>
      {/* Skull: bleached dome, big dark sockets, a nose notch, and two antenna bones. */}
      <group position={skullPos} quaternion={q}>
        <mesh scale={[hr, hr * 0.9, hr * 1.02]} material={bone()} castShadow receiveShadow>
          <sphereGeometry args={[1, 32, 24]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * hr * 0.38, hr * 0.08, hr * 0.8]} scale={[hr * 0.3, hr * 0.36, hr * 0.22]} material={socketMat}>
            <sphereGeometry args={[1, 18, 14]} />
          </mesh>
        ))}
        <mesh position={[0, -hr * 0.3, hr * 0.92]} scale={[hr * 0.09, hr * 0.12, hr * 0.06]} material={socketMat}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
        {/* Teeth row */}
        {[-2, -1, 0, 1, 2].map((k) => (
          <mesh key={`t${k}`} position={[k * hr * 0.13, -hr * 0.62, hr * 0.74]} scale={[hr * 0.055, hr * 0.09, hr * 0.05]} material={bone()}>
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`a${s}`} position={[s * hr * 0.32, hr * 1.15, -hr * 0.1]} rotation={[-0.5, 0, -s * 0.35]} material={bone()} castShadow>
            <cylinderGeometry args={[hr * 0.05, hr * 0.06, hr * 0.7, 6]} />
          </mesh>
        ))}
      </group>
      {verts.slice(1).map((v, k) => {
        const i = k + 1;
        const prev = verts[i - 1];
        const dir = prev.clone().sub(v).normalize();
        // Frame: forward = body axis; ribs curl down around it, open at the belly.
        const fq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
        const r = radii[i] * 0.78;
        const mid = v.clone().lerp(prev, 0.5);
        const linkLen = v.distanceTo(prev);
        const lq = new THREE.Quaternion().setFromUnitVectors(UPV, dir);
        return (
          <group key={i}>
            {/* Vertebra and the link to the previous one */}
            <mesh position={v.clone().add(new THREE.Vector3(0, r * 0.95, 0))} quaternion={fq} scale={[0.07, 0.06, 0.09]} material={bone()} castShadow>
              <sphereGeometry args={[1, 12, 10]} />
            </mesh>
            {i > 1 ? (
              <mesh position={mid.clone().add(new THREE.Vector3(0, r * 0.95, 0))} quaternion={lq} material={bone()} castShadow>
                <cylinderGeometry args={[0.028, 0.028, linkLen, 6]} />
              </mesh>
            ) : null}
            {/* Ribcage arc: a 230-degree hoop hanging from the spine. */}
            <group position={v} quaternion={fq}>
              <mesh rotation={[0, 0, Math.PI / 2 + (Math.PI * 2 - 4.0) / 2]} material={bone()} castShadow receiveShadow>
                <torusGeometry args={[r, 0.032, 8, 28, 4.0]} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
};

// ---------------- sunbeam ----------------
export const Sunbeam: React.FC<{from: V3; to: V3; radius: number; opacity: number; color?: string}> = ({from, to, radius, opacity, color = '#fff2c8'}) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), b.clone().sub(a).normalize());
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {color: {value: new THREE.Color()}, opacity: {value: 0}},
        vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform vec3 color; uniform float opacity; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){ float rim = pow(abs(dot(vN, vV)), 1.5); float along = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
          gl_FragColor = vec4(color * rim * along * opacity, 1.0); }`,
      }),
    [],
  );
  mat.uniforms.color.value.set(color);
  mat.uniforms.opacity.value = opacity;
  return (
    <mesh position={a.clone().add(b).multiplyScalar(0.5)} quaternion={q} material={mat} layers={1}>
      <cylinderGeometry args={[radius * 0.35, radius, len, 32, 1, true]} />
    </mesh>
  );
};

// ---------------- crowd of distant climbers (instanced) ----------------
const crowdFace = (() => {
  let tex: THREE.Texture | null = null;
  return () => {
    if (tex) return tex;
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 256);
    const cx = 128;
    const cy = 128;
    ctx.fillStyle = '#ffffff';
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.ellipse(cx + s * 24, cy - 10, 18, 25, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fffaf0';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#24152e';
      ctx.stroke();
      ctx.fillStyle = '#24152e';
      ctx.beginPath();
      ctx.ellipse(cx + s * 24, cy - 18, 10, 13, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    tex = toTexture(c);
    return tex;
  };
})();

export type CrowdMember = {headZ: number; x: number; palette: string; lookUp?: number};

export const Crowd: React.FC<{members: CrowdMember[]; glow?: number}> = ({members, glow = 0}) => {
  const segRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const segs = 5;
  const radii = radiiFor(segs, 0.42);
  const gaps = gapsFor(radii);
  const mats = useMemo(() => ({seg: toon({}), head: toon({map: crowdFace()})}), []);
  mats.seg.emissive.set('#ffb070');
  mats.seg.emissiveIntensity = glow * 0.25;
  mats.head.emissive.set('#ffb070');
  mats.head.emissiveIntensity = glow * 0.25;
  const geo = useMemo(() => ({s: new THREE.SphereGeometry(1, 14, 10), h: new THREE.SphereGeometry(1, 18, 12)}), []);
  useLayoutEffect(() => {
    const sm = segRef.current;
    const hm = headRef.current;
    if (!sm || !hm) return;
    const m4 = new THREE.Matrix4();
    let k = 0;
    members.forEach((mb, j) => {
      const pts = solveChain(mb.headZ, mb.x, radii, gaps, 1);
      const col = new THREE.Color(PALETTES[mb.palette]?.base ?? '#6fd38a');
      pts.forEach((p, i) => {
        if (i === 0) {
          const head = new THREE.Vector3(...p);
          const target = head.clone().add(new THREE.Vector3(0.3, 0.6 + (mb.lookUp ?? 0.6), -1));
          const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(target, head, new THREE.Vector3(0, 1, 0)));
          m4.compose(head, q, new THREE.Vector3(radii[0], radii[0], radii[0]));
          hm.setMatrixAt(j, m4);
          hm.setColorAt(j, col);
        } else {
          m4.compose(new THREE.Vector3(...p), new THREE.Quaternion(), new THREE.Vector3(radii[i], radii[i] * 0.95, radii[i]));
          sm.setMatrixAt(k, m4);
          sm.setColorAt(k, col);
          k++;
        }
      });
    });
    sm.instanceMatrix.needsUpdate = true;
    hm.instanceMatrix.needsUpdate = true;
    if (sm.instanceColor) sm.instanceColor.needsUpdate = true;
    if (hm.instanceColor) hm.instanceColor.needsUpdate = true;
  }, [members]);
  const glowTex = useMemo(() => toTexture(glowTexture('rgba(255,226,160,1)', 'rgba(255,170,90,0)')), []);
  const heads = useMemo(() => members.map((mb) => solveChain(mb.headZ, mb.x, radii, gaps, 1)[0]), [members]);
  return (
    <group>
      <instancedMesh ref={segRef} args={[geo.s, mats.seg, members.length * segs]} frustumCulled={false} />
      <instancedMesh ref={headRef} args={[geo.h, mats.head, members.length]} frustumCulled={false} />
      {glow > 0
        ? heads.map((h, i) => <Card key={i} tex={glowTex} position={[h[0], h[1] + 0.3, h[2]]} scale={[2.2, 2.2]} opacity={0.55 * glow} additive fog={false} />)
        : null}
    </group>
  );
};

// Loose stone chip / pebble.
export const Pebble: React.FC<{pos: V3; s?: number}> = ({pos, s = 0.06}) => {
  const m = useMemo(() => toon({color: '#e8c39a'}), []);
  return (
    <mesh position={pos} scale={[s, s * 0.7, s]} material={m} castShadow>
      <dodecahedronGeometry args={[1, 0]} />
    </mesh>
  );
};

export const leatherDusty = () => toTexture(leatherTexture(9, '#9a8070'));
export const SHADOW_WALL_X = WALL_X + 0.26;
