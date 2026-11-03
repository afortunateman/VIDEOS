#!/usr/bin/env bash
# Splice re-rendered patches (patch_ranges.txt) into the previous master, keep its audio.
set -euo pipefail
cd "$(dirname "$0")/.."
BASE=${1:-out/The_Staircase_1080p_v1.mp4}
OUT=out/The_Staircase_1080p.mp4
python3 - "$BASE" "$OUT" <<'PY'
import subprocess, sys
base, out = sys.argv[1], sys.argv[2]
rng = [l.split() for l in open('scripts/patch_ranges.txt') if l.strip() and not l.startswith('#')]
inputs, parts, k, cur = ['-i', base], [], 1, 0
for a, b, name in rng:
    a, b = int(a), int(b)
    if a > cur: parts.append(f"[0:v]trim=start_frame={cur}:end_frame={a},setpts=PTS-STARTPTS[s{len(parts)}]")
    inputs += ['-i', f'out/chunks/{name}.mp4']
    parts.append(f"[{k}:v]setpts=PTS-STARTPTS[s{len(parts)}]"); k += 1
    cur = b + 1
if cur < 3930: parts.append(f"[0:v]trim=start_frame={cur}:end_frame=3930,setpts=PTS-STARTPTS[s{len(parts)}]")
fc = ';'.join(parts) + ';' + ''.join(f'[s{i}]' for i in range(len(parts))) + f'concat=n={len(parts)}:v=1:a=0,fps=30[v]'
cmd = ['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', fc, '-map', '[v]', '-map', '0:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
       '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-c:a', 'copy', '-movflags', '+faststart', out]
subprocess.run(cmd, check=True)
PY
ffmpeg -v error -y -i "$OUT" -c:v libx264 -preset slow -crf 22 -tune animation -pix_fmt yuv420p -c:a copy -movflags +faststart out/The_Staircase_1080p_share.mp4
ffprobe -v error -count_packets -show_entries stream=codec_type,width,height,nb_read_packets -show_entries format=duration -of compact "$OUT"
