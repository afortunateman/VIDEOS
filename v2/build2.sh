#!/bin/bash
# Render edit (16:9 default; FORMAT=9x16 for vertical) in 3 parallel chunks, join, mux with synthesized mix.
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
python3 intro.py                                   # text-on-black intro -> intro_v.mp4, intro.wav
printf "file intro_v.mp4\nfile video.mp4\n" > parts.txt
ffmpeg -v error -y -f concat -safe 0 -i parts.txt -c copy video_i.mp4
ffmpeg -v error -y -i video_i.mp4 -i intro.wav -i mix.wav -filter_complex \
  "[1:a]aformat=sample_rates=44100:channel_layouts=stereo[a0];[2:a]aformat=sample_rates=44100:channel_layouts=stereo[a1];[a0][a1]concat=n=2:v=0:a=1[a]" \
  -map 0:v -map "[a]" -c:v libx264 -preset slow -crf 23 -maxrate 2150k -bufsize 4300k \
  -pix_fmt yuv420p -c:a aac -b:a 160k -shortest -movflags +faststart strasbourg_1518_16x9.mp4
rm -f p?.mp4 parts.txt video.mp4 video_i.mp4 intro_v.mp4 intro.wav
ls -la strasbourg_1518_16x9.mp4; echo BUILD_DONE
