# The Staircase

An animated short drawn entirely in JavaScript on a `<canvas>`. It uses no images, no libraries and no text on screen. Narration, dialogue and sound are meant to be added separately.

| Act | Page | Length |
| --- | --- | --- |
| 1: The Promise | `index.html` | 0:45 |
| 2: The Machine | `act2.html` | 1:17 |
| 3: The Revelation | `act3.html` | 0:45 |
| 4: Nothing | `act4.html` | 1:09 |

Open a page in a browser. It plays on load.

Files:

- `engine.js`: everything the acts share. That covers the caterpillar (head, hat, suitcase and body, drawn by the same code in every scene), stairs, cameras, textures, the film-stock layer and the player.
- `act1.js` to `act4.js`: the scenes of each act.
- `render.js`: exports stills or an MP4.

| Key | Action |
| --- | --- |
| Space / K / click | Play or pause |
| ← / → | Seek 2 seconds |
| 1–6 | Jump to a scene |
| F | Full screen |

## Act 1, The Promise: scenes and timings

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

## Act 2, The Machine: scenes and timings

| # | Scene | In | Out | Narration / dialogue |
| --- | --- | --- | --- | --- |
| 06 | Thousands of Steps | 0:00 | 0:12 | "He climbed past thousands of steps." |
| 07 | The Abandoned | 0:12 | 0:25 | "Past caterpillars who had given up. Past the skeletons of those who had died halfway." |
| 08 | The Messages | 0:25 | 0:36 | "Some had left messages carved into the walls." |
| 09 | The Descending Caterpillars | 0:36 | 0:53 | Dialogue, see below |
| 10 | Years | 0:53 | 1:05 | "Years passed. His body grew tired. His legs weakened." |
| 11 | The Fear | 1:05 | 1:17 | "But he kept climbing because the thought of remaining a caterpillar terrified him more than the staircase." |

- **06**: Side profile. The camera tracks at exactly his average pace. His suitcase bobs with each stride. Identical copies of the staircase repeat into the fog behind him. Every third step repeats the same concrete marks. The light goes from day to dusk, to a moonlit night (about 0:03–0:08), to dawn, and back to day.
- **07**: He passes caterpillars sitting motionless against the wall. Then come skeletons on the steps: one still holds a small flag, and another lies beside an empty, open suitcase. He stops to look at them (0:19.2–0:22.9), straightens his hat (about 0:21.5–0:22.8) and carries on.
- **08**: A macro tracking shot along a carved wall, lit from the side. He crosses the frame from about 0:26 to 0:35, dragging his suitcase on a strap. The carvings start as tally marks, arrows and little stairs. They become caterpillar pictograms, eyes and butterflies, and by the end they are dense rows of spirals and rings. Suggested windows for the post-production text:
  - "KEEP GOING.": 0:26–0:29
  - "THE TOP IS WORTH IT.": 0:29.5–0:32
  - "YOU'RE ALMOST THERE.": 0:32.5–0:35
- **09**: A frontal, symmetrical shot of a stair corridor between two pilastered walls. He climbs the left lane, seen from behind, and stops at 0:39.1, setting his suitcase down beside him. The procession comes down the right lane and pauses while the one with the gold medal talks. The certificate carrier is right behind. The medal one's mouth moves on its lines, and the hero's lines play while we see him from behind:

  | Line | In | Out |
  | --- | --- | --- |
  | PROTAGONIST: "What's at the top?" | 0:40.4 | 0:41.7 |
  | DESCENDING: "Glory." | 0:42.5 | 0:43.1 |
  | PROTAGONIST: "Have you seen it?" | 0:44.6 | 0:45.7 |
  | DESCENDING: "No." | 0:46.6 | 0:47.0 |
  | DESCENDING: "But I've heard." | 0:47.45 | 0:48.35 |

  The procession moves off again at 0:48.8. The medal one walks past him toward the camera, and he turns to watch it go.
- **10**: A locked-off time-lapse. Days flicker past. Dust and cobwebs build up. Snow falls (about 0:56–0:59), lies on the steps and on his hat, then melts. Plants push up through the concrete (0:59.6–1:02.4) and wither (1:02.6–1:04.2). His hat fades and gathers dust, his suitcase picks up scratches, his eyelids grow heavier and his crawl slows.
- **11**: An extreme close-up. His eyelids lift as a butterfly appears in his eyes (1:06.4–1:08.4). The reflection wobbles and fades (1:09.4–1:12), and his own tired reflection replaces it (from 1:11.8). He looks up (1:13.8–1:15.6), and the brim of his hat darkens his eyes.

## Act 3, The Revelation: scenes and timings

| # | Scene | In | Out | Narration / voice |
| --- | --- | --- | --- | --- |
| 12 | The Scream | 0:00 | 0:11 | "One day, he couldn't take it anymore. He stopped climbing and screamed." |
| 13 | The Voice | 0:11 | 0:22 | VOICE FROM ABOVE: "You're almost there. Don't give up now. You've come so far!" |
| 14 | Everyone Hears It | 0:22 | 0:36 | "For the first time, he noticed that every caterpillar was hearing the same voice." |
| 15 | Almost There | 0:36 | 0:45 | "And every single one of them was almost there." |

- **12**: He stops dead at 0:02.0 and his legs tremble. He collapses onto the step (0:03.3–0:03.9). His suitcase tips over and lands flat on its face (0:03.4–0:04.1), and his hat slips back. He lifts his head and screams from 0:04.9. The camera rushes at his face (0:05.0–0:07.3) while the background warps and smears. At 0:08.8 everything stops on one frame and the colour drains out for the silence. Only the film grain keeps moving.
- **13**: Opens on him sitting on the bottom step beside his fallen suitcase. He lifts his head (0:11.6–0:13.6), and the camera tilts up the staircase (0:12.3–0:18.4) to a golden-white light that gently breathes from about 0:14. Suggested window for the voice: 0:15–0:20.5.
- **14**: Seen from above, where the voice is, looking down the staircase. The camera pulls back from him, past hundreds of caterpillars climbing toward us. Some wear hats (grey, black or straw, never his brown one), some carry grey or green suitcases, and some lie flat, too tired to move. Their faces are hopeful, exhausted or set. They stop one by one (0:23.3–0:27.9), then all look up at exactly the same moment, 0:28.6. More staircases fill in around them (from about 0:25.5) until thousands of tiny figures are looking up.
- **15**: Straight down on a loop of four flights that always climbs. Inside it sits a smaller loop turned 45°, and another inside that. The climbers go round and round, each group with a warm light floating just ahead. Over the 9 seconds the camera turns 45° and moves in by √2. That lands exactly on the next loop in, so the shot could run forever.

## Act 4, Nothing: scenes and timings

| # | Scene | In | Out | Narration |
| --- | --- | --- | --- | --- |
| 16 | Sitting Down | 0:00 | 0:11 | "He sat down. He had a crazy idea. What if he said screw it and just gave up?" |
| 17 | Nothing Happens | 0:11 | 0:26 | "So for the first time in his life, he stopped climbing." / "And something happened." / "Actually, nothing happened." |
| 18 | Still a Caterpillar | 0:26 | 0:38 | "He was still a caterpillar. The staircase was still going on forever. There was no revelation, no enlightenment, no wings." |
| 19 | The Flower | 0:38 | 0:51 | "But for the first time in his life, he wasn't miserable." |
| 20 | The Final Question | 0:51 | 1:09 | "He looked at the staircase and wondered: What if the top was invented by caterpillars who couldn't bear the thought that climbing was all there was?" |

This act uses static or near-static cameras, ordinary warm daylight and no effects beyond the film stock. Once he sits down, his stop-motion jitter is frozen: when he's still, he's completely still, while everyone around him keeps moving.

- **16**: A very wide, static side view. He lowers himself onto a step (0:00.5–0:03.8), sets his suitcase down beside him (0:03.9–0:05.8), and stops moving from 0:06.0. Other caterpillars crawl past in front and behind. Three glance at him as they pass, and nobody stops.
- **17**: A locked medium shot held for 15 seconds. The suitcase sits beside him, climbers keep going on the stair behind, and the golden light stays far off in the top right corner. He doesn't move except for one slow blink at 0:21.9. Suggested windows for the three lines:
  - "So for the first time...": 0:12–0:15.5
  - "And something happened.": 0:18–0:19.5
  - "Actually, nothing happened.": 0:22.5–0:24.5
- **18**: Close shots with a short dip to black between each:
  - His legs, flexing slowly (0:26–0:29.2).
  - Him looking back along his body (0:29.2–0:32.4).
  - Him looking up at the staircase, hat slightly crooked (0:32.4–0:34.6).
  - A slow move toward a crack in the step beside him, where a small wildflower grows (0:34.6–0:38).
- **19**: An extreme close-up of the flower in low afternoon sun from the right, swaying in the wind and casting a soft shadow across the step. His suitcase sits at the left of frame. He slowly leans in (0:39.5–0:47.5), his face softens toward a small smile from about 0:43, and he blinks once at 0:45.6.
- **20**: This mirrors Act 1's opening shot. The camera starts close on him, sitting on one step of the stair beside the flower and his suitcase, and slowly pulls back and up for the whole 18 seconds. Other caterpillars keep climbing around him. He shrinks to a speck, and the staircase becomes a pale band in warm haze. A slow fade to black runs from 1:02.5 to the end.

## The character

The protagonist is drawn by the same functions in every scene of both acts: `drawHead`, `drawHat`, `drawSuitcase` and `drawSegment` in `engine.js`. His colours live in one constant, `HERO`. In Acts 2 to 4 a single `WEAR` value (0 to 1) dusts and fades his hat and scratches his suitcase as the years pass. Their shapes never change. His hat and suitcase are never removed. When the framing is too tight to show the whole suitcase (the end of the push-in), its handle and his leg holding it stay in shot at the lower left.

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
node render.js video act1.mp4 24
```

```bash
PAGE=act2.html node render.js video act2.mp4 24
```

```bash
PAGE=act3.html node render.js video act3.mp4 24
```

```bash
PAGE=act4.html node render.js video act4.mp4 24
```

Set `CRF` to trade size for quality. The default is 23, and lower means better. Heavy grain makes files large.

```bash
CRF=18 node render.js video the-staircase-hq.mp4 24
```

Stills at chosen times:

```bash
PAGE=act2.html node render.js stills ./stills 3 17 30 44
```
