# Every Horizon

An original piece for orchestra in 7/8, about 2:20.

- `every_horizon.mp3` – rendered audio
- `every_horizon.mid` – the score as MIDI (16 named tracks, tempo map)
- `compose.py` – the composition, as code
- `render.sh`, `master.py` – MIDI → audio (fluidsynth + FluidR3_GM, ffmpeg)

## The idea

An eight-bar theme that never comes home. Its last note is left hanging, and
each time that note turns out to be the ground of a new key a major third
higher: D♭ → F → A → D♭. The horizon becomes the floor, three times, until
the circle closes.

| Time | Section | What happens |
| --- | --- | --- |
| 0:00 | Intro | A haze on A under one held C♯. Piano asks a three-note question: up a fifth, up a step. |
| 0:20 | I, D♭ | The C♯ is D♭. Theme in solo cello over harp; ends hanging on F. |
| 0:37 | II, F | Theme in violins, horn countermelody, violas running in sixteenths; ends hanging on A. |
| 0:53 | III, A | Fugato on the head of the theme, four entries a bar apart over a falling bass, converging on one bare C♯. |
| 1:13 | IV, D♭ | The theme at half speed in full orchestra, then the only cadence in the piece. |
| 1:55 | Coda | The question again, ending on G natural, unanswered. |

Rebuild with `./render.sh`.
