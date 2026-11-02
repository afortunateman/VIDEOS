# The Staircase: Act 1, The Promise

A 45-second animated short drawn entirely in JavaScript on a `<canvas>`. It uses no images, no libraries and no text on screen. Narration and sound are meant to be added separately.

Open `index.html` in a browser. It plays on load.

| Key | Action |
| --- | --- |
| Space / K / click | Play or pause |
| ← / → | Seek 2 seconds |
| 1–4 | Jump to a scene |
| F | Full screen |

## Scenes and timings (for laying in narration)

| # | Scene | In | Out | Narration |
| --- | --- | --- | --- | --- |
| 01 | The Endless Staircase | 0:00 | 0:12 | "There was once a caterpillar who was climbing a staircase." |
| 02 | The Mystery | 0:12 | 0:22 | "Nobody knew who had built it. Nobody knew what was at the top." |
| 03 | The Elders | 0:22 | 0:35 | "But the older caterpillars told stories." |
| 04 | The Butterfly | 0:35 | 0:45 | "'Climb high enough,' they said, 'and you'll become a butterfly.'" |

Each scene dips briefly to black at the cut. The film opens on a 1.8-second fade-in and ends on a 1.4-second fade-out.

- **01**: The caterpillar starts at the foot of a concrete staircase that rises out of a sea of fog. The camera dollies back about thirty times its starting distance. That reveals the stair's width and flank, the monoliths behind it, and a huge clock with no numbers whose single hand ticks once a second (for the ticking sound cue).
- **02**: A tracking shot along a staircase floating in empty space. Other stairs drift in the fog, some upside down, with tiny travellers on them. Around 0:17–0:19 an out-of-focus pier wipes past the lens.
- **03**: An elder on a raised stone speaks by lamplight. His shadow on the wall grows wings between about 0:25 and 0:31. The crowd lifts their heads from about 0:27. The protagonist, with his hat and suitcase, watches from the right.
- **04**: A stained-glass butterfly lights up from its body outward (0:35–0:38). After a hold, a slow push-in starts at 0:39 and ends on his face, with the butterfly reflected in his eyes.

## The character

The protagonist is drawn by the same functions in every scene: `drawHead`, `drawHat`, `drawSuitcase` and `drawSegment` in `film.js`. His colours live in one constant, `HERO`. His hat and suitcase are never removed. When the framing is too tight to show the whole suitcase (the end of the push-in), its handle and his leg holding it stay in shot at the lower left.

## Look

- Character poses update at 12 fps ("on twos"), and every frame has a little positional jitter (boil). The camera moves smoothly at the display rate.
- The surfaces use a procedural concrete texture, and the characters use a clay texture with thumbprints in it.
- The film-stock layer adds 16 mm-style grain, gate weave, exposure flicker, dust, the odd hair or scratch, and a vignette.
- Scene 04 gets its depth of field by rendering the background at a falling resolution as the camera pushes in.
- If a machine can't keep up, the player lowers its internal resolution automatically, but never below half.

## Rendering a video file

`render.js` drives headless Chromium through Playwright and pipes frames to `ffmpeg`.

```bash
npm i playwright   # once, if Playwright isn't already available
node render.js video the-staircase.mp4 24
```

Set `CRF` to trade size for quality. The default is 23, and lower means better. Heavy grain makes files large.

```bash
CRF=18 node render.js video the-staircase-hq.mp4 24
```

Stills at chosen times:

```bash
node render.js stills ./stills 3 17 30 44
```
