// Single source of truth for timing. Seconds in beat tables are scene-relative.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const SHOW_COLD_OPEN = true;
export const SHOW_SUBTITLES = true;

/** Frames used by each cross-dissolve between scenes (taken from the end of the earlier scene). */
export const DISSOLVE_FRAMES = 12;

export type SceneId = 'C0' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'EC';

export type SceneDef = {
  id: SceneId;
  title: string;
  /** Start in seconds on the master timeline. */
  start: number;
  /** Length in seconds. */
  length: number;
};

export const SCENES: Record<SceneId, SceneDef> = {
  C0: {id: 'C0', title: "Cold open: the Hand's lore", start: 0, length: 18},
  S1: {id: 'S1', title: 'Office: tapping and the title', start: 18, length: 24},
  S2: {id: 'S2', title: 'Dining room: the broken circle', start: 42, length: 66},
  S3: {id: 'S3', title: 'Office: voice-over bridge', start: 108, length: 8},
  S4: {id: 'S4', title: 'Town square: the speech', start: 116, length: 172},
  S5: {id: 'S5', title: 'Porch: thrown out', start: 288, length: 30},
  S6: {id: 'S6', title: 'Office and square: the reveal', start: 318, length: 84},
  EC: {id: 'EC', title: 'End card', start: 402, length: 8},
};

export const TOTAL_SECONDS = 410;
export const TOTAL_FRAMES = TOTAL_SECONDS * FPS;

/** Seconds -> frames (rounded). */
export const sec = (s: number) => Math.round(s * FPS);

export const sceneStartFrame = (id: SceneId) => sec(SCENES[id].start);
export const sceneFrames = (id: SceneId) => sec(SCENES[id].length);

// ---------------------------------------------------------------------------
// S1 — Office: tapping and the title
// ---------------------------------------------------------------------------
export const S1 = {
  /** Picture fades up from black. */
  fadeInEnd: 1.4,
  /** TAP. TAP. TAP. — this rhythm is reused on the glass in S6. */
  taps: [0.5, 1.0, 1.5],
  tapsStop: 3.0,
  /** Shot A: extreme close-up on the finger. */
  shotEcu: 0,
  /** Pull-out from the finger to the medium shot. */
  pullOutStart: 3.2,
  pullOutEnd: 6.0,
  /** Shot C: over-the-shoulder on the monitor (blank doc, title, cursor). */
  shotOts: 6.0,
  /** Shot D: close-up of his face lit by the screen. */
  shotFace: 9.0,
  /** Hands move to the keyboard. */
  handsToKeys: 11.0,
  /** Shot E: typing on screen, push toward the text. */
  shotTyping: 12.0,
  typeStart: 12.4,
  typeCps: 14,
  /** Line complete, hold. */
  lineComplete: 16.0,
  /** Monitor glow warms toward candlelight (match to S2). */
  warmStart: 19.0,
  /** Dissolve into the dining room begins. */
  dissolveStart: 22.0,
  cursorBlink: 0.5,
  documentTitle: 'ARGUMENTS AGAINST GOD',
  typedLine: 'My problem with God started at the dinner table.',
} as const;

// ---------------------------------------------------------------------------
// S6 — on-screen text beat (kept here so S1 and S6 share the document styling)
// ---------------------------------------------------------------------------
export const S6_TEXT = {
  lastLine: "There's nothing but us out there.",
} as const;
