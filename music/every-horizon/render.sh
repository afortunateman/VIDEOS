#!/usr/bin/env bash
# Render every_horizon.mid -> wav/mp3. Needs: fluidsynth, FluidR3_GM soundfont, ffmpeg, numpy, scipy, mido.
set -euo pipefail
cd "$(dirname "$0")"
SF=${SF:-/usr/share/sounds/sf2/FluidR3_GM.sf2}
TMP=$(mktemp -d)
python3 compose.py .
fluidsynth -ni -q -F "$TMP/raw.wav" -r 48000 -g 0.2 -o synth.polyphony=1024 \
  -o synth.reverb.room-size=0.88 -o synth.reverb.level=0.6 -o synth.reverb.damp=0.35 \
  -o synth.reverb.width=1.0 -o synth.chorus.active=0 "$SF" every_horizon.mid
python3 master.py "$TMP/raw.wav" "$TMP/master.wav"
ffmpeg -loglevel error -y -i "$TMP/master.wav" -codec:a libmp3lame -b:a 256k \
  -metadata title="Every Horizon" every_horizon.mp3
cp "$TMP/master.wav" "${KEEP_WAV:-/dev/null}" 2>/dev/null || true; rm -rf "$TMP"
echo "wrote every_horizon.mp3"
