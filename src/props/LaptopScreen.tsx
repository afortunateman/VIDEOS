import React from 'react';

/**
 * The document on god Varun's laptop. Plain HTML so the type stays crisp at any
 * camera zoom. Native size 1280x800; place it with a CSS transform.
 */
export const SCREEN_W = 1280;
export const SCREEN_H = 800;

/** Where the typed body line sits on the page (screen-local px), for camera targeting. */
export const DOC_LAYOUT = {
  pageX: 260,
  pageW: 760,
  titleY: 182,
  bodyY: 300,
  marginX: 84,
};

export const DocumentScreen: React.FC<{
  title: string;
  typed: string;
  cursorVisible: boolean;
  /** 0 = cool laptop white, 1 = golden candlelight. */
  warm?: number;
}> = ({title, typed, cursorVisible, warm = 0}) => {
  const {pageX, pageW, titleY, bodyY, marginX} = DOC_LAYOUT;
  return (
    <div
      style={{
        position: 'absolute',
        width: SCREEN_W,
        height: SCREEN_H,
        background: '#D6E0EC',
        overflow: 'hidden',
        fontFamily: '"EB Garamond", serif',
      }}
    >
      {/* app chrome */}
      <div style={{position: 'absolute', left: 0, top: 0, width: SCREEN_W, height: 56, background: '#C3CFDE'}} />
      {[0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: 22 + i * 24, top: 21, width: 13, height: 13, borderRadius: 7, background: '#9AA8BA'}} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{position: 'absolute', left: 420 + i * 70, top: 22, width: 46, height: 12, borderRadius: 6, background: '#A9B6C7'}} />
      ))}
      <div style={{position: 'absolute', left: 0, top: 56, width: SCREEN_W, height: 34, background: '#CCD7E5'}} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} style={{position: 'absolute', left: 300 + i * 52, top: 68, width: 30, height: 9, borderRadius: 3, background: '#AEBBCB'}} />
      ))}

      {/* the page */}
      <div
        style={{
          position: 'absolute',
          left: pageX,
          top: 112,
          width: pageW,
          height: 900,
          background: '#F5F8FC',
          boxShadow: '0 4px 24px rgba(40,60,90,0.25)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: titleY - 112 - 24,
            width: pageW,
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 38,
            letterSpacing: '0.14em',
            color: '#161B23',
          }}
        >
          {title}
        </div>
        <div
          style={{
            position: 'absolute',
            left: marginX,
            top: bodyY - 112 - 18,
            width: pageW - marginX * 2,
            fontSize: 29,
            lineHeight: '38px',
            color: '#1C2129',
            whiteSpace: 'pre',
          }}
        >
          {typed}
          <span
            style={{
              display: 'inline-block',
              width: 2.5,
              height: 30,
              marginLeft: 2,
              verticalAlign: '-5px',
              background: '#1C2129',
              opacity: cursorVisible ? 1 : 0,
            }}
          />
        </div>
      </div>

      {/* warm grade: the cold screen slowly becomes candlelight */}
      {warm > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#FFC77E',
            mixBlendMode: 'multiply',
            opacity: warm * 0.85,
          }}
        />
      )}
    </div>
  );
};
