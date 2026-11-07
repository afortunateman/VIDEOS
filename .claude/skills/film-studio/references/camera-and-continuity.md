# Camera, cutting and continuity

## Camera moves
- **One shot, one move.** Define the start framing and the end framing, and ease between them
  with a single curve (cubic in-out). User notes that came from breaking this:
  - "it looks like two diff shots" — a pull-back settled, then a second pan started. Fix: end
    the first move on the framing the next beat needs, and never restart after settling.
  - "the camera pans up then down" — a three-key path overshot. Fix: two keys, one direction.
- **Let moves settle** ~0.5–1 s before a cut or an important line, unless the cut is on motion
  on purpose.
- **Almost never fully still** (reference measured ~65% of frames moving): add a slow drift or
  deterministic handheld noise. Then use stillness as an event ("for the first time, the camera
  is still").
- Camera height ~0.8× character height for intimacy; low angle for heroics/scale; top-down for
  repetition ("thousands of steps"); huge pull-backs for revelations.
- 3D that "looks 2D": camera too close + long lens + flat light. Pull back, widen a little,
  show foreground/midground/background layers, add DOF and fog.

## Cutting
- Cut on the voice-over's pauses; one phrase ≈ one shot (sometimes two for a reaction).
- Hold emotional beats longer than the words: the user repeatedly asked for extra seconds so
  music could carry a moment ("drag it out a bit", "let people linger").
- Don't end on the last word: hold the final image several seconds before fading.
- Match head direction / eyeline across cuts; keep the 180° line and a consistent screen
  direction for travel (climbing always goes the same way on screen).
- Cross-fades only for time passing; otherwise straight cuts.

## Inserts and extensions (patching an existing film)
The user often asked for "one more clip after X" or "extend that shot by 3 seconds".
- Build the insert **from the neighbouring shot's own definition** (same light function, sun
  direction, shadow settings, set dressing, character state, time of day), overriding only the
  time or camera. In code: export the scene renderer and give it an `at` (time) override.
- An extension of a camera move: continue the *same* curve's velocity smoothly, or hold the
  final framing with a tiny drift. Don't start a new move.
- Check the join frames side by side (last frame before, first frame of insert) for a jump in
  light, colour, position or expression.
- Render only the new range; splice; check total frame count and audio sync. Keep the old
  master.

## Automated camera checks (write one for any 3D project)
Sample each shot at several times. Flag: camera inside geometry (point-in-mesh or below the
ground/stair profile), the ray from camera to the face hitting something, the face projected
outside a safe box, or the face smaller than N px in a close-up. Repeating set pieces (posts,
pillars) should be placed off the hero's mark, or they block half the shots.
