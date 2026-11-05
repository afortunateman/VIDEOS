# The Climb: original score (v2, ethereal)

An original score (161.5 s) for the film, timed to the narrator's actual phrasing. It has no drums, pulses or hits. It's built from slow strings, voices, celesta, harp, piano, glassy shimmer and a large, soft hall reverb. One theme runs through the whole piece.

| File | What it is |
|---|---|
| `the_climb_scored.mp4` | The video with the score under the original voiceover |
| `the_climb_score.flac` | Music only, full level |
| `the_climb_score_film_stem.m4a` | Music only, exactly as mixed (ducked under the VO), ready for an editor |
| `midi/*.mid` | One MIDI file per instrument, timed in absolute seconds to the picture |
| `compose.py` | The score; re-renders everything |

## The theme

**The Climb motif:** four rising steps, A–D–E–F. Its shape follows the story:

- **A–D–E… (stops):** a question. It plays at "what was at the top", "What's at the top?", "There were no wings", and the last notes of the film.
- **A–D–E–F♯ (major):** the promise. It first completes when the voice from above calls, then echoes from every caterpillar at once.
- **F–E–D–A (falling):** the scream.
- **Summit:** the melody climbs to F♯6 and lands exactly on "And that was enough."

The home key is D. The film ends on an open Dsus2 chord: the question isn't answered.

## Voiceover timing → music

| Time (s) | Line | Music |
|---|---|---|
| 0.1 | "There was once a caterpillar who was climbing a staircase." | Strings fade in. The motif on piano |
| 4.2 / 6.4 | "Nobody knew who had built it. / …what was at the top." | Bbmaj7, then celesta asks A–D–E… |
| 8.7 | "But the older caterpillars told stories." | Warm F chord, harp |
| 11.4 | "Climb high enough," they said, | Harp rises |
| 14.1 | "and you'll become a butterfly." | The wonder chord (Bbmaj7♯11), glass bells, voices |
| 15.9–22.4 | *(no VO: his fascinated face)* | Celesta and flute sing the theme; strings bloom |
| 22.4 | "So he climbed." | The motif on piano; harp starts moving |
| 23.8–31.4 | "…thousands of steps. Past caterpillars who had given up. Past the skeletons…" | Bb, then Gm, with a cold tremolo shiver at the skeletons |
| 32.0 | "Some had left messages carved into the walls." | Ebmaj7, ghostly voices rising |
| 35.1 / 36.3 / 37.8 | "Keep going. / The top is worth it. / You're almost there." | A glass bell on each message |
| 39.0 | *(skeleton)* | Cold, slowly beating cluster; no resolution |
| 40.8 | "One day, he came across a caterpillar descending the staircase." | Harp descends |
| 44.7 | "What's at the top?" he asked. | Celesta: A–D–E… |
| 46.8 | "Glory," the caterpillar replied. | A golden D major chord, bells and voices, which fades |
| 49.3 / 50.5 / 51.4 | "Have you seen it?" / "No." / "But I've heard." | The glow drains to a bare fifth |
| 52.6–55 | *(VO gap: his face)* | Soft horn: the motif |
| 55.0–62.3 | "Years passed. His body grew tired. His legs weakened." | Slow descent through Dm, C and Bb; falling piano notes |
| 62.3–64.4 | *(sigh)* | Solo cello tries the motif and can't reach the top |
| 64.4 | "But he kept climbing because the thought… terrified him more than the staircase." | Gm, then a tense A7♭9 tremolo |
| 69.2 / 71.5 | "One day, he couldn't take it anymore. He stopped climbing and screamed…" | Violin lament (the motif falling), swelling to the scream |
| 75.1 | "Then, from somewhere above, a voice called out." | Hush; glass bells from above |
| 78.2–82.2 | "You're almost there. Don't give up now. You've come so far!" | Choir and organ: Bb, F, G, D. The motif completes in major |
| 82.7 | "But something was different this time." | Same chord with no third: uncertain |
| 85.1 | "…every caterpillar was hearing the same voice." | The motif echoes from seven instruments at once |
| 89.9 | "And every single one of them was almost there." | The echo turns minor (F♮) |
| 94.0 | "He looked up at the endless staircase." | A faint, endlessly rising tone |
| 96.6 / 99.0 | "Then he looked at his little suitcase. And finally, he sat down." | Tender piano, then a harp chord as he sits |
| 101.2–107 | "For a while, he waited… But nothing did." | Near stillness: drone, shimmer, a few piano drops |
| 107.3 | "The staircase carried on as it always had…" | A distant harp, still moving |
| 114.8 | "There was no revelation or enlightenment." | Ebmaj7, halo pad |
| 117.4 | "There were no wings." | Celesta: A–D–E… never finishes (chalk wings on screen) |
| 119.4 | "And certainly, there was no glory." | Open fifth |
| 120.9 | "But for the first time in his life, he wasn't miserable." | First real warmth: G(add9), then A |
| 126.0 | "For the first time, he was just there." | **The sun:** D major; the theme begins |
| 128.4–134.7 | *(VO gap: the sun)* | Strings, choir, horn, flute, harp. The melody climbs A5, B5, D6, E6 |
| 134.7 | "And that was enough." | Lands on D major with the summit note F♯6 |
| 136.1 / 138.5 | "He looked up at the staircase once more. And for the first time, he wondered…" | Bm7, single celesta note |
| 140.9–147.6 | "What if the top was invented by caterpillars who couldn't bear the thought that climbing was all there was?" | Gmaj9, Em9, then the wonder chord returns |
| 147.6–161.5 | *(end)* | Piano: A–D–E… and stops. Cadd9, then Dsus2, fading out unresolved |

## Mix

- While the narrator speaks, the music stays about 13 dB under the voice, with a small dip in the speech frequencies. In the pauses it rises back to full level, with a 120 ms look-ahead.
- Fader rides lift the wordless moments: the wonder, the horn, the sun and the ending.
- The instruments are the FluidR3 General MIDI soundfont plus synthesized pads, shimmer and bells. For release quality, load `midi/` into a DAW with orchestral libraries.

Re-render: `python3 score/compose.py path/to/video.mp4`. This needs `fluidsynth`, `fluid-soundfont-gm`, `ffmpeg`, and the Python packages `numpy scipy soundfile pretty_midi`.
