---
name: film-studio
description: End-to-end studio workflow for making short films and videos with Claude in ANY art style (cel cartoon, painted 3D, flat motion graphics, anime, paper cut-out, realistic 3D, live action edits), from a voice-over or idea through reference study, style bible, shot list, rendering, sound and music, hooks, title cards, credits, edits of real footage, and spin-offs like a printed picture book. Use this whenever the user wants to make, plan, animate, fix, extend, re-cut, score, mix, title or package a video or animated film, asks to "match this style", "learn from this video", add a shot or insert clip, fix lighting/shadows/faces/camera/music in a render, make a cold-open hook or trailer cut, make credits, edit a talking-head video, or turn a film into a book, even if they don't say "film".
---

# Film Studio

A reusable way of working, learned while making the 2½-minute animated film *The
Caterpillar and the Infinity Staircase* (Remotion + Three.js), its hook and title card,
a monologue edit, credits, a screenplay and a 42-page KDP picture book, plus two studied
reference videos. Most of it is about **craft and process**, so it carries to any art style.
The tools changed per job; the rules below did not.

Read the reference files when the job touches their area:

| When you are... | Read |
|---|---|
| Studying a reference video, writing a style bible, choosing a look/engine for a new style | `references/style-and-reference-study.md` |
| Planning shots, cameras, cuts, continuity, inserts/extensions | `references/camera-and-continuity.md` |
| Lighting, shadows, time of day, grading | `references/lighting-and-shadows.md` |
| Characters, faces, expressions, motion, contact/physics, geometry | `references/characters-motion-geometry.md` |
| Music, sound effects, voice, mixing, crossfades | `references/music-and-sound.md` |
| Hooks/cold opens, title cards, credits, quote cards, talking-head edits | `references/hooks-titles-edits.md` |
| Long renders, chunking, parallel workers, disk, sending big files | `references/rendering-pipeline.md` |
| Picture books / print (KDP), ebooks, screenplays, Google Docs | `references/print-and-docs.md` |
| How this user likes to work (read at the start of every project) | `references/working-with-the-user.md` |

Scripts in `scripts/`: `measure.py` (cuts, motion, colour stats of a video),
`contact_sheets.sh` (timestamped frame grids), `audio_analyze.py` (tempo, onsets, key per
section, loudness, for music edits), `place_text.py` (finds the calmest region of an image for
text), `matte.py` (person cut-out from footage with MediaPipe).

---

## The workflow

### 1. Study before you build: measure, don't describe
For a style reference, pull frames (`contact_sheets.sh`), measure it (`measure.py`), and listen to
it. Write down numbers: shot length, % of frames with camera motion, luma mean/std, saturation,
outline thickness, how many tones of shading, how faces act, cut rhythm, loudness. Opinions like
"it looks vibrant" can't be checked; "saturation 0.40, luma std 0.31, cuts every 1–3 s" can.
Then write a short **STYLE_BIBLE.md**: format, the reference's traits, and a table of
*reference trait → how we do it in our medium*. The user often wants a *translation* of a style
("this look, but in hand-painted 3D"), not a copy. Never copy a reference's characters,
scripts or shots; study only.

### 2. Lock the format early
Ask or infer: aspect (16:9 1080p for YouTube; it can be re-cut to 9:16 later, so keep subjects
inside a centre safe area if shorts are planned), fps (30), length (from the voice-over).
Changing format late costs a full re-render.

### 3. Approve a test frame first
Before building anything long, make **one** beautiful still in the target style and get a yes.
It is cheap to change a still and very expensive to change a film.

### 4. Script → shot list timed to the voice-over
- Split the voice-over on its pauses (`ffmpeg -af silencedetect=noise=-38dB:d=0.28`); each phrase
  is a line of the shot list: time, words, picture, camera, light, emotion.
- **Show, don't tell**: every line is illustrated literally, and the picture should tell the
  story even with the sound off.
- Give the film a **visual grammar** (e.g. camera moves while the hero strives, locks off when he
  stops; light warms with hope). Consistency of grammar is what reads as "cinematic".
- Plan **breathing room**: where emotion needs to land, hold the picture past the line so
  music can carry it (the user asked for this repeatedly). It's fine to open gaps in the
  voice-over for those beats.
- Write the screenplay (Fountain) from the shot list; it doubles as a deliverable.

### 5. Build a deterministic pipeline
Whatever the engine (Remotion + Three.js, Remotion 2D/SVG, Blender, After-Effects-style
compositing in code), every frame must be a pure function of time: seeded textures/noise, no
`Math.random`, no wall-clock. Then you can re-render any single frame or shot and get the same
pixels, which makes patching possible. One file per act, each shot a small object:
`{start, end, cam(t), look(t), actors(t), light(t)}`.

### 6. Automated checks before eyes
Write tiny scripts that sample every shot at 30 fps and flag: camera inside geometry or a
blocked line to the subject; body parts or props sinking into surfaces; one-frame pops in any
position, rotation or expression (velocity much bigger than its neighbours); faces out of frame.
These caught dozens of problems a human only sees after a 6-hour render.

### 7. Review in batches, render in chunks
Render half-res stills at the middle of each shot, tile them in order, critique as a
cinematographer (faces visible? light motivated? shadows clean? continuity across the cut?),
fix, repeat. Expect 3–4 rounds. Only then render the full film, in chunks
(`references/rendering-pipeline.md`).

### 8. Fix only what was asked
When the user gives notes, change exactly those shots, re-render only those frame ranges,
and splice them into the existing master. Never re-render or "improve" untouched parts
("don't change anything unnecessary", "leave everything else untouched"). Verify the splice
(frame counts, no duplicated or dropped frames at the joins).

### 9. Sound last, but seamless
Voice untouched and loud enough (−14 LUFS integrated, −1 dBTP), music under it, SFX on visual
events. Every transition in audio must be inaudible: see `references/music-and-sound.md`.
The ear notices a music seam far faster than the eye notices a cut.

### 10. Deliver two files
A **master** (near-lossless: CRF 12–14 H.264 or ProRes/.mov) for editing, and a **share copy**
(CRF ~20–22, AAC 320k, `+faststart`) small enough to send. Explain the difference simply.

---

## The 12 lessons that cost the most revisions

1. **Faces are the film.** Never let a flame, prop, shadow, the character's own body, text or a
   frame edge cover the face during an emotional line. Check every frame of the beat, not one.
2. **One shot = one camera idea.** A move that settles and then starts again, or rises then
   falls, reads as "two different shots". Use a single eased move from start framing to end
   framing; if you need a change of direction, cut.
3. **Continuity across cuts and inserts.** A new insert/extension must match the neighbouring
   shot's light colour, sun direction, shadow softness, time of day, character state and screen
   direction. Build it from the same scene description, not a fresh one.
4. **Shadows must be smooth and motivated.** Jagged, swimming or wonky shadows look cheap. Soften
   filtering, raise map resolution, stabilise the shadow camera, and fade shadows out when the
   light source goes (sunset → night has no hard shadows).
5. **Nothing sinks, nothing floats.** Bodies, heads, props and text must sit on surfaces;
   compute contact rather than eyeballing.
6. **Geometry that reads as real.** Repeated set pieces must be flush and consistent (stair
   sides that alternated between lines and plain, or stuck out, looked "unreal").
7. **Emotion lives in eyes and brows**, and must match the line: tired = heavy lids, no smile;
   scared = visible eyes; a scream must read as a scream, not a laugh. Avoid half-closed eyes
   in stills unless intended.
8. **Ease everything.** Linear ramps cause visible kinks; use smoothstep / cubic in-out, and
   give a move time to settle before the cut.
9. **3D can look 2D** if the camera is too close and the light too flat. Pull back to show
   depth, add a key/fill contrast, atmospheric perspective and DOF.
10. **Music: never fade in on an instrument's first note, never crossfade between different
    keys.** Find a section in the same key/chord and an onset-free point, then use a long
    equal-power crossfade.
11. **Respect "no".** When the user says "no new music under the title", add none: let the
    existing music taper. Offer one tasteful SFX, not a soundtrack.
12. **Text on pictures**: big, white, dark outline, placed in the calmest part of the image,
    never over faces, never clumped; separate lines that are separate thoughts.

---

## Adapting to a totally different art style

The pipeline and lessons above are style-agnostic. What changes:

- **Look recipe**: write it in the style bible as concrete, checkable rules (line weight in px,
  number of shade tones, palette hexes, texture method, grain, frame rate of animation e.g.
  "on twos"). See the style table in `references/style-and-reference-study.md` for starting
  recipes (cel, painted 3D, flat vector, anime, paper cut-out, claymation-look, pixel art,
  realistic, live action).
- **Engine**: Remotion (React) for anything 2D/vector/motion-graphic and for editing footage;
  Remotion + Three.js for stylised 3D; Blender (Python, Cycles/EEVEE) for realism.
- **What stays**: test frame first, shot list timed to voice, visual grammar, automated
  checks, faces first, one-move shots, continuity, seamless sound, patch-only fixes,
  master + share copy.
