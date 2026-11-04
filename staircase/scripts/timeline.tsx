// Print the film timeline: each shot's film frames, its holds, and where it sat in the original cut.
// npx tsx scripts/timeline.tsx
import {AUDIO_PIECES, FILM_FRAMES, FPS, SEGMENTS} from '../src/timeline';

for (const s of SEGMENTS)
  console.log(
    `shot ${String(s.shot.n).padEnd(4)} film ${String(s.filmA).padStart(4)}-${String(s.filmB - 1).padStart(4)} (${(s.filmA / FPS).toFixed(2)}s)  orig ${s.voA}-${s.voB - 1}${s.holdFrames ? `  +${s.holdFrames / FPS}s hold` : ''}`,
  );
console.log(`film ${FILM_FRAMES} frames = ${FILM_FRAMES / FPS}s`);
console.log('audio', AUDIO_PIECES.map((p) => `vo ${p.voFrom}-${p.voTo ?? 'end'} @ film ${p.filmAt}`).join(' | '));
