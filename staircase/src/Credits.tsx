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

export const Credits: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const T = durationInFrames / fps;
  const fadeOut = 1 - ease(t, T - 1.4, T - 0.2, Easing.in(Easing.quad));

  const bloom = (at: number): React.CSSProperties => {
    const u = ease(t, at, at + 0.8, Easing.out(Easing.exp));
    return {opacity: u, filter: `blur(${(1 - u) * 16}px)`, transform: `translateY(${(1 - u) * 14}px) scale(${1.08 - 0.08 * u})`};
  };

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{opacity: fadeOut}}>
        <Pattern t={t} opacity={ease(t, 0, 1.6)} />
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
          <div style={{transform: `scale(${1 + 0.02 * ease(t, 0, T)})`}}>
            <div style={{...type(34, 600), letterSpacing: 8, opacity: 0.75, ...bloom(0.5)}}>Created by</div>
            <div style={{...type(92), marginTop: 10, ...bloom(0.8)}}>Varun Kamalahasan</div>
            <div style={{width: 120, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.5)', margin: '56px auto 52px', ...bloom(1.5)}} />
            <div style={{...type(34, 600), letterSpacing: 8, opacity: 0.75, ...bloom(1.9)}}>Special thanks</div>
            <div style={{...type(64), marginTop: 14, ...bloom(2.2)}}>Mom</div>
            <div style={{...type(64), marginTop: 4, ...bloom(2.5)}}>Tofu</div>
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 75% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
