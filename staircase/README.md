# The Staircase

An animated short (1920x1080, 30 fps, 2:11) made with Remotion + Three.js for the
"caterpillar on the staircase" voice-over (`public/vo.mp3`).

- `SHOTLIST.md`: the shooting script, with every voice-over line mapped to a shot
- `STYLE_BIBLE.md`: the look (cel outlines, painted 3D, colour script)

## Layout

| Path | What |
|---|---|
| `src/engine/stairs.ts` | Stair geometry and contact physics: segments rest on treads and edges like rolling balls, plus crawl wave and easing |
| `src/engine/Actor.tsx` | Caterpillar rig: body solver, rear/sit, painted faces (cached), blink, antennae, gravity-hung suitcase |
| `src/engine/World.tsx` | Instanced endless staircase, plaza and meadow, carved walls, sky (stars, moon), clouds, the glow at the top |
| `src/engine/Props.tsx` | Campfire, embers, dust, butterfly shadow, skeleton, sunbeam, instanced crowd with lantern glows |
| `src/engine/look.ts` | Time-of-day looks for the colour script, blendable |
| `src/engine/director.tsx` | Camera paths (Catmull-Rom + easing), handheld/shake, lighting rig |
| `src/scene/Post.tsx` | Post pass: ink outlines from depth/normal edges, depth of field, bloom, grade, vignette, grain |
| `src/shots/*.tsx` | The 51 shots, each timed to the voice-over |
| `src/Film.tsx` | Composition: voice-over, canvas, shot switching, fades |

## Commands

```bash
npm run studio                                   # preview in Remotion Studio
npx tsx scripts/checkcams.tsx                    # flag cameras inside geometry / blocked views
node scripts/stills.mjs out/review 0.5 12.5 40   # review stills at given seconds
scripts/render_chunk.sh 0 1299 a                 # render a video-only chunk
```

Rendering uses software WebGL (`swangle`) and needs no GPU, at about 2.2 s per 1080p frame.
`concurrency=1` is fastest on a 4-core machine.
