#!/usr/bin/env bash
# Stitch the rendered chunks into the final film and lay the voice-over on top.
# The scream close-up (film frames 1764-1817) is replaced by a re-rendered patch
# (local frames 454-507 of chunk b). The voice-over is lightly compressed and
# normalised to -14 LUFS / -1 dBTP. Also writes a smaller copy for sharing.
set -euo pipefail
cd "$(dirname "$0")/.."
C=out/chunks
OUT=out/The_Staircase_1080p.mp4

# 1. Voice-over: compress, then two-pass loudnorm (duration unchanged, so sync holds).
ffmpeg -v error -y -i public/vo.mp3 -af "acompressor=threshold=-26dB:ratio=2.5:attack=8:release=150:makeup=1,aresample=48000" -c:a pcm_s24le out/vo_comp.wav
M=$(ffmpeg -hide_banner -i out/vo_comp.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p' |
  python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -v error -y -i out/vo_comp.wav -af "loudnorm=I=-14:TP=-1:LRA=11:$M:linear=true,aresample=48000" -c:a pcm_s24le out/vo_norm.wav

# 2. Picture: chunks + scream patch, master quality.
ffmpeg -v error -y -i $C/a.mp4 -i $C/b.mp4 -i $C/scream_patch.mp4 -i $C/c.mp4 -i out/vo_norm.wav \
  -filter_complex "[1:v]trim=end_frame=454,setpts=PTS-STARTPTS[b1];[1:v]trim=start_frame=508,setpts=PTS-STARTPTS[b2];[0:v][b1][2:v][b2][3:v]concat=n=5:v=1:a=0,fps=30[v]" \
  -map "[v]" -map 4:a -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 320k -movflags +faststart "$OUT"

# 3. Shareable copy.
ffmpeg -v error -y -i "$OUT" -c:v libx264 -preset slow -crf 22 -tune animation -pix_fmt yuv420p -c:a copy -movflags +faststart out/The_Staircase_1080p_share.mp4
ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate,duration -show_entries format=duration,size -of compact "$OUT"
