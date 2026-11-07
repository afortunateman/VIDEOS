# Music and sound

## Voice
- Never alter the performance. Level it: `acompressor` then two-pass `loudnorm` to −14 LUFS
  integrated, −1 dBTP (a raw TTS file came in at −28 LUFS).
- Mux the full voice track once at the end over video-only chunks (no drift).

## Editing existing music to picture (hooks, trailers, crossfades)
Analyse first with `scripts/audio_analyze.py score.wav` (tempo, onsets, RMS curve, key/chroma
per window). Then:
1. **Land the hit on the cut**: pick the score time `A0` so a big onset falls exactly on the
   picture's hit frame (`A0 = onset_time - cut_time`), then `-ss A0`.
2. **Never fade in on an instrument's first note**: the user heard "a disconnect" when a piano
   phrase was faded in from its attack. Start the in-point a bar earlier or between phrases, so
   the phrase begins audibly whole.
3. **Never join sections in different keys**: compare chroma; join only where the dominant
   chord/key matches (e.g. two D-major sections). A harmonic mismatch sounds like a mistake even
   with a perfect fade.
4. **Equal-power crossfades**, long (1.5–4 s), at an onset-free point:
   `acrossfade=d=3:c1=qsin:c2=qsin`.
5. **Taper, don't stop**: end with a long `afade=t=out:...:curve=qsin` (4 s+), and `apad` past it so
   nothing gets cut early.
6. Crescendo into a moment: `volume='...':eval=frame` envelope rather than a sudden level jump.
7. When asked for "no new music", add none: let the current music fade out under the new
   section, and use at most a few sparse SFX.

## ffmpeg gotchas
- `bandpass=f=..:w=..` reads `w` as **Q** by default → near-silent output. Use
  `highpass=f=A,lowpass=f=B`, or set `width_type=h`.
- `afir` reverb with a synthetic IR washed everything out and truncated audio. Use `aecho`
  for light space, or skip reverb.
- Mixing: `amix=inputs=N:normalize=0:duration=longest`, then `apad=whole_dur=T,atrim=0:T`, then
  `alimiter=limit=0.89:level=false`. Without `apad`, `-shortest` cuts the video.
- `adelay=ms|ms` (both channels) to place SFX; compute ms with awk, not bash integer maths.

## Synthesised SFX recipes (no samples needed)
```
boom/hit:   aevalsrc="0.9*exp(-3.2*t)*sin(2*PI*(36*t+38/7*(1-exp(-7*t))))"  + short lowpassed pink noise
impact:     aevalsrc="1.0*exp(-1.9*t)*sin(2*PI*(30*t+46/6*(1-exp(-6*t))))"   + 0.45 s highpassed white crack
shimmer:    anoisesrc white -> highpass=6000, volume='exp(-1.3*t)', apulsator=hz=11, aecho
flutter:    anoisesrc pink -> highpass=1200,lowpass=3000, volume='pow(max(0,sin(2*PI*5*t)),3)'
whoosh:     anoisesrc pink -> lowpass sweep, fade in/out 0.3 s
text pop:   short sine blip 600-900 Hz, 60 ms, exp decay, low level
```
Place each on its visual event (cut, text appearing, wing flap); keep SFX ≈ −6 dB under voice.

## Scoring
Claude can't perform music but can: choose and cut from the user's own score, build ambient
beds/drones/pulses with synthesis, and time cue points. Ask the user for their score
(e.g. from a music tool) and edit it to picture with the rules above.
