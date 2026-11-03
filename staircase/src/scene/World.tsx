import {useMemo} from 'react';
import * as THREE from 'three';
import {carveText, cloudTexture, glowTexture, rng, stoneTexture, toTexture} from './paint';
import {toon} from './toon';

// Staircase layout: climbs along -z.
export const STEP = {depth: 0.62, rise: 0.34, width: 3.2};
export const stepTop = (i: number): [number, number] => [i * STEP.rise, -i * STEP.depth];

const COUNT = 140;
const WALL_X = -STEP.width / 2 - 0.25;

const SkyDome: React.FC = () => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          top: {value: new THREE.Color('#2f5fe0')},
          mid: {value: new THREE.Color('#6fa8ff')},
          low: {value: new THREE.Color('#ffd2b0')},
          sun: {value: new THREE.Color('#fff2c9')},
          sunDir: {value: new THREE.Vector3(0.55, 0.42, -0.72).normalize()},
        },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform vec3 top, mid, low, sun, sunDir; varying vec3 vDir;
          void main(){
            float h = vDir.y;
            vec3 c = mix(low, mid, smoothstep(-0.05, 0.35, h));
            c = mix(c, top, smoothstep(0.35, 0.9, h));
            float s = max(dot(normalize(vDir), sunDir), 0.0);
            c = mix(c, sun, pow(s, 22.0) * 0.8);
            c += sun * pow(s, 60.0) * 0.6;
            gl_FragColor = vec4(min(c, vec3(1.0)), 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[600, 48, 32]} />
    </mesh>
  );
};

// Camera-facing painted card (clouds, glow). Lives on layer 1 so post depth/normal passes skip it.
const Card: React.FC<{
  tex: THREE.Texture;
  position: [number, number, number];
  scale: [number, number];
  opacity?: number;
  additive?: boolean;
  fog?: boolean;
}> = ({tex, position, scale, opacity = 1, additive = false, fog = true}) => {
  const mat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity,
        depthWrite: false,
        fog,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      }),
    [tex, opacity, additive, fog],
  );
  return <sprite material={mat} position={position} scale={[scale[0], scale[1], 1]} layers={1} />;
};

export const World: React.FC<{seed?: number}> = ({seed = 1}) => {
  const assets = useMemo(() => {
    const step = toTexture(stoneTexture(11, {blocksX: 4, blocksY: 1, base: '#ffe6c4', w: 1024, h: 200}));
    const wall = toTexture(stoneTexture(21, {blocksX: 3, blocksY: 2, base: '#e58f86'}));
    const under = toTexture(stoneTexture(31, {blocksX: 4, blocksY: 4, base: '#a77bb0'}));
    under.repeat.set(1, 24);
    const carved = [
      ['KEEP', 'GOING'],
      ['ALMOST', 'THERE'],
      ['THE TOP', 'IS WORTH IT'],
    ].map((lines, i) => {
      const c = stoneTexture(41 + i, {blocksX: 3, blocksY: 2, base: '#e58f86'});
      carveText(c, lines, 50 + i);
      return toon({map: toTexture(c)});
    });
    const clouds = [0, 1, 2, 3, 4, 5].map((i) => toTexture(cloudTexture(100 + i)));
    const warmClouds = [0, 1, 2].map((i) => toTexture(cloudTexture(200 + i, '#fff3e0', '#e7a3b8', '#fff6d8')));
    return {
      step: toon({map: step}),
      wall: toon({map: wall}),
      under: toon({map: under}),
      post: toon({color: '#ffe0bd'}),
      carved,
      clouds,
      warmClouds,
      glow: toTexture(glowTexture('rgba(255,244,210,1)', 'rgba(255,190,140,0)')),
      spire: toon({color: '#c9a3d6'}),
    };
  }, []);

  const r = rng(seed);

  const steps = [];
  for (let i = 0; i < COUNT; i++) {
    const [y, z] = stepTop(i);
    steps.push(
      <mesh key={`s${i}`} position={[0, y - 0.3, z]} material={assets.step} castShadow receiveShadow>
        <boxGeometry args={[STEP.width, 0.6, STEP.depth + 0.01]} />
      </mesh>,
    );
    // Posts along the open edge every 4 steps.
    if (i % 4 === 2) {
      steps.push(
        <group key={`p${i}`} position={[STEP.width / 2 - 0.18, y, z]}>
          <mesh position={[0, 0.32, 0]} material={assets.post} castShadow receiveShadow>
            <boxGeometry args={[0.22, 0.64, 0.22]} />
          </mesh>
          <mesh position={[0, 0.7, 0]} material={assets.post} castShadow>
            <sphereGeometry args={[0.14, 16, 12]} />
          </mesh>
        </group>,
      );
    }
  }

  // Wall slabs, each covering 5 steps, stepped with the stairs.
  const walls = [];
  for (let i = 0; i < COUNT; i += 5) {
    const [y, z] = stepTop(i + 2);
    const carvedIdx = i === 10 ? 0 : i === 25 ? 1 : i === 40 ? 2 : -1;
    const h = carvedIdx >= 0 ? 2.1 : 1.5 + (r() - 0.5) * 0.3;
    walls.push(
      <mesh
        key={`w${i}`}
        position={[WALL_X, y + h / 2 - 0.6, z]}
        material={carvedIdx >= 0 ? assets.carved[carvedIdx] : assets.wall}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.5, h, STEP.depth * 5 + 0.02]} />
      </mesh>,
    );
  }

  // The massive sloped body under the stairs.
  const len = Math.hypot(COUNT * STEP.rise, COUNT * STEP.depth);
  const angle = Math.atan2(STEP.rise, STEP.depth);
  const [my, mz] = stepTop(COUNT / 2);

  // Sea of clouds below, and drifting clouds around the far stairs.
  const cloudCards = [];
  for (let i = 0; i < 36; i++) {
    const x = 6 + r() * 70;
    const z = 10 - r() * 120;
    const y = -9 + r() * 4 + (-z) * 0.05;
    const s = 9 + r() * 14;
    cloudCards.push(
      <Card key={`c${i}`} tex={assets.clouds[i % 6]} position={[x, y, z]} scale={[s, s * 0.5]} />,
    );
  }
  for (let i = 0; i < 14; i++) {
    const k = 40 + r() * 100;
    const [y, z] = stepTop(k);
    const s = 8 + r() * 12;
    cloudCards.push(
      <Card
        key={`u${i}`}
        tex={assets.warmClouds[i % 3]}
        position={[(r() - 0.3) * 26, y + (r() - 0.5) * 8, z - 4 - r() * 10]}
        scale={[s, s * 0.5]}
        opacity={0.95}
      />,
    );
  }

  // Distant rock spires for scale (fogged into the sky colour).
  const spires = [];
  for (let i = 0; i < 7; i++) {
    const x = 40 + r() * 70;
    const z = -90 - r() * 150;
    const h = 30 + r() * 50;
    spires.push(
      <mesh key={`sp${i}`} position={[x, h / 2 - 12, z]} material={assets.spire}>
        <cylinderGeometry args={[0.8 + r() * 1.5, 5 + r() * 4, h, 7]} />
      </mesh>,
    );
  }

  const [gy, gz] = stepTop(COUNT + 30);

  return (
    <group>
      <SkyDome />
      {steps}
      {walls}
      <mesh position={[0, my - 2.4, mz - 0.4]} rotation={[angle, 0, 0]} material={assets.under} receiveShadow>
        <boxGeometry args={[STEP.width - 0.1, 3.6, len + 6]} />
      </mesh>
      {spires}
      {cloudCards}
      {/* The promise at the top: a soft glow where the stairs vanish. */}
      <Card tex={assets.glow} position={[0, gy, gz]} scale={[90, 90]} opacity={0.4} additive fog={false} />
      <Card tex={assets.glow} position={[0, gy, gz]} scale={[30, 30]} additive fog={false} />
    </group>
  );
};
