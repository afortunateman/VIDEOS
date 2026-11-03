#!/usr/bin/env bash
# Render one video-only chunk of the film: render_chunk.sh <first> <last> <name>
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out/chunks
npx remotion render src/index.ts Film "out/chunks/$3.mp4" \
  --frames="$1-$2" --concurrency=1 --timeout=600000 --muted \
  --codec=h264 --crf=14 --pixel-format=yuv420p --log=error
echo "done $3"
