import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

// End credits: white lettering (the title's rounded type) on black, over a quiet pattern of the spiral symbol.
// The 'Fredoka' font is loaded by Monologue.tsx, which Root imports.
export const CREDITS_FRAMES = 300; // 10 s

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (t: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => interpolate(t, [a, b], [0, 1], {...clamp, easing: e});

const SPIRAL = (() => {
  const turns = 2.6;
  const N = 160;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * turns * 2 * Math.PI;
    const r = 3 + 6.6 * th;
    pts.push(`${(r * Math.cos(th)).toFixed(1)},${(r * Math.sin(th)).toFixed(1)}`);
  }
  return 'M' + pts.join(' L');
})();

// A loose grid of spirals, every other row offset, each turning slowly (alternating direction), drifting upward.
const Pattern: React.FC<{t: number; opacity: number}> = ({t, opacity}) => {
  const cell = 210;
  const cols = Math.ceil(1920 / cell) + 2;
  const rows = Math.ceil(1080 / cell) + 3;
  const drift = (t * 14) % cell;
  const items: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cell + (r % 2 ? cell / 2 : 0) - cell / 2;
      const y = r * cell - drift - cell / 2;
      const dir = (r + c) % 2 ? 1 : -1;
      const s = 0.78 + 0.22 * (((r * 7 + c * 3) % 5) / 4);
      items.push(<path key={`${r}-${c}`} d={SPIRAL} transform={`translate(${x} ${y}) rotate(${dir * t * 9 + (r * 37 + c * 61)}) scale(${s})`} />);
    }
  }
  return (
    <svg
      width={1920}
      height={1080}
      style={{
        position: 'absolute',
        opacity,
        maskImage: 'radial-gradient(ellipse 46% 52% at 50% 50%, transparent 30%, black 85%)',
        WebkitMaskImage: 'radial-gradient(ellipse 46% 52% at 50% 50%, transparent 30%, black 85%)',
      }}
    >
      <g fill="none" stroke="#ffffff" strokeWidth={4.5} strokeLinecap="round" strokeOpacity={0.13}>
        {items}
      </g>
    </svg>
  );
};

const type = (size: number, weight = 700): React.CSSProperties => ({
  fontFamily: 'Fredoka',
  fontWeight: weight,
  fontSize: size,
  lineHeight: 1.1,
  color: '#ffffff',
  textTransform: 'uppercase',
  letterSpacing: size * 0.02,
  textShadow: `0 0 ${size * 0.35}px rgba(255,255,255,0.18)`,
});

// Two cards over one continuous pattern: "Created by / Varun Kamalahasan", then "Special thanks / Mom / Tofu".
// Each fades in slowly at the centre, holds, and fades out.
const CARD1: [number, number] = [0.4, 4.8]; // in .. out (seconds)
const CARD2: [number, number] = [5.2, 9.6];

export const Credits: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const T = durationInFrames / fps;
  const patternFade = ease(t, 0, 1.6) * (1 - ease(t, T - 1.0, T - 0.1, Easing.in(Easing.quad)));

  // a soft fade with a whisper of blur; `at` = when this line starts to appear, [, out] = when the card leaves
  const fade = (at: number, out: number): React.CSSProperties => {
    const u = ease(t, at, at + 1.3, Easing.inOut(Easing.sin)) * (1 - ease(t, out - 0.8, out, Easing.inOut(Easing.sin)));
    return {opacity: u, filter: `blur(${(1 - u) * 6}px)`};
  };
  const card = (span: [number, number], children: React.ReactNode) =>
    t >= span[0] - 0.05 && t <= span[1] + 0.05 ? (
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
        <div style={{transform: `scale(${1 + 0.025 * ease(t, span[0], span[1])})`}}>{children}</div>
      </AbsoluteFill>
    ) : null;

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Pattern t={t} opacity={patternFade} />
      {card(
        CARD1,
        <>
          <div style={{...type(34, 600), letterSpacing: 8, opacity: 0.75, ...fade(CARD1[0], CARD1[1])}}>Created by</div>
          <div style={{...type(100), marginTop: 12, ...fade(CARD1[0] + 0.45, CARD1[1])}}>Varun Kamalahasan</div>
        </>,
      )}
      {card(
        CARD2,
        <>
          <div style={{...type(34, 600), letterSpacing: 8, opacity: 0.75, ...fade(CARD2[0], CARD2[1])}}>Special thanks</div>
          <div style={{...type(72), marginTop: 16, ...fade(CARD2[0] + 0.45, CARD2[1])}}>Mom</div>
          <div style={{...type(72), marginTop: 4, ...fade(CARD2[0] + 0.8, CARD2[1])}}>Tofu</div>
        </>,
      )}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 75% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)'}} />
    </AbsoluteFill>
  );
};
