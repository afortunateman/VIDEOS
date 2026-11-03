#!/usr/bin/env bash
# Make timestamped 4x4 contact sheets from a video so it can be reviewed frame by frame.
# Usage: contact_sheets.sh <video> <out_dir> [seconds_between_frames=2]
set -euo pipefail
video="$1"; out="$2"; step="${3:-2}"
mkdir -p "$out"
stamp="drawtext=text='%{pts\:hms}':x=4:y=4:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6"
ffmpeg -v error -y -i "$video" -vf "fps=1/${step},scale=480:-2,${stamp},tile=4x4" "$out/sheet_%03d.png"
ls "$out" | wc -l | xargs echo "sheets written to $out:"
