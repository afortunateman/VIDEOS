#!/usr/bin/env bash
# Stitch the rendered chunks into the final film and lay the voice-over on top.
# The scream close-up (film frames 1764-1817) is replaced by a re-rendered patch
# (local frames 454-507 of chunk b).
set -euo pipefail
cd "$(dirname "$0")/.."
C=out/chunks
OUT=${1:-out/The_Staircase_1080p.mp4}
ffmpeg -v error -y -i $C/a.mp4 -i $C/b.mp4 -i $C/scream_patch.mp4 -i $C/c.mp4 -i public/vo.mp3 \
  -filter_complex "[1:v]trim=end_frame=454,setpts=PTS-STARTPTS[b1];[1:v]trim=start_frame=508,setpts=PTS-STARTPTS[b2];[0:v][b1][2:v][b2][3:v]concat=n=5:v=1:a=0,fps=30[v]" \
  -map "[v]" -map 4:a -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$OUT"
ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate,duration -show_entries format=duration,size -of compact "$OUT"
