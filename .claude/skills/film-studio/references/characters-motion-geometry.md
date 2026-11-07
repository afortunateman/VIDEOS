# Characters, motion and geometry

## Characters and faces
- Make original turnaround sheets (front, 3/4, side) and expression sheets before animating.
- Faces as drawn textures (2D painted onto 3D) keep a hand-made look and make expressions easy:
  eyes, lids, brows, mouth as parameters → redraw a canvas. Quantise expression keys (only
  redraw when a parameter changes meaningfully) and cache textures in a bounded LRU.
- Expressions must match the line and the arc: eager → hopeful → tired (heavy lids, no smile,
  sweat, drooping antennae) → scared (eyes visible!) → scream (open wail, not a grin) →
  peaceful (small real smile). The user flagged every mismatch.
- Blinks: one deliberate blink can be a beat. Avoid half-closed eyes in chosen stills.
- Age/state changes are shown through palette (paler), posture and props (worn suitcase).
- Secondary characters: desaturated palette or out of focus, so the hero reads first.
- Keep the face toward camera during emotional lines; if the action needs him to look away
  ("he was still as he was before"), the user preferred seeing the face anyway.

## Motion
- Ease everything (smoothstep `t*t*(3-2t)` or cubic in-out). Linear ramps produced visible
  velocity kinks; replace `lerp` ramps with smoothstep and soft starts/stops.
- Hold pose on twos for a cel feel, but keep the camera smooth on ones (decide per shot).
- Fixed segment spacing for chains/bodies (solve positions as a chain), gravity-hung props,
  lanes wide enough that props never pass through each other.
- **Jitter audit**: sample at 30 fps, for each tracked point compute per-frame step; flag
  frames whose step > 2.5× the median of the 4 neighbours (+ small epsilon). Also check head
  facing and carried props. This finds one-frame pops before rendering.

## Contact with surfaces (nothing sinks, nothing floats)
- For bodies on steps: a rigid ball can't roll over a step edge smaller than its radius; it
  snaps up in one frame. Use a **soft contact** for body segments: on the lower side of each
  edge, lift along a smoothstep over a short `reach`, level with the next step at the edge,
  allowing ≤ 3 cm squash. Use **rigid contact** (tread or edge, whichever is higher) for heads
  and hard props so they never cut in.
- Text/carvings on walls must sit on the wall surface, above the stair profile.
- Sitting/slumped poses: check the head stays in frame after pose changes.

## Geometry that reads as real
- Repeating architecture must be consistent: the stair side faces looked "sometimes lines,
  sometimes plain" because textures stretched with step height. Fix: scale UVs with the face's
  real size (`v *= h / baseH`) so the pattern is uniform.
- Sides must be flush, not protruding ("only it fits snugly instead of protruding"): build a
  solid side slab of a fixed depth and skip any under-slab that pokes out.
- If a fix is only needed for one deliverable (book stills), switch it with a flag set only by
  that composition, so the film is untouched.
- Cameras looking back from higher up a staircase/slope tend to end up inside it: check.
