import React, {useId} from 'react';

const sid = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '');

/**
 * Re-draws `children` as a solid silhouette of `color`, faded out with a radial
 * falloff centred at (cx, cy). Stack several to light a cut-out character from
 * different sources (lamp, screen, window). Coordinates are in the current SVG space.
 */
export const LightPass: React.FC<{
  color: string;
  opacity?: number;
  cx: number;
  cy: number;
  rx: number;
  ry?: number;
  /** Rotation of the falloff ellipse in degrees. */
  angle?: number;
  /** 0..1, where the light starts to fall off. */
  core?: number;
  blend?: React.CSSProperties['mixBlendMode'];
  children: React.ReactNode;
}> = ({color, opacity = 1, cx, cy, rx, ry, angle = 0, core = 0, blend = 'screen', children}) => {
  const id = sid(useId());
  const r = ry ?? rx;
  return (
    <g style={{mixBlendMode: blend}} opacity={opacity}>
      <defs>
        <filter id={`f${id}`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feFlood floodColor={color} />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
        <radialGradient
          id={`g${id}`}
          gradientUnits="userSpaceOnUse"
          cx={0}
          cy={0}
          r={1}
          gradientTransform={`translate(${cx} ${cy}) rotate(${angle}) scale(${rx} ${r})`}
        >
          <stop offset={core} stopColor="#fff" stopOpacity={1} />
          <stop offset={core + (1 - core) * 0.45} stopColor="#fff" stopOpacity={0.45} />
          <stop offset={1} stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <mask id={`m${id}`} maskUnits="userSpaceOnUse" x={-20000} y={-20000} width={40000} height={40000}>
          <rect x={cx - rx * 1.2 - r} y={cy - r * 1.2 - rx} width={(rx + r) * 2.4} height={(rx + r) * 2.4} fill={`url(#g${id})`} />
        </mask>
      </defs>
      <g mask={`url(#m${id})`}>
        <g filter={`url(#f${id})`}>{children}</g>
      </g>
    </g>
  );
};

/** Simple soft glow blob (for lamps, bokeh, screen spill). */
export const Glow: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry?: number;
  color: string;
  opacity?: number;
  angle?: number;
  core?: number;
  blend?: React.CSSProperties['mixBlendMode'];
}> = ({cx, cy, rx, ry, color, opacity = 1, angle = 0, core = 0, blend}) => {
  const id = sid(useId());
  const r = ry ?? rx;
  return (
    <g style={blend ? {mixBlendMode: blend} : undefined}>
      <defs>
        <radialGradient id={`gl${id}`} cx="50%" cy="50%" r="50%">
          <stop offset={core} stopColor={color} stopOpacity={1} />
          <stop offset={core + (1 - core) * 0.4} stopColor={color} stopOpacity={0.42} />
          <stop offset={1} stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={r}
        fill={`url(#gl${id})`}
        opacity={opacity}
        transform={angle ? `rotate(${angle} ${cx} ${cy})` : undefined}
      />
    </g>
  );
};
