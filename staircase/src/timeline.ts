// Film timeline: the shots in voice-over time, plus holds (pauses in the voice-over) that stretch some shots.
// Shots without a hold render exactly as in the original 131 s cut, just shifted later by the holds before them.
import {Shot} from './engine/director';
import {SHOTS} from './shots';

export const FPS = 30;
export const VO_FRAMES = 3930; // the original cut, before any holds

export type Segment = {shot: Shot; voA: number; voB: number; filmA: number; filmB: number; holdFrames: number};

// First frame whose time is >= s, using the same float comparison as the original shot lookup.
const firstFrameAt = (s: number) => {
  let f = Math.ceil(s * FPS);
  while ((f - 1) / FPS >= s) f--;
  while (f / FPS < s) f++;
  return f;
};

export const SEGMENTS: Segment[] = (() => {
  let off = 0;
  return SHOTS.map((shot, i) => {
    const voA = i === 0 ? 0 : firstFrameAt(shot.start);
    const voB = i < SHOTS.length - 1 ? firstFrameAt(SHOTS[i + 1].start) : VO_FRAMES;
    const holdFrames = Math.round((shot.hold ?? 0) * FPS);
    const seg = {shot, voA, voB, filmA: voA + off, filmB: voB + off + holdFrames, holdFrames};
    off += holdFrames;
    return seg;
  });
})();

export const FILM_FRAMES = SEGMENTS[SEGMENTS.length - 1].filmB;
export const FILM_SECONDS = FILM_FRAMES / FPS;

// Which shot a film frame shows, its local time, and the voice-over-time clock (clouds, grain, handheld).
export const locate = (frame: number) => {
  const seg = SEGMENTS.find((s) => frame >= s.filmA && frame < s.filmB) ?? SEGMENTS[SEGMENTS.length - 1];
  const voFrame = frame - (seg.filmA - seg.voA);
  const time = voFrame / FPS;
  const {shot} = seg;
  return {seg, shot, time, t: time - shot.start, T: shot.end - shot.start + (shot.hold ?? 0)};
};

// Voice-over pieces: vo.mp3 is split at each holdCut and each piece is delayed by the holds before it.
export type AudioPiece = {voFrom: number; voTo: number | null; filmAt: number}; // frames
export const AUDIO_PIECES: AudioPiece[] = (() => {
  const out: AudioPiece[] = [];
  let from = 0;
  let delay = 0;
  SEGMENTS.forEach((seg, i) => {
    if (!seg.holdFrames) return;
    if (seg.shot.holdCut === undefined) {
      if (i !== SEGMENTS.length - 1) throw new Error(`shot ${seg.shot.n}: a hold needs a holdCut`);
      return; // a hold on the last shot just extends the silent tail
    }
    const cut = Math.round(seg.shot.holdCut * FPS);
    out.push({voFrom: from, voTo: cut, filmAt: from + delay});
    from = cut;
    delay += seg.holdFrames;
  });
  out.push({voFrom: from, voTo: null, filmAt: from + delay});
  return out;
})();
