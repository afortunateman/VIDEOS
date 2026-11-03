import * as THREE from 'three';

// Three-band cel ramp: shadow, mid, lit. Hard steps give the cartoon look.
let ramp: THREE.DataTexture | null = null;
export const toonRamp = () => {
  if (ramp) return ramp;
  const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  ramp = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
};

export const toon = (opts: {color?: string; map?: THREE.Texture; emissive?: string; emissiveIntensity?: number}) =>
  new THREE.MeshToonMaterial({
    color: opts.color ?? '#ffffff',
    map: opts.map,
    gradientMap: toonRamp(),
    emissive: opts.emissive ?? '#000000',
    emissiveIntensity: opts.emissiveIntensity ?? 1,
  });
