#!/usr/bin/env bash
# Build a re-cut from a plan (scripts/plan.tsx): splice re-rendered chunks with frames of the base master,
# and rebuild the voice-over with silences at the holds. Also writes a share copy and the voice-over stem.
#   scripts/assemble_plan.sh out/plan.json out/The_Staircase_1080p_v2.mp4 v3_
set -euo pipefail
cd "$(dirname "$0")/.."
PLAN=${1:-out/plan.json}
BASE=${2:-out/The_Staircase_1080p_v2.mp4}
PREFIX=${3:-v3_}
OUT=out/The_Staircase_1080p.mp4
python3 - "$PLAN" "$BASE" "$PREFIX" "$OUT" <<'PY'
import json, subprocess, sys
plan_path, base, prefix, out = sys.argv[1:]
p = json.load(open(plan_path))
fps, frames = p['fps'], p['frames']
inputs, idx, vf = ['-i', base], {}, []
for part in p['parts']:
    if part['src'] == 'chunk' and part['name'] not in idx:
        idx[part['name']] = len(idx) + 1
        inputs += ['-i', f"out/chunks/{prefix}{part['name']}.mp4"]
vo = len(idx) + 1
inputs += ['-i', 'out/vo_norm.wav']
labels = []
for k, part in enumerate(p['parts']):
    src = 0 if part['src'] == 'base' else idx[part['name']]
    vf.append(f"[{src}:v]trim=start_frame={part['a']}:end_frame={part['b']},setpts=PTS-STARTPTS[v{k}]")
    labels.append(f'[v{k}]')
vf.append(''.join(labels) + f'concat=n={len(labels)}:v=1:a=0,fps={fps}[v]')
# Voice-over: pieces at their film positions, silence between (short fades at each cut, no clicks).
af, alabels, t = [], [], 0.0
for k, a in enumerate(p['audio']):
    start, at = a['voFrom'] / fps, a['filmAt'] / fps
    if at > t + 1e-6:
        af.append(f"aevalsrc=0:d={at - t:.6f}:s=48000:c=mono[z{k}]"); alabels.append(f'[z{k}]')
    end = f":end={a['voTo'] / fps:.6f}" if a['voTo'] is not None else ''
    fade = '' if a['voTo'] is None else f",areverse,afade=t=in:d=0.012,areverse"
    af.append(f"[{vo}:a]atrim=start={start:.6f}{end},asetpts=PTS-STARTPTS,afade=t=in:d=0.012{fade}[a{k}]"); alabels.append(f'[a{k}]')
    t = at + ((a['voTo'] - a['voFrom']) / fps if a['voTo'] is not None else 0)
af.append(''.join(alabels) + f"concat=n={len(alabels)}:v=0:a=1,apad,atrim=end={frames / fps:.6f}[a]")
cmd = ['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(vf + af), '-map', '[v]', '-map', '[a]',
       '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
       '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', out]
subprocess.run(cmd, check=True)
PY
ffmpeg -v error -y -i "$OUT" -c:v libx264 -preset slow -crf 22 -tune animation -pix_fmt yuv420p -c:a copy -movflags +faststart out/The_Staircase_1080p_share.mp4
ffmpeg -v error -y -i "$OUT" -vn -c:a pcm_s24le -ar 48000 out/The_Staircase_voiceover.wav
ffprobe -v error -count_packets -show_entries stream=codec_type,width,height,nb_read_packets -show_entries format=duration -of compact "$OUT"
