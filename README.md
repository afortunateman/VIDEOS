# Arguments Against God

A 2D animated short (410 s, 1920×1080, 30 fps) built entirely in code with
[Remotion](https://www.remotion.dev/): React + TypeScript + inline SVG. No stock
footage, no image generators. Story by Varun Kamalahasan.

## Status

| Scene | State |
| --- | --- |
| S1 Office: tapping and the title | **Built** (`S1Office`) |
| C0, S2–S6, EC | Not started |

## Run it

```bash
npm install
npm run studio        # generates the sound effects, then opens Remotion Studio
npm run render:s1     # renders out/s1.mp4 (24 s)
npm run beats:s1      # frame grabs at every S1 beat -> out/s1_beats.png
```

Every scene is its own composition, so it renders alone
(`npx remotion render S1Office out/s1.mp4`). `TestSheet` shows the shared face in
every expression, the hand poses and the snow globe.

Sound effects and music beds are synthesised by `scripts/make-sfx.mjs` (no
downloads); they are written to `public/audio/` and git-ignored, so run
`npm run sfx` after cloning (the `studio` and `render:s1` scripts do it for you).

## Where things live

```
src/timeline/timeline.ts   all scene starts + S1 beat times (single source of truth)
src/timeline/dialogue.ts   every line of dialogue, scene-relative seconds
src/scenes/S1Office.tsx    S1, built from shots in src/scenes/s1/
src/camera/Camera.tsx      keyframed camera with depth layers (parallax) and handheld drift
src/characters/            VarunFace (shared by both Varuns), VarunGod, Hands, TypingHands
src/props/                 Office set, LaptopScreen (HTML document), SnowGlobe
src/art/LightPass.tsx      re-lights cut-out characters with a coloured, soft-falloff pass
src/fx/                    Letterbox (2.39:1), Grain, Vignette, Fade, Subtitles, DustMotes
scripts/make-sfx.mjs       tap, key clicks, room tone, wind, drone, warm swell
```

## S1 notes

- One continuous move from the extreme close-up on the tapping finger out to the
  medium shot, with a rack focus as the room resolves. The pull starts gently
  at 3.2 s (in the held silence) so it can be slow and still land before the
  6.0 s cut.
- The snow globe appears only in that medium shot: small, dim and out of focus.
  No picture frame is visible anywhere in S1 (it is saved for S6).
- The typed line, the on-screen cursor and the key-click sounds all come from the
  same schedule (`src/scenes/s1/typing.ts`), with a small hesitation before "God".
- From 19 s the screen's light warms; by 22 s it is golden haze with candle-like
  flicker and bokeh, ready for the match dissolve into the dining room. The wind
  from the dining room pre-laps under the last 2.5 s.
- The TAP. TAP. TAP. rhythm (0.5 s apart) is in `S1.taps` so S6 can reuse it on
  the glass.
