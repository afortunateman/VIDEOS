// Takes over rendering: scene -> colour+depth, normals, then one full-screen pass that adds
// ink outlines (from depth and normal edges), depth of field, bloom, colour grade, vignette, grain.
import {useFrame, useThree} from '@react-three/fiber';
import {useEffect, useMemo} from 'react';
import * as THREE from 'three';

export type PostSettings = {
  focus: number; // distance from camera that is sharp
  focusRange: number; // depth around focus that stays sharp
  maxBlur: number; // pixels
  inkWidth: number; // pixels
  ink: string;
  saturation: number;
  lift: [number, number, number];
  vignette: number;
  bloom: number;
  grain: number;
  seed: number;
  exposure?: number;
};

export const defaultPost: PostSettings = {
  focus: 6,
  focusRange: 2.5,
  maxBlur: 9,
  inkWidth: 3,
  ink: '#2a1630',
  saturation: 1.12,
  lift: [0.05, 0.03, 0.07],
  vignette: 0.35,
  bloom: 0.35,
  grain: 0.03,
  seed: 0,
};

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const frag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform vec2 res;
uniform float near, far;
uniform float focus, focusRange, maxBlur, inkWidth;
uniform vec3 ink;
uniform float saturation, vignette, bloom, grain, seed, exposure;
uniform vec3 lift;

float lin(float d) {
  float z = d * 2.0 - 1.0;
  return (2.0 * near * far) / (far + near - z * (far - near));
}
float depthAt(vec2 uv) { return lin(texture2D(tDepth, uv).r); }

float coc(float z) {
  return clamp((abs(z - focus) - focusRange) / (focus * 1.2), 0.0, 1.0) * maxBlur;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }

void main() {
  vec2 px = 1.0 / res;
  float z = depthAt(vUv);
  float blur = coc(z);

  // Depth of field: golden-angle disc, background samples only spread where they are blurry too.
  vec3 col = vec3(0.0);
  vec3 glow = vec3(0.0);
  float wsum = 0.0;
  const int N = 40;
  for (int i = 0; i < N; i++) {
    float fi = float(i);
    float r = sqrt(fi / float(N));
    float a = fi * 2.39996;
    vec2 off = vec2(cos(a), sin(a)) * r;
    vec2 uv = vUv + off * blur * px;
    float sb = coc(depthAt(uv));
    float w = smoothstep(0.0, 1.0, sb / max(blur, 0.001) + 0.2);
    vec3 s = texture2D(tColor, uv).rgb;
    col += s * w;
    wsum += w;
    // Wide sample ring for bloom.
    vec3 g = texture2D(tColor, vUv + off * 38.0 * px).rgb;
    glow += max(g - 0.72, 0.0);
  }
  col = wsum > 0.0 ? col / wsum : texture2D(tColor, vUv).rgb;
  glow /= float(N);

  // Ink lines from depth and normal discontinuities.
  vec2 o = px * inkWidth;
  float zc = z;
  float zl = depthAt(vUv - vec2(o.x, 0.0));
  float zr = depthAt(vUv + vec2(o.x, 0.0));
  float zu = depthAt(vUv + vec2(0.0, o.y));
  float zd = depthAt(vUv - vec2(0.0, o.y));
  float dz = max(max(abs(zl - zc), abs(zr - zc)), max(abs(zu - zc), abs(zd - zc)));
  float depthEdge = smoothstep(0.035, 0.09, dz / zc);
  vec3 nc = texture2D(tNormal, vUv).rgb * 2.0 - 1.0;
  vec3 nl = texture2D(tNormal, vUv - vec2(o.x, 0.0)).rgb * 2.0 - 1.0;
  vec3 nr = texture2D(tNormal, vUv + vec2(o.x, 0.0)).rgb * 2.0 - 1.0;
  vec3 nu = texture2D(tNormal, vUv + vec2(0.0, o.y)).rgb * 2.0 - 1.0;
  vec3 nd = texture2D(tNormal, vUv - vec2(0.0, o.y)).rgb * 2.0 - 1.0;
  float dn = max(max(1.0 - dot(nc, nl), 1.0 - dot(nc, nr)), max(1.0 - dot(nc, nu), 1.0 - dot(nc, nd)));
  float normalEdge = smoothstep(0.25, 0.55, dn);
  float edge = max(depthEdge, normalEdge);
  // Lines fade with distance and blur (aerial perspective), skip the sky.
  float fade = (1.0 - smoothstep(0.0, maxBlur * 0.7, blur)) * (1.0 - smoothstep(30.0, 140.0, z));
  if (texture2D(tDepth, vUv).r > 0.99999) fade = 0.0;
  col = mix(col, ink, edge * fade * 0.92);

  col += glow * bloom * vec3(1.0, 0.85, 0.65) * 2.2;
  col *= exposure;

  col = clamp(col, 0.0, 1.0);
  // Grade: saturation, warm lifted blacks, gentle S-curve.
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(l), col, saturation);
  col = lift + col * (1.0 - lift);
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.25);

  // Vignette and grain.
  vec2 q = vUv - 0.5;
  q.x *= res.x / res.y;
  col *= 1.0 - vignette * smoothstep(0.35, 0.95, length(q) * 1.25);
  col += (hash(vUv * res) - 0.5) * grain;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  #include <colorspace_fragment>
}
`;

export const Post: React.FC<{settings: PostSettings}> = ({settings}) => {
  const {gl, scene, camera, size} = useThree();
  const dpr = gl.getPixelRatio();
  const w = Math.round(size.width * dpr);
  const h = Math.round(size.height * dpr);

  const targets = useMemo(() => {
    const color = new THREE.WebGLRenderTarget(w, h, {samples: 4, type: THREE.HalfFloatType});
    color.texture.colorSpace = THREE.LinearSRGBColorSpace;
    const depth = new THREE.WebGLRenderTarget(w, h);
    depth.depthTexture = new THREE.DepthTexture(w, h);
    depth.depthTexture.type = THREE.FloatType;
    const normal = new THREE.WebGLRenderTarget(w, h);
    return {color, depth, normal};
  }, [w, h]);

  const normalMat = useMemo(() => new THREE.MeshNormalMaterial(), []);
  const depthMat = useMemo(() => new THREE.MeshBasicMaterial({colorWrite: false}), []);

  const quad = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        tColor: {value: null},
        tDepth: {value: null},
        tNormal: {value: null},
        res: {value: new THREE.Vector2()},
        near: {value: 0.1},
        far: {value: 1000},
        focus: {value: 6},
        focusRange: {value: 2},
        maxBlur: {value: 8},
        inkWidth: {value: 2},
        ink: {value: new THREE.Color()},
        saturation: {value: 1},
        lift: {value: new THREE.Vector3()},
        vignette: {value: 0.3},
        bloom: {value: 0.3},
        grain: {value: 0.03},
        seed: {value: 0},
        exposure: {value: 1},
      },
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    mesh.frustumCulled = false;
    const s = new THREE.Scene();
    s.add(mesh);
    return {mat, scene: s, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)};
  }, []);

  useEffect(() => () => {
    targets.color.dispose();
    targets.depth.dispose();
    targets.normal.dispose();
  }, [targets]);

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const bg = scene.background;
    // 1. Colour.
    gl.setRenderTarget(targets.color);
    gl.render(scene, cam);
    // 2. Depth only (opaque objects; sprites/transparent excluded via layer 1 hidden).
    scene.background = null;
    scene.overrideMaterial = depthMat;
    cam.layers.disable(1);
    gl.setRenderTarget(targets.depth);
    gl.render(scene, cam);
    // 3. Normals.
    scene.overrideMaterial = normalMat;
    gl.setRenderTarget(targets.normal);
    gl.setClearColor('#8080ff', 1);
    gl.clear();
    gl.render(scene, cam);
    cam.layers.enable(1);
    scene.overrideMaterial = null;
    scene.background = bg;

    const u = quad.mat.uniforms;
    u.tColor.value = targets.color.texture;
    u.tDepth.value = targets.depth.depthTexture;
    u.tNormal.value = targets.normal.texture;
    u.res.value.set(w, h);
    u.near.value = cam.near;
    u.far.value = cam.far;
    u.focus.value = settings.focus;
    u.focusRange.value = settings.focusRange;
    u.maxBlur.value = settings.maxBlur * dpr;
    u.inkWidth.value = settings.inkWidth * dpr;
    u.ink.value.set(settings.ink).convertSRGBToLinear();
    u.saturation.value = settings.saturation;
    u.lift.value.set(...settings.lift);
    u.vignette.value = settings.vignette;
    u.bloom.value = settings.bloom;
    u.grain.value = settings.grain;
    u.seed.value = settings.seed;
    u.exposure.value = settings.exposure ?? 1;
    gl.setRenderTarget(null);
    gl.render(quad.scene, quad.cam);
  }, 1);

  return null;
};
