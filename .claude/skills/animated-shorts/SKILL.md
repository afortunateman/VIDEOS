---
name: animated-shorts
description: Make short vertical animated explainer videos (YouTube Shorts / TikTok / Reels) with Claude, from studying a reference style through script, assets, render, measured comparison and final export. Use when the user wants to make, plan, script, animate, critique or improve an animated short, or study a channel's style.
---

# Animated Shorts Workflow

Learned from the tutorial "How to Make Viral Animated Shorts Using Claude (Full Workflow)".
The method is: **study a reference by measuring it, write a style bible, build a
deterministic render pipeline, then close the gap with numbers instead of opinions.**

## Ground rules (from the tutorial)

- A reference channel is **private study material only**. Never copy its scripts,
  characters, shots or voice, never upload or share its videos, and never name it
  in narration or descriptions. Story, characters and voice are always our own.
- Jokes and facts are researched and true.
- Check every step against the spec, and save after every step.
- Once the user approves a script, carry it through to the finished video without
  more questions.

## Phase 1: Study the reference (measure, don't describe)

1. Pick about 20 recent videos from the reference. Ask for lighting, contrast,
   shadows, movement, effects, cuts and script structure, studied frame by frame.
2. For each video, extract:
   - **Contact sheets**: frames at 30 fps (or every 2 s for a survey), tiled 4x4,
     with timestamps (`scripts/contact_sheets.sh`).
   - **Transcript with word timestamps** (WhisperX-style `{word, start, end, score}`).
   - **Audio**: waveform, integrated loudness (LUFS), loudness range, words per second.
3. Then measure. The tutorial's key prompt was, in effect: *"Don't tell me what you
   think of this video. Measure it: cuts, camera moves, colours. Give me numbers."*
   `scripts/measure.py` gives the starting set:
   - Cut times and shot lengths (frame-difference spikes)
   - Camera motion in px/frame (phase correlation between frames), and the share of
     frames that move at all
   - Luma mean/std, saturation, black point, corner-vs-centre brightness (vignette)
4. Write everything into `STYLE_BIBLE.md` (template below).

## Phase 2: Style bible template

```markdown
## Format
- Vertical 1080x1920, 30 fps, length range + median
- Voice: narrator type, pace in words/s, when the voice starts
- Loudness: integrated LUFS, LRA, music level under voice
- Captions: style, or OUR RULE (e.g. none unless asked)

## Script formula (how many of the 20 follow it)
## Picture (characters, environments, light, colour stats)
## Camera & editing (shot length, moves, easing, transitions)
## Sound (music bed, SFX types, mix levels)
```

## Phase 3: Script formula

This beat structure was shared by every reference video. Use it as a skeleton and
write new content:

1. **Hook**: a paradox stated as fact in sentence 1, with no setup. Shapes like
   "If you X, you'd Y" or "X is illegal, yet...". About 10–16 words.
2. **Setting** in 1–2 lines: present tense, concrete details (time of day, a named
   person, a place).
3. **Escalation**, 3–6 beats: other characters laugh, doubt or mock, with short
   in-character lines. Include 1–2 exaggeration jokes (claim vs reality).
4. **Mystery beat**: one question, or a "Wait...?" moment.
5. **Pivot**, often "You see,": the real mechanism, usually explained with an everyday
   comparison ("Ever...?", "Think about the last time...", "Picture your body as...").
6. **Ironic payoff** in the last 1–2 sentences: short, lands the twist, then the video ends.

Voice and style:
- Two modes: story mode (third person, a named everyman, present tense) or direct
  "you" mode.
- About 13–14 words per sentence (median), plain spoken English with contractions
  and no jargon.
- About 60 s total at roughly 3.5–4 words/s, so the script is about 200–240 words.

## Phase 4: Picture spec (the cartoon look studied)

- **Characters**: 2D flat cartoon, with simple outlined faces, thin dark outlines and
  flat colours. Make **original** character turnaround sheets (front, 3/4, side) and
  expression sheets before animating.
- **Environments**: 3D, with hand-painted textures, saturated colour and thin ink
  outlines on edges. 2D characters stand as lit billboards inside the 3D scene.
- **Light**: warm key light with blue/purple shadows. Characters take scene light
  and cast ground shadows (they are not unlit stickers). Lighting shifts with
  story beats.
- **Colour targets**: luma mean about 0.43–0.54, luma std about 0.21–0.29,
  saturation about 0.38–0.65 (very saturated).
- **Every sentence is illustrated literally**, and props carry the joke.

## Phase 5: Build the render pipeline

What was visible on screen:
- **Remotion + Three.js** (React), loading `.glb` models with `staticFile(...)`.
- Asset library: low-poly props (trees, rocks, logs), tileable textures (grass,
  sand, brick, water), custom GLSL shaders for water and sky.
- Character sprites with expression swaps and simple limb animation.
- Narration TTS with word timings driving the cut and animation timing.
- A second demo used **Blender** for a realistic 3D "journey" short (a red line
  tracing a path through a body, then a city, then out to Earth).
- The HyperFrames plugin enabled in this repo is another option for the
  render step.

## Phase 6: Close the gap (the key loop)

1. Render a test, then put it **side by side** with reference frames.
2. Give critical feedback in plain words ("lighting looks cheap", "no depth",
   "characters look flat"), then ask for a frame-by-frame analysis.
3. **Fan out parallel agents**, each owning one topic: world lighting and textures,
   characters, composition and camera, colour, and one building a timed soundtrack
   (stomps, splashes, impacts, music bed).
4. Have each agent **rebuild the look in its own copy** of the project, then merge
   the best parts and have a judge agent check the result against the numbers.
5. Write a **gap report** as a table: Cue | Reference | Ours | Fix. Cues the tutorial
   measured:
   - Background depth of field: on in about 1/3 of shots
   - Foreground blur: a near foreground object in about 1/4 of frames
   - Aerial perspective: distant objects fade toward the sky colour
   - Sky gradient: horizon brighter than the upper sky; golden-hour variant
   - Glow: only on light sources (moon, lamp, fire, sun)
   - Camera height: about 0.8x character height, mostly eye level
   - Camera motion: almost never fully still (about 65% of frames move); slow
     drifts plus fast eased moves
   - Blacks: no pure black; darks are coloured and lifted warm
   - Vignette: corners darker than centre (ours had it inverted)
6. Many of the gaps get fixed by a **final colour grade**: tone curve, lifted
   blacks, overall saturation, colour cast and vignette.

## Phase 7: Mix & export

- Mix: voice unchanged, music bed raised slightly (about +3 dB in the tutorial's
  setup), SFX about −6 dB; final loudness about −14 LUFS.
- No captions or labels unless asked. English only. One steady voice tone.
- Final export: 2K vertical **1440x2560** (render at 1080x1920 with `--scale 1.3333`).

## Lessons from production ("The Staircase")

- **Cut on the voice-over's pauses.** `ffmpeg -af silencedetect=noise=-38dB:d=0.28` splits the
  voice-over into phrases that map one-to-one onto script lines, even without a speech model.
- **Write a shot list before code**: one row per line, with time, voice-over and picture. Give the film a
  visual grammar (camera moves while the character strives and locks off when he stops; keep a
  consistent screen direction and 180° line; motifs like the suitcase).
- **Use physics for believability**: contact solving so bodies sit on surfaces, fixed segment
  spacing, gravity-hung props, and lanes wide enough that props never pass through each other.
- **Check cameras automatically**: test every shot at several moments for a camera inside
  geometry or a blocked line to the subject (`staircase/scripts/checkcams.tsx`). Cameras looking back
  from higher up a staircase easily end up inside the steps.
- **Keep repeating set pieces (posts, pillars) off the hero's mark**, or they block half the shots.
- **Review in batches**: render half-resolution stills at mid-shot, tile them in order, critique,
  and fix. Expect three or four rounds.
- **Render budget**: software WebGL runs about 2.2 s per 1080p frame on 4 cores. Render video-only
  chunks and mux the full voice-over at the end.

## Expectations

The creator said first results won't look as polished as theirs: the quality came
from many hours of iterating on this loop. Expect several rounds of
render, measure, compare and fix before a video looks right.
