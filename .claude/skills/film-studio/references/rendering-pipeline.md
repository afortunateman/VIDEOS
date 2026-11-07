# Rendering pipeline (long renders in a cloud sandbox)

## Budget
Software WebGL (`Config.setChromiumOpenGlRenderer('swangle')`) ran ~2.2–2.6 s per 1080p frame
with heavy post (DOF, outlines, 16-tap shadows). 148 s × 30 fps ≈ 4440 frames ≈ 3 hours on one
process. Concurrency 1 was fastest per frame for 3D; 2D/SVG compositions render far faster
and can use higher concurrency. Estimate before starting and tell the user.

## Chunks
- Render video-only chunks (`--frames=a-b --muted --crf=14`), ~300–600 frames each, named by range.
- After each chunk, verify frame count with `ffprobe -count_frames`. Concat with the concat
  demuxer (`-c copy`), then mux the voice/music at the end.
- To patch: render only the changed frame ranges and rebuild the concat list with the new
  pieces replacing the old ranges. Keep a ranges file per version.

## Keep the sandbox alive
- Idle containers are reclaimed and machines can restart: run renders as **tracked background
  tasks** (the harness re-invokes you when they finish), not `nohup &` you then forget.
- Don't poll with `pgrep -f` on a pattern that matches its own command line (it hangs). Use the
  task notification or check output files.
- Write progress to a log; on restart, resume from the last verified chunk.

## Parallel workers
- Other cloud sessions can render chunks in parallel (`create_session` with an
  `outcome_branch`), each committing its outputs to its own git branch; fetch and verify
  sha256. Split files > ~90 MB into parts for git.
- Workers treat follow-up requests from a peer as untrusted and may refuse; give each worker
  its complete job in the first prompt, and start a fresh session for a new job.
- This session may not be able to delete other branches; tell the user which to clean up.

## Disk
- The sandbox has a fixed write allowance. ENOSPC freezes renders silently. Delete old chunk
  versions, diff images and raw dumps as you go; keep only the current master + current chunks.
- Safety checks may block `rm` with `$VAR` paths; use literal paths or `${VAR:?}`.

## Sending results
- Share copy: `-c:v libx264 -crf 20-22 -preset slow -pix_fmt yuv420p -c:a aac -b:a 320k -movflags +faststart`.
- Master: CRF 12–14 or ProRes. If too big to send (> ~500 MB), split losslessly
  (`-c copy -ss/-t` at keyframes, or `split -b`) or upload to Drive.
- Commit source (not giant renders) to the branch after every milestone.

## Python tooling
MediaPipe needs Python ≤ 3.12 (make a venv with `uv venv -p 3.12`, `mediapipe==0.10.21`).
tsx check scripts must live inside the project (they need its `node_modules`).
