import {AbsoluteFill, Img, interpolate, Easing, OffthreadVideo, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import layout from '../public/title/layout.json';

// Title card for the cold open. Frame 0 follows the hook's staircase pull-back.
// 0.0-1.0 s  the staircase blurs, dims and warms
// 0.15-1.5 s the spiral (the wall carving, drawn in the title's style) draws itself, turning slowly
// 1.25-1.6 s it spins up and dives into the butterfly's place
// 1.6 s      the hit: a flare, and the title blooms in from blur, word by word; the lines draw outward
// 1.6-5.2 s  hold: slow push-in, a light sweep, drifting motes, the butterfly flaps
// 5.2-5.87 s fade out
export const TITLE_FRAMES = 176;
export const HIT = 1.6; // seconds into the card: the score's 2:11.4 downbeat lands here

const FILL = '#f6a25a';
const INK = '#4a0c0a';
const LW = layout.w; // 2000 x 667 title artwork
const LH = layout.h;
const SCALE = 0.8; // artwork px -> screen px
const TW = LW * SCALE;
const TH = LH * SCALE;
const TX = (1920 - TW) / 2;
const TY = 520 - TH / 2;
const BF = layout.pieces.butterfly;
const BF_CY = (BF.y0 + BF.y1) / 2;
const BF_SCREEN = {x: TX + BF.cx * SCALE, y: TY + BF_CY * SCALE};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (t: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => interpolate(t, [a, b], [0, 1], {...clamp, easing: e});
const outExpo = Easing.out(Easing.exp);

// Archimedean spiral from the centre outward, ending in a short tail like the carving on the wall.
const spiralPath = (() => {
  const pts: string[] = [];
  const turns = 2.6;
  const N = 220;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * turns * 2 * Math.PI;
    const r = 6 + 34 * th;
    pts.push(`${(r * Math.cos(th)).toFixed(1)},${(r * Math.sin(th)).toFixed(1)}`);
  }
  return 'M' + pts.join(' L');
})();
const SPIRAL_LEN = 2.6 * 2 * Math.PI * (6 + 34 * 2.6 * Math.PI); // generous; only used for dash reveal

// Butterfly flaps: bursts of full wingbeats with glides between. Returns the fold angle in degrees.
const flap = (t: number) => {
  const bursts: [number, number][] = [
    [HIT + 0.1, 3], // [start, wingbeats]
    [HIT + 1.6, 3],
    [HIT + 3.0, 2],
  ];
  const BEAT = 0.2; // seconds per wingbeat
  let deg = 8 + 5 * Math.sin(t * 2.2); // at rest: nearly open, breathing
  for (const [s, n] of bursts) {
    const u = (t - s) / BEAT;
    if (u >= 0 && u <= n) deg = Math.max(deg, 8 + 70 * (0.5 - 0.5 * Math.cos(2 * Math.PI * u)));
  }
  return deg;
};

const Piece: React.FC<{name: string; style?: React.CSSProperties}> = ({name, style}) => (
  <Img src={staticFile(`title/${name}.png`)} style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, ...style}} />
);

const Motes: React.FC<{t: number; opacity: number}> = ({t, opacity}) => (
  <AbsoluteFill style={{mixBlendMode: 'screen', opacity}}>
    {new Array(46).fill(0).map((_, i) => {
      const x = random(`mx${i}`) * 1920;
      const y0 = random(`my${i}`) * 1180;
      const sz = 3 + random(`ms${i}`) ** 2 * 16;
      const sp = 14 + random(`mv${i}`) * 34;
      const y = ((y0 - t * sp) % 1180 + 1180) % 1180 - 50;
      const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + random(`mt${i}`) * 2) + i);
      const far = sz > 10;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x + Math.sin(t * 0.7 + i) * 12,
            top: y,
            width: sz,
            height: sz,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255,214,150,${0.9 * tw}) 0%, rgba(255,170,90,${0.35 * tw}) 45%, rgba(255,150,80,0) 70%)`,
            filter: far ? `blur(${(sz - 8) * 0.35}px)` : undefined,
          }}
        />
      );
    })}
  </AbsoluteFill>
);

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  // Backdrop: the staircase, blurred, dimmed and warmed as the title arrives.
  const blurIn = ease(t, 0, 1.2);
  const bgBlur = 16 * blurIn + 6 * ease(t, HIT, HIT + 0.6);
  const bgBright = 1 - 0.45 * blurIn - 0.1 * ease(t, HIT, HIT + 0.8);
  const fadeOut = 1 - ease(t, 5.2, 5.87, Easing.in(Easing.quad));

  // Spiral.
  const draw = ease(t, 0.15, 1.45, Easing.inOut(Easing.quad));
  const dive = ease(t, 1.22, HIT, Easing.in(Easing.cubic));
  const spiralRot = -24 * t - 620 * dive;
  const spiralScale = interpolate(draw, [0, 1], [0.82, 1]) * interpolate(dive, [0, 1], [1, 0.16]);
  const spiralX = interpolate(dive, [0, 1], [960, BF_SCREEN.x]);
  const spiralY = interpolate(dive, [0, 1], [520, BF_SCREEN.y]);
  const spiralOpacity = ease(t, 0.1, 0.4) * (1 - ease(t, HIT - 0.06, HIT + 0.04));
  const spiralGlow = 0.6 + 0.4 * Math.sin(t * 5);

  // Flare at the hit.
  const flare = t < HIT ? 0 : Math.exp(-(t - HIT) * 3.2) * ease(t, HIT, HIT + 0.05);

  // Title pieces bloom in from blur, word by word.
  const bloom = (delay: number) => {
    const u = ease(t, HIT + delay, HIT + delay + 0.55, outExpo);
    return {opacity: u, filter: `blur(${(1 - u) * 26}px)`, transform: `scale(${1.22 - 0.22 * u})`} as React.CSSProperties;
  };
  const line = (delay: number, side: 'L' | 'R') => {
    const u = ease(t, HIT + delay, HIT + delay + 0.5, Easing.out(Easing.cubic));
    return {opacity: Math.min(1, u * 3), clipPath: side === 'L' ? `inset(0 0 0 ${(1 - u) * 100}%)` : `inset(0 ${(1 - u) * 100}% 0 0)`} as React.CSSProperties;
  };
  const titleOn = t >= HIT;
  const push = 1 + 0.035 * ease(t, HIT, 5.87, Easing.out(Easing.quad));
  const glow = 0.18 + 0.82 * Math.exp(-Math.max(0, t - HIT) * 1.8);

  // Butterfly pops in where the spiral lands, then flaps.
  const bfPop = ease(t, HIT - 0.04, HIT + 0.25, Easing.out(Easing.back(2.2)));
  const fl = flap(t);
  const wingOrigin = `${BF.cx}px ${BF_CY}px`;

  // Light sweep across the title.
  const sweep = ease(t, HIT + 0.9, HIT + 2.0, Easing.inOut(Easing.sin));

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{opacity: fadeOut}}>
        <AbsoluteFill style={{transform: `scale(${1 + 0.05 * blurIn})`}}>
          <OffthreadVideo src={staticFile('title/bg.mp4')} muted style={{width: 1920, height: 1080, filter: `blur(${bgBlur}px) brightness(${bgBright}) saturate(${1 + 0.15 * blurIn})`}} />
        </AbsoluteFill>
        {/* Warm light behind the title, and soft rays. */}
        <AbsoluteFill
          style={{
            mixBlendMode: 'screen',
            opacity: 0.35 * blurIn + 0.45 * ease(t, HIT, HIT + 0.4) * (0.85 + 0.15 * Math.sin(t * 1.3)),
            background: 'radial-gradient(ellipse 52% 42% at 50% 48%, rgba(255,176,96,0.75) 0%, rgba(255,120,60,0.28) 45%, rgba(0,0,0,0) 75%)',
          }}
        />
        <AbsoluteFill
          style={{
            mixBlendMode: 'screen',
            opacity: 0.22 * ease(t, HIT - 0.2, HIT + 0.5) + 0.25 * flare,
            background: `repeating-conic-gradient(from ${t * 6}deg at 50% 46%, rgba(255,200,140,0.5) 0deg 4deg, rgba(0,0,0,0) 4deg 15deg)`,
            filter: 'blur(14px)',
            maskImage: 'radial-gradient(ellipse 60% 55% at 50% 46%, black 0%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 46%, black 0%, transparent 70%)',
          }}
        />
        <Motes t={t} opacity={ease(t, 0.3, 1.4) * 0.9} />

        {/* The spiral. */}
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: spiralOpacity}}>
          <defs>
            <filter id="sglow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={7 + 5 * spiralGlow} result="b" />
              <feColorMatrix in="b" type="matrix" values="1 0 0 0 1  0 0.7 0 0 0.45  0 0 0.4 0 0.15  0 0 0 0.85 0" result="g" />
              <feMerge>
                <feMergeNode in="g" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g transform={`translate(${spiralX} ${spiralY}) rotate(${spiralRot}) scale(${spiralScale})`} filter="url(#sglow)">
            <path d={spiralPath} fill="none" stroke={INK} strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={SPIRAL_LEN} strokeDashoffset={SPIRAL_LEN * (1 - draw)} />
            <path d={spiralPath} fill="none" stroke={FILL} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={SPIRAL_LEN} strokeDashoffset={SPIRAL_LEN * (1 - draw)} />
          </g>
        </svg>

        {/* The title. */}
        <div style={{position: 'absolute', left: TX, top: TY, width: TW, height: TH, transform: `scale(${push})`, transformOrigin: '50% 60%'}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${SCALE})`, transformOrigin: '0 0', filter: `drop-shadow(0 0 ${18 * glow}px rgba(255,170,90,${0.75 * glow})) drop-shadow(0 6px 14px rgba(40,8,6,0.55))`}}>
            {titleOn ? (
              <>
                <Piece name="the" style={{...bloom(0), transformOrigin: '1003px 50px'}} />
                <Piece name="caterpillar" style={{...bloom(0.07), transformOrigin: '997px 195px'}} />
                <Piece name="andthe" style={{...bloom(0.16), transformOrigin: '998px 300px'}} />
                <Piece name="infinity" style={{...bloom(0.24), transformOrigin: '1001px 440px'}} />
                <Piece name="lineL1" style={line(0.28, 'L')} />
                <Piece name="lineR1" style={line(0.28, 'R')} />
                <Piece name="lineL2" style={line(0.4, 'L')} />
                <Piece name="lineR2" style={line(0.4, 'R')} />
                <div style={{position: 'absolute', left: 0, top: 0, width: LW, height: LH, transform: `scale(${bfPop})`, transformOrigin: wingOrigin, opacity: Math.min(1, bfPop * 2)}}>
                  <Piece name="wingL" style={{transformOrigin: wingOrigin, transform: `perspective(700px) rotateY(${fl}deg)`}} />
                  <Piece name="wingR" style={{transformOrigin: wingOrigin, transform: `perspective(700px) rotateY(${-fl}deg)`}} />
                </div>
                {/* Light sweep, masked to the lettering. */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: LW,
                    height: LH,
                    mixBlendMode: 'screen',
                    opacity: sweep > 0 && sweep < 1 ? 1 : 0,
                    background: `linear-gradient(105deg, rgba(255,255,255,0) ${sweep * 140 - 30}%, rgba(255,240,210,0.85) ${sweep * 140 - 18}%, rgba(255,255,255,0) ${sweep * 140 - 6}%)`,
                    maskImage: `url(${staticFile('title/logo.png')})`,
                    WebkitMaskImage: `url(${staticFile('title/logo.png')})`,
                    maskSize: '100% 100%',
                    WebkitMaskSize: '100% 100%',
                  }}
                />
              </>
            ) : null}
          </div>
        </div>

        {/* Flare. */}
        <AbsoluteFill
          style={{
            mixBlendMode: 'screen',
            opacity: flare,
            background: `radial-gradient(circle at ${BF_SCREEN.x}px ${BF_SCREEN.y - 160}px, rgba(255,250,235,1) 0%, rgba(255,214,150,0.75) 12%, rgba(255,150,80,0.25) 34%, rgba(0,0,0,0) 62%)`,
          }}
        />
        {/* Vignette. */}
        <AbsoluteFill style={{opacity: blurIn, background: 'radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
