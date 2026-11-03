// Test frame: "He climbed past thousands of steps. Past caterpillars who had given up."
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {useLayoutEffect} from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Caterpillar, TIRED} from './scene/Caterpillar';
import {defaultPost, Post} from './scene/Post';
import {World, stepTop, STEP} from './scene/World';

type V3 = [number, number, number];

// Body points along the stairs, head first. The front half arches up onto the next step.
const climbPath = (headStep: number, x: number, segs = 7, arch = 0.5): V3[] => {
  const pts: V3[] = [];
  const spacing = 0.36;
  for (let i = 0; i <= segs; i++) {
    const s = headStep - (i * spacing) / STEP.depth;
    const [y0, z] = stepTop(Math.ceil(s - 0.5));
    // Hump in the middle of the body (inchworm arch), head lifted.
    const t = i / segs;
    const hump = Math.sin(Math.min(1, t * 1.6) * Math.PI) * arch * (i > 0 ? 1 : 0);
    const r = i === 0 ? 0.46 : 0.46 * (0.78 - ((i - 1) / (segs - 1)) * 0.32);
    const lift = i === 0 ? 0.62 : r * 0.95;
    pts.push([x, y0 + lift + hump, -s * STEP.depth + (z + s * STEP.depth) * 0.0]);
  }
  return pts;
};

const CameraRig: React.FC<{pos: V3; target: V3; fov: number}> = ({pos, target, fov}) => {
  const {camera, scene} = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(...pos);
    cam.fov = fov;
    cam.near = 0.1;
    cam.far = 1200;
    cam.lookAt(...target);
    cam.updateProjectionMatrix();
    cam.layers.enable(1);
    scene.fog = new THREE.Fog('#ffc9a8', 70, 320);
  }, [camera, scene, pos, target, fov]);
  return null;
};

export const TestFrame: React.FC = () => {
  const {width, height} = useVideoConfig();
  const heroStep = 9;
  const hero = climbPath(heroStep, 0.35, 7, 0.32);
  const [hy, hz] = stepTop(heroStep);
  const quitter = climbPath(17.2, -0.9, 6, 0);
  const far1 = climbPath(33, 0.2, 6, 0.3);
  const far2 = climbPath(52, -0.4, 6, 0.3);

  return (
    <AbsoluteFill style={{backgroundColor: '#f6c7c0'}}>
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: true}}>
        <CameraRig pos={[1.0, hy + 0.5, hz + 3.92]} target={[0.5, hy + 3, hz - 11.58]} fov={46} />
        <hemisphereLight args={['#9fb2ff', '#c98aa8', 0.75]} />
        <ambientLight color="#7a5ad0" intensity={0.45} />
        <directionalLight
          color="#fff0d6"
          intensity={3.2}
          position={[9, hy + 14, hz + 6]}
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-camera-near={0.5}
          shadow-camera-far={60}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
          ref={(l: THREE.DirectionalLight | null) => {
            if (l) {
              l.target.position.set(0, hy, hz - 3);
              l.target.updateMatrixWorld();
            }
          }}
        />
        <World />
        <Caterpillar
          path={hero}
          lookAt={[2.1, hy + 2.16, hz + 1.88]}
          face={{look: [0.35, -0.6], lid: 0.32, brow: 0.7, mouth: 'open', sweat: true}}
          suitcase
        />
        {/* One who gave up, slumped on a step. */}
        <Caterpillar
          path={quitter.map(([x, y, z], i) => [x - (i > 2 ? (i - 2) * 0.12 : 0), y - 0.08 * i, z] as V3)}
          lookAt={[-0.9, stepTop(17)[0] - 0.6, stepTop(17)[1] + 3]}
          face={{look: [0, 0.6], lid: 0.6, brow: -0.8, mouth: 'flat'}}
          palette={TIRED}
          headRadius={0.42}
        />
        <Caterpillar path={far1} lookAt={[0.2, stepTop(36)[0] + 1, stepTop(36)[1]]} face={{look: [0, -0.5], lid: 0.3, brow: 0.6, mouth: 'flat'}} />
        <Caterpillar path={far2} lookAt={[-0.4, stepTop(55)[0] + 1, stepTop(55)[1]]} face={{look: [0, -0.5], lid: 0.3, brow: 0.6, mouth: 'flat'}} />
        <Post settings={{...defaultPost, focus: 4.2, focusRange: 1.6, maxBlur: 7, bloom: 0.22, saturation: 1.22, lift: [0.03, 0.02, 0.05]}} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
