// Plan a re-cut: which film frames to re-render, and how to splice them with the base master
// (the original 131 s cut, frames in voice-over time). Writes JSON to stdout.
// npx tsx scripts/plan.tsx 5,6,25,30 > out/plan.json
import {AUDIO_PIECES, FILM_FRAMES, FPS, SEGMENTS} from '../src/timeline';

const changed = new Set((process.argv[2] ?? '').split(',').filter(Boolean).map(Number));
type Part = {src: 'base'; a: number; b: number} | {src: 'chunk'; name: string; a: number; b: number}; // [a, b) frames
const renders: [number, number, string][] = []; // inclusive film frames
const parts: Part[] = [];
for (const seg of SEGMENTS) {
  if (changed.has(seg.shot.n)) {
    const last = renders[renders.length - 1];
    if (last && last[1] === seg.filmA - 1) last[1] = seg.filmB - 1;
    else renders.push([seg.filmA, seg.filmB - 1, `r${renders.length + 1}`]);
  } else {
    if (seg.holdFrames) throw new Error(`shot ${seg.shot.n} has a hold but is not in the re-render list`);
    const p = parts[parts.length - 1];
    if (p && p.src === 'base' && p.b === seg.voA) p.b = seg.voB;
    else parts.push({src: 'base', a: seg.voA, b: seg.voB});
  }
  if (changed.has(seg.shot.n)) {
    const r = renders[renders.length - 1];
    const p = parts[parts.length - 1];
    if (p && p.src === 'chunk' && p.name === r[2]) p.b = seg.filmB - r[0];
    else parts.push({src: 'chunk', name: r[2], a: seg.filmA - r[0], b: seg.filmB - r[0]});
  }
}
console.log(JSON.stringify({fps: FPS, frames: FILM_FRAMES, renders, parts, audio: AUDIO_PIECES}, null, 1));
