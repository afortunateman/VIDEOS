# Escape Velocity

An original two-minute piece for orchestra, written after studying the piano
score of *Can You Hear the Music*. It borrows that piece's mechanics, not its notes.

- `escape_velocity.mp3` – rendered audio
- `escape_velocity.mid` – the score as MIDI (16 named tracks, full tempo map)
- `compose.py` – the composition itself, as code
- `render.sh`, `master.py` – MIDI → audio (fluidsynth + FluidR3_GM, ffmpeg)

## What the source does

| Device | In the source | Here |
| --- | --- | --- |
| One unchanging figure | six-note cell, 4 bars up, 4 bars down | four-note zigzag cell outlining a rising chain of triads; 5 bars up, 3 down |
| Tempo ratchet | climb at 60, fall at 65; then 60/80, 70/90 … 150 | climb/fall at 84/96, 88/108 … 146/180, coda 176 → 208 |
| Harmony re-lights the figure | pedals and chords change under identical notes | bass climbs by step for the whole piece; 18 harmonies under one figure |
| Cross-rhythm | dotted eighths against 6/8 | pulses of 2, 4, 6, then 8 per bar against the figure's 3 |
| Accent, subito piano, crescendo | every block of the ending | every harmony change from the third cycle on |
| Dissolve and cut | figure becomes pure pulse, stops unresolved | same, ending on G major 9 ♯11 over a B minor piece |

## What is added

- **Canon**: second violins play the figure two cells late, which gives parallel
  thirds on the climb and open fifths on the fall.
- **Mensuration canon**: violas play the same arch at half speed, an octave lower.
- **Cantus**: horns and cellos rise one step per harmony, a twelfth in total.
- **Shepard celesta**: from the seventh cycle the cell climbs endlessly in
  several octaves under a fixed loudness window, so it never reaches a top.

Rebuild with `./render.sh`.
