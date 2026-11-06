# Strasbourg 1518 — the dancing plague

Built from `storyboard.webp` (40 panels) + `voice.mp3` (Tamil narration). No subtitles.

- `shots.txt` — narration lines mapped to storyboard panels (edit to re-cut)
- `prep.py` — cuts panels, paints out the burned-in captions, upscales 4× (OpenCV EDSR, `EDSR_x4.pb` from github.com/Saafke/EDSR_Tensorflow) → `clean/`
- `timing.py` — times each shot to the voice, snapping cuts to pauses → `timing.json`
- `render.py` — camera moves, sway, flicker, particles, grain, crossfades (per-panel tweaks in `MOVES`/`DANCE`/`CANDLE` sets)
- `build.sh` — renders in 3 parallel chunks and adds the audio → `strasbourg_1518.mp4`

```bash
python3 prep.py storyboard.webp clean EDSR_x4.pb && python3 timing.py && ./build.sh
```
