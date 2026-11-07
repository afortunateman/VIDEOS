# Hooks, title cards, credits and footage edits

## Cold-open hook (3–12 s)
- 6–8 of the film's strongest *emotional* frames (faces: awe, fear, scream, hope, resolve),
  7–13 frames each, accelerating, on the music's swell; a white flash into the one big image
  (the endless staircase) on the score's hit; hold it.
- Don't cut to black before the title: hold the big image's final framing still (render a
  held frame as the title's backdrop) and bring the title in over it. Keep the camera still
  there: continuing to pan read as "two different shots".
- Audio: the hook's own music runs on and tapers under the title; boom on the hit.
- Assemble with ffmpeg `trim/concat` from the master (pattern: `staircase/scripts/make_hook.sh`).

## Title card (motion graphics, Remotion)
- A symbol first (here a spiral drawn with an SVG dash reveal), then a motion-graphics morph
  into the logotype: a short "dive" into the symbol, then title pieces bloom in (blur → sharp,
  slight scale-down, staggered 0.3 s), a light sweep across the letters, drifting motes, a
  gentle background zoom and vignette that ease in **from zero** (no pop on the first frame).
- One impact SFX exactly when the symbol becomes the text; sparkle shimmer; small flutter
  SFX on each wing flap.
- Lettering style used: chunky rounded font (Fredoka 700), warm fill, thick dark outline via
  `-webkit-text-stroke` with `paint-order: stroke fill`, drop shadow + warm glow.
- Load fonts with `delayRender` / `FontFace` before rendering.

## Credits
- White type on black over a quiet animated pattern of the film's symbol (low opacity,
  slow rotation and drift, masked away from the centre so text stays clean).
- One idea per card, centred, fading in with a whisper of blur, staggered lines; e.g.
  "Created by / Name" then "Special thanks / ...". ~4 s per card, pattern fades in/out.

## Talking-head / monologue edit
- Quote card over the empty-wall opening, in the title's lettering; lines bloom in one by
  one with a soft text SFX each, author line last, then soften away.
- **Person in front of text**: make a matte with MediaPipe selfie segmentation
  (`scripts/matte.py`), threshold and blur the mask, smooth it over time (0.65 new + 0.35 prev),
  and composite the person over the text. Mask out regions that must stay on top (countdown).
  Clean-plate differencing failed because the phone camera's auto-exposure changed the plate.
- Retention elements: a progress spiral that winds in over the duration, with a glowing tip;
  a countdown ("MOVIE STARTS IN T–50") that pops slightly on each new number, fixed to the
  exact seconds the user asked for.
- Scale all overlays by `min(width,height)/1080` so the same composition works in 16:9 and 9:16.
- Deliver a near-lossless master (.mov ProRes or CRF ≤ 12) when asked for "full quality".

## Getting big files from the user
Uploads over ~60 MB may fail in chat. Ask for a Google Drive link (use the Drive connector to
download) or a split upload.
