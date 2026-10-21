// Builds a labelled contact sheet of frame grabs at each beat of a rendered scene.
// Usage: node scripts/beat-sheet.mjs S1   (expects out/s1.mp4, writes out/s1_beats.png)
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {S1} from '../src/timeline/timeline.ts';

const BEATS = {
  S1: [
    [0.25, 'Fade in: ECU finger on desk'],
    [S1.taps[0], 'TAP'],
    [S1.taps[1] - 0.15, 'TAP (finger raised)'],
    [S1.taps[2], 'TAP'],
    [S1.tapsStop, 'Tapping stops. Silence'],
    [4.0, 'Pull out begins'],
    [5.5, 'Medium: Varun at the laptop (globe, blurred)'],
    [S1.shotOts + 0.4, 'OTS: blank doc, title, cursor'],
    [S1.shotFace + 0.5, 'Close-up: face lit by screen'],
    [S1.handsToKeys + 0.4, 'Hands to the keyboard'],
    [S1.shotTyping + 1.0, 'Typing begins'],
    [S1.lineComplete, 'Line complete. Hold'],
    [S1.warmStart + 1, 'Screen glow warms'],
    [S1.dissolveStart, 'Dissolve to dining room starts'],
    [23.6, 'Candlelight (end of S1)'],
  ],
};

const scene = process.argv[2] ?? 'S1';
const beats = BEATS[scene];
const src = `out/${scene.toLowerCase()}.mp4`;
if (!beats || !fs.existsSync(src)) {
  console.error(`Need beats for ${scene} and a render at ${src}`);
  process.exit(1);
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'beats-'));
beats.forEach(([t, label], i) => {
  const text = `${t.toFixed(1)}s  ${label}`.replace(/:/g, '\\:').replace(/'/g, '');
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-ss', String(t), '-i', src, '-frames:v', '1',
    '-vf', `scale=640:-1,drawtext=font=Inter:text='${text}':x=12:y=h-34:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=6`,
    path.join(tmp, `b${String(i).padStart(2, '0')}.png`),
  ]);
});
const cols = 3;
const rows = Math.ceil(beats.length / cols);
const out = `out/${scene.toLowerCase()}_beats.png`;
execFileSync('ffmpeg', [
  '-v', 'error', '-y', '-framerate', '1', '-i', path.join(tmp, 'b%02d.png'),
  '-vf', `tile=${cols}x${rows}:padding=6:color=0x111111`, '-frames:v', '1', out,
]);
fs.rmSync(tmp, {recursive: true});
console.log('wrote', out);
