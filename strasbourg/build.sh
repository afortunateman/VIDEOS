#!/bin/bash
# Full build: wait for panels, render 3 chunks in parallel, join, add audio.
set -e
cd "$(dirname "$0")"
while pgrep -f prep.py >/dev/null; do sleep 5; done
DUR=$(python3 -c "import json;print(json.load(open('timing.json'))[-1]['end'])")
python3 render.py part1.mp4 0 134 > r1.log 2>&1 &
python3 render.py part2.mp4 134 267 > r2.log 2>&1 &
python3 render.py part3.mp4 267 "$DUR" > r3.log 2>&1 &
wait
printf "file part1.mp4\nfile part2.mp4\nfile part3.mp4\n" > parts.txt
ffmpeg -v error -y -f concat -safe 0 -i parts.txt -c copy video.mp4
ffmpeg -v error -y -i video.mp4 -i voice.mp3 -filter_complex \
 "anoisesrc=c=brown:a=0.5:d=$DUR,lowpass=f=320,volume=0.05,afade=t=in:d=3,afade=t=out:st=$(python3 -c "print($DUR-4)"):d=4[amb];[1:a][amb]amix=inputs=2:duration=first:normalize=0[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart strasbourg_1518.mp4
rm -f part*.mp4 parts.txt video.mp4
echo BUILD_DONE
