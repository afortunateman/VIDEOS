# The Climb — original score

An original orchestral score (161.5 s) written to the picture and the existing voiceover.
It plays as one continuous track in a single key, built from a single theme.

| File | What it is |
|---|---|
| `the_climb_scored.mp4` | The video with the score mixed under the original voiceover |
| `the_climb_score.flac` | Music only, full level (the "soundtrack" version) |
| `the_climb_score_film_stem.m4a` | Music only, exactly as mixed (ducked under the VO) — drop it in your editor |
| `midi/*.mid` | One MIDI file per instrument, in seconds-accurate sync with the picture |
| `compose.py` | The score itself; re-renders everything |

## The signature

- **The Climb motif:** four rising steps, scale degrees 5‑1‑2‑3 (A–D–E–F in D minor). Every section is built from it.
- **Home key:** D minor, using the loop Dm–Bb–F–C.
- **The lift:** Bb → C → D major, held back until the sun.

## Cue sheet

| Time | Picture | Music |
|---|---|---|
| 0:00 | Stairway into the sky | Low strings, D drone. The motif's first breath on piano |
| 0:08 | Elders tell the story by the fire | Harp rocks under the story, and the motif repeats in F. Celesta sparkles as the glyph glows |
| 0:15 | **Wonder:** his fascinated face (no VO) | Bbmaj7♯11, the "wonder chord". The motif in celesta and flute, rising and blooming |
| 0:22 | **The climb begins** | Driving 16th-note string ostinato with 3+3+2 accents and a hybrid pulse. Horns state the motif, then sequence it up through Gm and A |
| 0:32 | "Keep going / The top is worth it" | Full crescendo on the dominant (A). The music believes the wall |
| 0:38.85 | Pan toward "You're almost there"… | A breath of silence |
| 0:39 | **The skeleton** | Horror hit: tremolo clusters, low piano slam, trombones, a dissonant braam and a string screech |
| 0:41 | Another climber passes | Uneasy D pedal pulse and Phrygian Eb shadows |
| 0:52 | Determined face (VO gap) | Horns throw out the motif at forte. The ostinato then runs out of steam |
| 0:55 | **Tired**, grey, sweating | Ostinato gone, slow heartbeat. Solo cello tries the motif and can't reach the top note |
| 1:09 | **Crying** (red) | String lament: the motif **inverted** (F–E–D–A), peaking on the cry |
| 1:15 | Night, the moon | An open fifth, neither major nor minor |
| 1:18 | **The voice from above** | Choir and organ: Bb → F → G → **D major**. The motif completes in major on celesta (A–D–E–**F♯**) for the first time |
| 1:24 | Others climbing together | Pizzicato and harp restart the pulse, now in D major |
| 1:41 | The final ascent | Back to minor, then layers pile on every bar: taiko, choir, brass, a rising Shepard tone. The motif climbs the same staircase sequence as at 0:30 |
| 1:57 | Chalk wings on the wall | A celesta glint of the motif |
| 2:00.6 | **Hush:** close-up | A deceptive cadence (A → Bb). The motif rises through Bb, F, Gm and A on piano, under organ and choir |
| 2:05.8 | **THE SUN** | Full tutti in D major. The main theme climbs in thirds: D6 over Bb, E6 over C, then **F♯6 over D**, the summit. Peaks in the 2:08–2:14 VO gap |
| 2:16 | Sunset, night again | Strings and choir settle through Bm and G |
| 2:27 | Everyone climbing toward the light | The wonder chord returns. Piano plays A–D–E… and finally **F♯** on D major, then a last high A as it fades to black |

## Mix notes

- **Voice detection:** the speech in the original track is found automatically. While someone speaks, the music is held about 14 dB under the voice, with a 2.5 dB mid-range dip (250 Hz–4 kHz). In the gaps it goes back to full level, with a 120 ms look-ahead so words are never covered.
- **Fader rides** lift the wordless moments: wonder, tears, the voice from above and the finale.
- **Sound:** rendered with the FluidR3 General MIDI soundfont plus synthesized layers (taiko, braams, risers, Shepard tone, sub, heartbeat) through one shared synthetic concert-hall reverb. For release quality, load `midi/` into a DAW with orchestral libraries (Spitfire, CSS, Berlin, etc.). Timings are absolute seconds, so it stays in sync at any tempo setting.

Re-render: `python3 score/compose.py path/to/video.mp4`. This needs `fluidsynth`, `fluid-soundfont-gm`, `ffmpeg`, and the Python packages `numpy scipy soundfile pretty_midi`.
