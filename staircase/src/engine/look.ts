// Time-of-day looks for the colour script. Every value can be blended between two looks.
import * as THREE from 'three';
import {V3} from './stairs';

export type Look = {
  skyTop: string;
  skyMid: string;
  skyLow: string;
  sunColor: string;
  sunDir: V3; // where the sun / moon sits in the sky
  sunSize: number; // 0 = hidden
  stars: number;
  keyColor: string;
  keyIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  ambient: string;
  ambientIntensity: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  cloudTint: string;
  glow: number; // glow at the top of the stairs
  glowColor: string;
  saturation: number;
  lift: V3;
  vignette: number;
  bloom: number;
  exposure: number;
};

const base: Look = {
  skyTop: '#2f5fe0',
  skyMid: '#6fa8ff',
  skyLow: '#ffd2b0',
  sunColor: '#fff2c9',
  sunDir: [0.55, 0.42, -0.72],
  sunSize: 1,
  stars: 0,
  keyColor: '#fff0d6',
  keyIntensity: 3.2,
  hemiSky: '#9fb2ff',
  hemiGround: '#c98aa8',
  hemiIntensity: 0.95,
  ambient: '#7a5ad0',
  ambientIntensity: 0.55,
  fogColor: '#ffc9a8',
  fogNear: 70,
  fogFar: 320,
  cloudTint: '#ffffff',
  glow: 0.4,
  glowColor: '#fff4d2',
  saturation: 1.22,
  lift: [0.03, 0.02, 0.05],
  vignette: 0.35,
  bloom: 0.22,
  exposure: 1,
};

export const LOOKS: Record<string, Look> = {
  day: base,
  dawn: {
    ...base,
    skyTop: '#3a4fc4',
    skyMid: '#c79be8',
    skyLow: '#ffb38a',
    sunColor: '#ffd9a0',
    sunDir: [0.75, 0.12, -0.65],
    keyColor: '#ffc68f',
    keyIntensity: 2.8,
    hemiSky: '#a7a6ff',
    hemiGround: '#d98a8a',
    fogColor: '#f7b9a8',
    fogNear: 50,
    fogFar: 260,
    cloudTint: '#ffe0d0',
    glow: 0.6,
    lift: [0.05, 0.03, 0.06],
  },
  morningMist: {
    ...base,
    skyTop: '#4a7be8',
    skyMid: '#9cc4ff',
    skyLow: '#ffe2c8',
    sunDir: [0.7, 0.3, -0.6],
    keyColor: '#ffe6c2',
    keyIntensity: 2.6,
    fogColor: '#e9dcd8',
    fogNear: 8,
    fogFar: 90,
    hemiIntensity: 0.9,
    saturation: 1.12,
    glow: 0.3,
  },
  afternoon: {
    ...base,
    skyTop: '#2a55d6',
    skyMid: '#5f9cff',
    skyLow: '#ffc896',
    sunDir: [0.8, 0.5, 0.2],
    keyColor: '#ffe3b8',
    keyIntensity: 3.6,
    hemiIntensity: 0.6,
    ambientIntensity: 0.38,
    saturation: 1.25,
  },
  overcast: {
    ...base,
    skyTop: '#6c7aa8',
    skyMid: '#a3abc6',
    skyLow: '#d9cfd0',
    sunColor: '#e8e6ee',
    sunSize: 0,
    keyColor: '#e6e8f5',
    keyIntensity: 0.65,
    hemiSky: '#b9c3e6',
    hemiGround: '#9a8fa8',
    hemiIntensity: 1.6,
    ambient: '#8a86b8',
    ambientIntensity: 0.55,
    fogColor: '#bdbdcf',
    fogNear: 25,
    fogFar: 160,
    cloudTint: '#d6d6e6',
    glow: 0.15,
    saturation: 0.9,
    lift: [0.05, 0.05, 0.07],
  },
  dusk: {
    ...base,
    skyTop: '#2b2368',
    skyMid: '#a3407a',
    skyLow: '#ff7a4a',
    sunColor: '#ff9a5a',
    sunDir: [0.85, 0.04, -0.5],
    keyColor: '#ff8a5a',
    keyIntensity: 2.4,
    hemiSky: '#6e5ab8',
    hemiGround: '#a8506e',
    hemiIntensity: 0.7,
    ambient: '#5a3a9a',
    ambientIntensity: 0.5,
    fogColor: '#c46a78',
    fogNear: 30,
    fogFar: 200,
    cloudTint: '#ff9e9a',
    glow: 0.25,
    saturation: 1.18,
    lift: [0.06, 0.02, 0.06],
  },
  night: {
    ...base,
    skyTop: '#0b1240',
    skyMid: '#1d2f7a',
    skyLow: '#3d4f9a',
    sunColor: '#dfe8ff',
    sunDir: [-0.4, 0.55, -0.73],
    sunSize: 0.35,
    stars: 1,
    keyColor: '#a9bcff',
    keyIntensity: 1.45,
    hemiSky: '#4a62c0',
    hemiGround: '#3a2c66',
    hemiIntensity: 0.95,
    ambient: '#4a4ab0',
    ambientIntensity: 0.7,
    fogColor: '#26337a',
    fogNear: 50,
    fogFar: 320,
    cloudTint: '#8a9ad8',
    glow: 0.3,
    glowColor: '#ffd9a0',
    saturation: 1.15,
    lift: [0.03, 0.03, 0.07],
    vignette: 0.45,
  },
  fire: {
    ...base,
    skyTop: '#070b2e',
    skyMid: '#131f5c',
    skyLow: '#2a3070',
    sunColor: '#dfe8ff',
    sunDir: [-0.5, 0.6, -0.6],
    sunSize: 0.3,
    stars: 1,
    keyColor: '#7f95e6',
    keyIntensity: 0.55,
    hemiSky: '#2c3c8a',
    hemiGround: '#24183e',
    hemiIntensity: 0.45,
    ambient: '#2c2a7a',
    ambientIntensity: 0.4,
    fogColor: '#141c4a',
    fogNear: 30,
    fogFar: 180,
    cloudTint: '#3a4890',
    glow: 0,
    saturation: 1.2,
    lift: [0.03, 0.02, 0.06],
    vignette: 0.5,
    bloom: 0.35,
  },
  predawn: {
    ...base,
    skyTop: '#1a2a78',
    skyMid: '#5b6fc4',
    skyLow: '#e8a6b8',
    sunColor: '#ffd0c0',
    sunDir: [0.8, -0.02, -0.6],
    sunSize: 0,
    stars: 0.25,
    keyColor: '#b8c0ff',
    keyIntensity: 1.2,
    hemiSky: '#7f8ce0',
    hemiGround: '#8a6a9a',
    hemiIntensity: 0.85,
    ambient: '#5a5ab8',
    ambientIntensity: 0.5,
    fogColor: '#8a8ac8',
    fogNear: 40,
    fogFar: 240,
    cloudTint: '#c0b8e8',
    glow: 0.2,
    saturation: 1.1,
    lift: [0.04, 0.04, 0.08],
  },
  golden: {
    ...base,
    skyTop: '#3355cc',
    skyMid: '#8faaf0',
    skyLow: '#ffb070',
    sunColor: '#ffd28a',
    sunDir: [0.85, 0.16, -0.25],
    keyColor: '#ffbf7a',
    keyIntensity: 3.4,
    hemiSky: '#9aa6f0',
    hemiGround: '#d9906e',
    fogColor: '#ffb98e',
    cloudTint: '#ffd6b0',
    glow: 0.35,
    saturation: 1.25,
    lift: [0.05, 0.03, 0.04],
  },
  sunset: {
    ...base,
    skyTop: '#2e3a9e',
    skyMid: '#c86aa0',
    skyLow: '#ff9a4a',
    sunColor: '#ffb060',
    sunDir: [0.95, 0.05, -0.1],
    sunSize: 1.6,
    keyColor: '#ff9a5a',
    keyIntensity: 3.0,
    hemiSky: '#8a7ae0',
    hemiGround: '#d97a6e',
    hemiIntensity: 0.7,
    fogColor: '#f39a86',
    fogNear: 50,
    fogFar: 280,
    cloudTint: '#ffb4a0',
    glow: 0.2,
    saturation: 1.28,
    lift: [0.06, 0.03, 0.05],
  },
};

const c1 = new THREE.Color();
const c2 = new THREE.Color();
const mixHex = (a: string, b: string, t: number) => '#' + c1.set(a).lerp(c2.set(b), t).getHexString();
const mixN = (a: number, b: number, t: number) => a + (b - a) * t;
const mixV = (a: V3, b: V3, t: number): V3 => {
  const v = new THREE.Vector3(...a).lerp(new THREE.Vector3(...b), t);
  if (v.lengthSq() > 0) v.normalize();
  return [v.x, v.y, v.z];
};

export const blendLooks = (a: Look, b: Look, t: number): Look => {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const out = {} as Record<string, unknown>;
  for (const k of Object.keys(a) as (keyof Look)[]) {
    const va = a[k];
    const vb = b[k];
    if (typeof va === 'string') out[k] = mixHex(va, vb as string, t);
    else if (typeof va === 'number') out[k] = mixN(va, vb as number, t);
    else if (k === 'lift') out[k] = (va as V3).map((x, i) => mixN(x, (vb as V3)[i], t));
    else out[k] = mixV(va as V3, vb as V3, t);
  }
  return out as Look;
};
