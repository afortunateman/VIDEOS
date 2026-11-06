#!/bin/bash
# Render vertical edit in 3 parallel chunks, join, mux with synthesized mix.
set -e
cd "$(dirname "$0")"
python3 audio2.py
DUR=$(python3 -c "import json;print(json.load(open('sent_timing.json'))[-1]['e'])")
A=$(python3 -c "print(round($DUR/3))"); B=$(python3 -c "print(round(2*$DUR/3))")
python3 render2.py p1.mp4 0 $A > r1.log 2>&1 &
python3 render2.py p2.mp4 $A $B > r2.log 2>&1 &
python3 render2.py p3.mp4 $B $DUR > r3.log 2>&1 &
wait
printf "file p1.mp4\nfile p2.mp4\nfile p3.mp4\n" > parts.txt
ffmpeg -v error -y -f concat -safe 0 -i parts.txt -c copy video.mp4
ffmpeg -v error -y -i video.mp4 -i mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 23 -maxrate 2300k -bufsize 4600k \
  -pix_fmt yuv420p -c:a aac -b:a 160k -shortest -movflags +faststart strasbourg_1518_16x9.mp4
rm -f p?.mp4 parts.txt video.mp4
ls -la strasbourg_1518_16x9.mp4; echo BUILD_DONE
