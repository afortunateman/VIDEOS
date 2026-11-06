import {AbsoluteFill, cancelRender, continueRender, delayRender, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// The monologue edit: the talking-head video, a quote card over the opening empty-wall shot (in the title's lettering),
// and a spiral on the side that winds in as the video plays (a progress timer, for retention).
export type MonologueProps = {
  src: string; // file in public/, e.g. 'monologue/mono.mp4'
  quoteIn: number; // seconds: the quote starts to appear
  quoteOut: number; // seconds: the quote is gone
  durationSec: number;
  width: number;
  height: number;
};

const FILL = '#f6a25a';
const INK = '#4a0c0a';

// Load the title-matching rounded font before rendering.
const fontHandle = delayRender('font');
Promise.all(
  [
    ['Fredoka', 'fonts/fredoka-latin-700-normal.woff2', '700'],
    ['Fredoka', 'fonts/fredoka-latin-600-normal.woff2', '600'],
  ].map(([family, file, weight]) => {
    const f = new FontFace(family, `url(${staticFile(file)})`, {weight});
    return f.load().then((l) => document.fonts.add(l));
  }),
)
  .then(() => continueRender(fontHandle))
  .catch((e) => cancelRender(e));

const QUOTE = [
  ['The meaning of life'],
  ['is just to be alive.'],
  ['It is so plain'],
  ['and so obvious'],
  ['and so simple.'],
];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (t: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => interpolate(t, [a, b], [0, 1], {...clamp, easing: e});

// Lettering in the title's style: chunky rounded letters, orange fill, thick dark maroon outline, a soft warm glow.
const lettering = (size: number, weight = 700): React.CSSProperties => ({
  fontFamily: 'Fredoka',
  fontWeight: weight,
  fontSize: size,
  lineHeight: 1.08,
  color: FILL,
  WebkitTextStroke: `${Math.round(size * 0.17)}px ${INK}`,
  paintOrder: 'stroke fill',
  letterSpacing: size * 0.01,
  textTransform: 'uppercase',
  filter: `drop-shadow(0 ${size * 0.06}px ${size * 0.12}px rgba(40,8,6,0.55)) drop-shadow(0 0 ${size * 0.25}px rgba(255,170,90,0.35))`,
});

// Archimedean spiral, outside -> centre, as a polyline (so its length can drive a dash reveal).
const SPIRAL = (() => {
  const turns = 2.6;
  const N = 260;
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const th = (1 - i / N) * turns * 2 * Math.PI; // outside first
    const r = 4 + 9.2 * th;
    pts.push([r * Math.cos(th), r * Math.sin(th)]);
  }
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return {d: 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L'), len, pts};
})();

const SpiralTimer: React.FC<{p: number; t: number; size: number; appear: number}> = ({p, t, size, appear}) => {
  const dash = SPIRAL.len * p;
  // The tip: the point the reveal has reached.
  const idx = Math.min(SPIRAL.pts.length - 1, Math.round(p * (SPIRAL.pts.length - 1)));
  const [tx, ty] = SPIRAL.pts[idx];
  const pulse = 0.75 + 0.25 * Math.sin(t * 4);
  return (
    <svg width={size * 1.4} height={size * 1.4} viewBox={`${-85 * 1.4} ${-85 * 1.4} ${170 * 1.4} ${170 * 1.4}`} style={{opacity: appear, transform: `scale(${0.85 + 0.15 * appear}) rotate(${-t * 6}deg)`, overflow: 'visible'}}>
      <defs>
        <filter id="tipglow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      {/* track: the whole spiral, faint, so you can see how much is left */}
      <path d={SPIRAL.d} fill="none" stroke={INK} strokeOpacity={0.4} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      <path d={SPIRAL.d} fill="none" stroke={FILL} strokeOpacity={0.25} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* progress */}
      <path d={SPIRAL.d} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${dash} ${SPIRAL.len}`} />
      <path d={SPIRAL.d} fill="none" stroke={FILL} strokeWidth={7.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${dash} ${SPIRAL.len}`} />
      {p > 0.002 ? (
        <>
          <circle cx={tx} cy={ty} r={11} fill="#ffd9a0" opacity={0.7 * pulse} filter="url(#tipglow)" />
          <circle cx={tx} cy={ty} r={4} fill="#fff1dc" opacity={0.95} />
        </>
      ) : null}
    </svg>
  );
};

export const Monologue: React.FC<MonologueProps> = ({src, quoteIn, quoteOut}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();
  const t = frame / fps;
  const T = durationInFrames / fps;
  const u = Math.min(width, height) / 1080; // scale for any resolution / orientation
  const portrait = height > width;

  // Quote: lines bloom in one after another (blur -> sharp, slight scale), hold, then soften away.
  const lineAt = (i: number) => quoteIn + 0.25 + i * 0.32;
  const out = ease(t, quoteOut - 0.6, quoteOut, Easing.in(Easing.quad));
  const quoteOn = t >= quoteIn - 0.1 && t <= quoteOut + 0.05;
  const authorIn = ease(t, lineAt(QUOTE.length) + 0.1, lineAt(QUOTE.length) + 0.7, Easing.out(Easing.cubic));
  const wash = ease(t, quoteIn, quoteIn + 0.6) * (1 - out);

  const quoteLayer = quoteOn ? (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: 80 * u, opacity: 1 - out, filter: out > 0 ? `blur(${out * 10}px)` : undefined}}>
      <div style={{textAlign: 'center', transform: `scale(${1 + 0.02 * ease(t, quoteIn, quoteOut)})`}}>
        {QUOTE.map(([line], i) => {
          const a = ease(t, lineAt(i), lineAt(i) + 0.55, Easing.out(Easing.exp));
          return (
            <div key={i} style={{...lettering((portrait ? 78 : 92) * u), opacity: a, filter: `blur(${(1 - a) * 18}px)`, transform: `translateY(${(1 - a) * 18 * u}px) scale(${1.12 - 0.12 * a})`, ...(a < 1 ? {} : {})}}>
              {line}
            </div>
          );
        })}
        <div style={{...lettering((portrait ? 40 : 44) * u, 600), marginTop: 26 * u, opacity: authorIn, letterSpacing: 4 * u, transform: `translateY(${(1 - authorIn) * 10 * u}px)`}}>— Alan W. Watts</div>
      </div>
    </AbsoluteFill>
  ) : null;

  // Spiral timer: appears just after the start, fills over the whole video.
  const appear = ease(t, 0.3, 1.0) * (1 - ease(t, T - 0.4, T));
  const p = Math.min(1, Math.max(0, t / T));
  const size = (portrait ? 110 : 120) * u;

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <OffthreadVideo src={staticFile(src)} style={{width, height, objectFit: 'cover'}} />
      {/* a soft warm wash behind the quote so it reads on the wall */}
      <AbsoluteFill style={{opacity: 0.55 * wash, background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(255,190,120,0.35) 0%, rgba(0,0,0,0) 70%)', mixBlendMode: 'screen'}} />
      {quoteLayer}
      <div style={{position: 'absolute', right: (portrait ? 40 : 56) * u, top: portrait ? 120 * u : undefined, bottom: portrait ? undefined : 56 * u}}>
        <SpiralTimer p={p} t={t} size={size} appear={appear} />
      </div>
    </AbsoluteFill>
  );
};
