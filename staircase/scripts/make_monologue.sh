#!/usr/bin/env bash
# Monologue edit: hold the opening empty-wall shot so the Alan Watts quote can be read, the speaker rises in front of
# the quote (person cut-out over the quote), a spiral progress timer with a "T-minus" countdown to the movie.
#   make_monologue.sh <raw monologue video>
# Needs a Python 3.12 venv with mediapipe==0.10.21 (it bundles the selfie-segmentation model):
#   python3.12 -m venv mpenv && mpenv/bin/pip install "mediapipe==0.10.21" "numpy<2" opencv-python-headless
set -euo pipefail
cd "$(dirname "$0")/.."
RAW=$1; MP=${MPENV:-mpenv}/bin/python; T=$(mktemp -d)
F=1.9      # the empty wall ends here (he rises in just after)
HOLD=2.6   # hold its last frame this long, so the quote can be read
END=51.15  # just after the last word
# picture: 1920x1080, the held frame gets live grain
ffmpeg -v error -y -i "$RAW" -filter_complex "[0:v]scale=1922:1080,crop=1920:1080,fps=30,setsar=1,split=3[a][b][c];\
[a]trim=0:$F,setpts=PTS-STARTPTS[v1];\
[b]trim=start=$F,setpts=PTS-STARTPTS,trim=end_frame=1,loop=loop=$(awk "BEGIN{print int($HOLD*30+0.5)-1}"):size=1:start=0,setpts=N/30/TB,noise=alls=6:allf=t[v2];\
[c]trim=$F:$END,setpts=PTS-STARTPTS[v3];[v1][v2][v3]concat=n=3:v=1:a=0[v]" -map "[v]" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p public/monologue/mono.mp4
# voice: the same cut (silence over the hold), high-passed and levelled to -16 LUFS
ffmpeg -v error -y -i "$RAW" -filter_complex "[0:a]atrim=0:$F,asetpts=PTS-STARTPTS[a1];anullsrc=r=48000:cl=stereo,atrim=0:$HOLD[a2];[0:a]atrim=$F:$END,asetpts=PTS-STARTPTS,afade=t=out:st=$(awk "BEGIN{print $END-$F-0.35}"):d=0.35[a3];[a1][a2][a3]concat=n=3:v=0:a=1,highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11" -ar 48000 -c:a pcm_s16le $T/voice.wav
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 public/monologue/mono.mp4)
# graphics: quote + spiral timer + countdown
npx remotion render src/index.ts Monologue $T/render.mp4 --props="{\"src\":\"monologue/mono.mp4\",\"quoteIn\":0.3,\"quoteOut\":6.0,\"durationSec\":$DUR,\"width\":1920,\"height\":1080}" \
  --concurrency=4 --timeout=600000 --muted --codec=h264 --crf=12 --pixel-format=yuv420p --log=error
# the speaker cut out over the rise (frames 128-186), laid over the quote
mkdir -p $T/matte; $MP -I scripts/monologue_matte.py public/monologue/mono.mp4 $T/matte 128 186
ffmpeg -v error -y -i $T/render.mp4 -framerate 30 -start_number 128 -i $T/matte/%05d.png -i $T/voice.wav -filter_complex \
  "[1:v]setpts=PTS-STARTPTS+128/30/TB[m];[0:v][m]overlay=eof_action=pass:format=auto[v]" -map "[v]" -map 2:a \
  -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 256k -movflags +faststart out/insert/The_Staircase_monologue.mp4
rm -rf $T
