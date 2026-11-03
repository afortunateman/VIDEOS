#!/usr/bin/env bash
# Render every range in patch_ranges.txt that isn't already rendered.
set -uo pipefail
cd "$(dirname "$0")/.."
grep -v '^#' scripts/patch_ranges.txt | while read -r a b name; do
  n=$((b - a + 1))
  if [ -f out/chunks/$name.mp4 ] && [ "$(ffprobe -v error -count_packets -show_entries stream=nb_read_packets -of csv=p=0 out/chunks/$name.mp4 2>/dev/null)" = "$n" ]; then echo "skip $name"; continue; fi
  echo "render $name $a-$b ($(date +%H:%M))"
  scripts/render_chunk.sh "$a" "$b" "$name"
done
echo "ALL PATCHES DONE $(date +%H:%M)"
