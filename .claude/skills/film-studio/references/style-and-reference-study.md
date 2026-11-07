# Style and reference study

## Contents
1. What the two studied reference videos taught
2. How to study any reference
3. Style bible template
4. Starting recipes for different art styles
5. Tutorial workflow for viral explainer shorts

---

## 1. What the reference videos taught

### "How to Make Viral Animated Shorts Using Claude (Full Workflow)"
- The method: **study a reference by measuring it, write a style bible, build a deterministic
  render pipeline, then close the gap with numbers instead of opinions.**
- Pull ~20 videos of the reference channel into frame grids, transcripts with word timings and
  audio stats. The key prompt: *"Don't tell me what you think. Measure it: cuts, camera moves,
  colours. Give me numbers."*
- Close the gap: render a test, place it **side by side** with reference frames, write a gap
  table (Cue | Reference | Ours | Fix), fan out parallel agents per department (lighting &
  textures, characters, camera & composition, colour, sound), merge the best, judge against the
  numbers. Many gaps are fixed by one final colour grade.
- Measured cues that mattered: background DOF in ~1/3 of shots; a near-foreground blur object
  in ~1/4 of frames; aerial perspective (distance fades to the sky colour); horizon brighter
  than the upper sky; glow only on light sources; camera height ~0.8× character height;
  camera almost never fully still (~65% of frames move); no pure black (lifted, coloured
  darks); corners darker than centre.
- First results never look like the reference. Quality came from many loops.

### "Flipaclip" cel-cartoon reference (175 s, 720p, 24 fps)
- Bold near-black ink outlines (~3 px at 720p) on silhouettes and major folds; sparse
  interior lines.
- Flat fills + one hard shadow tone (2-tone cel). Night scenes add a coloured rim light instead
  of more shading.
- Very saturated primaries (saturation mean 0.40, luma std 0.31 = high contrast).
- Big readable faces: white oval eyes, large pupils, thick brows doing most of the acting,
  simple D mouths; squash & stretch on reactions.
- Animated on twos (58% of frames held in action), cuts every 1–3 s, wides mixed with extreme
  close-ups, dynamic angles (low hero, dutch, top-down), speed lines/smears, impact frames.
- Backgrounds simple with strong perspective; depth from blur, not detail.

### Translating a 2D style into 3D (what worked)
| 2D trait | 3D way |
|---|---|
| Ink outlines | Post pass: edges from depth + normal buffers, ~3 px at 1080 wide, fading with distance and blur |
| 2-tone cel | `MeshToonMaterial` with a 3-step hard gradient map; coloured (purple) ambient for shadows |
| Drawn faces | Faces painted on a canvas and mapped onto the head, so expressions are drawn, not modelled; swap textures per expression key |
| Painted backgrounds | Seeded canvas textures: brush daubs, wobbly ink seams, painted cloud cards |
| Saturated palette | Grade: saturation ~1.2, warm lifted blacks, gentle S-curve, vignette, light grain |
| Depth | DOF + aerial fog toward the horizon colour |

## 2. How to study any reference
1. `scripts/contact_sheets.sh ref.mp4 sheets/ 2` → look at every sheet.
2. `python scripts/measure.py ref.mp4 --json ref.json` (edit `W,H` at the top for 16:9).
3. Look at full-res stills of: a close-up face, a wide, a night shot, an action frame.
4. Listen: voice pace (words/s), music level under voice, SFX types, loudness (`ffmpeg -af
   ebur128`).
5. Write the style bible. Then make **one test frame** and compare side by side.

## 3. Style bible template
```markdown
# Style Bible: <title>
## Format       aspect, resolution, fps, length, safe area for re-crops
## Reference    measured traits (line, shading, colour stats, faces, timing, camera, backgrounds)
## Translation  table: reference trait -> how we do it in our medium
## Characters   each: palette hexes, silhouette, signature prop, expression range
## Rules        no captions unless asked; every line illustrated; deterministic frames; ...
## Sound        voice loudness, music bed level, SFX palette
```

## 4. Starting recipes for different styles
Use as a first test frame, then measure against the user's reference.

| Style | Engine | Look recipe |
|---|---|---|
| Cel cartoon (2D) | Remotion + SVG/canvas | 3–4 px dark outline, flat fill + 1 hard shadow tone, big eyes/brows, animate on twos, impact frames |
| Painted 3D (this film) | Remotion + Three.js | Toon ramp, ink edge post pass, procedural painted textures, DOF, aerial fog, saturated grade, grain |
| Flat vector / motion graphics | Remotion | Geometric shapes, 2–4 colour palette, no outlines or uniform ones, spring/eased moves, kinetic type |
| Anime | Remotion + Three.js or 2D | Thin lines, 2-tone with crisp shadow shapes, rim light, painted skies, speed lines, held frames + camera pans over stills |
| Paper cut-out / collage | Remotion 2D | Paper textures, drop shadows with offset, slight per-frame jitter (on threes), stop-motion timing |
| Claymation look | Three.js / Blender | Soft rounded shapes, subsurface-ish warm light, fingerprint bump texture, stepped animation |
| Pixel art | Remotion canvas, nearest-neighbour scaling | Low internal resolution (e.g. 320×180) scaled ×6, limited palette, no anti-aliasing, stepped motion |
| Realistic 3D | Blender (Python) | PBR materials, HDRI light, motion blur, real camera lenses (35/50/85 mm) |
| Live-action edit | Remotion + ffmpeg | Grade, typography overlays, mattes (MediaPipe), progress elements, J/L cuts |

## 5. Viral explainer shorts (from the tutorial)
- Vertical 1080×1920, 30 fps, ~60 s, ~3.5–4 words/s (≈200–240 words), sentences ~13–14 words.
- Beat structure: **hook** (a paradox stated as fact, no setup, 10–16 words) → **setting** (1–2
  concrete present-tense lines) → **escalation** (3–6 beats, mockery/doubt, 1–2 exaggeration
  jokes) → **mystery beat** ("Wait...?") → **pivot** ("You see," + everyday comparison) →
  **ironic payoff** (1–2 short sentences, then end).
- Facts true and researched; story, characters and voice always original.
- Mix: voice untouched, music bed slightly up, SFX ≈ −6 dB, −14 LUFS; export 1440×2560.
