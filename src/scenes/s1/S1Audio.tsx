import React from 'react';
import {Html5Audio, Sequence, staticFile} from 'remotion';
import {FPS, S1, sec} from '../../timeline/timeline';
import {clamp01} from '../../utils/easing';
import {hash01} from '../../utils/seededRandom';
import {S1_KEY_TIMES} from './typing';

const fade = (f: number, inFrom: number, inTo: number, outFrom: number, outTo: number) => {
  const t = f / FPS;
  const a = inTo > inFrom ? clamp01((t - inFrom) / (inTo - inFrom)) : 1;
  const b = outTo > outFrom ? 1 - clamp01((t - outFrom) / (outTo - outFrom)) : 1;
  return a * b;
};

/** Sound for S1. Every cue is placed from timeline.ts. */
export const S1Audio: React.FC = () => (
  <>
    {/* the quiet office */}
    <Html5Audio src={staticFile('audio/sfx/room_tone.wav')} volume={(f) => 0.32 * fade(f, 0, 1.5, 22.5, 24)} />

    {/* TAP. TAP. TAP. */}
    {S1.taps.map((t, i) => (
      <Sequence key={`tap${i}`} from={sec(t) - 1} durationInFrames={sec(0.7)} layout="none">
        <Html5Audio src={staticFile(`audio/sfx/${['tap', 'tap_2', 'tap_3'][i % 3]}.wav`)} volume={0.85 - i * 0.05} />
      </Sequence>
    ))}

    {/* a low drone creeps in once the tapping has stopped and the silence has landed */}
    <Sequence from={sec(S1.pullOutStart)} layout="none">
      <Html5Audio
        src={staticFile('audio/music/drone_low.wav')}
        volume={(f) => 0.16 * fade(f, 0, 3.5, S1.warmStart - S1.pullOutStart + 1, 24 - S1.pullOutStart)}
      />
    </Sequence>

    {/* shirt moves as he reaches for the keys */}
    <Sequence from={sec(S1.handsToKeys - 0.15)} durationInFrames={sec(0.9)} layout="none">
      <Html5Audio src={staticFile('audio/sfx/rustle.wav')} volume={0.3} />
    </Sequence>

    {/* one key click per typed character */}
    {S1_KEY_TIMES.map((t, i) => {
      const ch = S1.typedLine[i];
      const v = ch === ' ' ? 0.3 : 0.3 + hash01(i, 3) * 0.14;
      const variant = 1 + Math.floor(hash01(i, 9) * 6);
      return (
        <Sequence key={`k${i}`} from={sec(t)} durationInFrames={sec(0.2)} layout="none">
          <Html5Audio src={staticFile(`audio/sfx/key_${variant}.wav`)} volume={v} />
        </Sequence>
      );
    })}

    {/* the screen's light warms into candlelight */}
    <Sequence from={sec(S1.warmStart)} layout="none">
      <Html5Audio src={staticFile('audio/music/warm_swell.wav')} volume={(f) => 0.3 * fade(f, 0, 2.5, 99, 99)} />
    </Sequence>

    {/* pre-lap: the wind outside the dining room arrives before the picture does */}
    <Sequence from={sec(S1.dissolveStart - 1.5)} layout="none">
      <Html5Audio src={staticFile('audio/sfx/wind.wav')} volume={(f) => 0.14 * fade(f, 0, 3.5, 99, 99)} />
    </Sequence>
  </>
);
