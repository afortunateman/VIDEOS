# Style Bible: "The Staircase"

Voice-over: user-supplied TTS script (caterpillar on an endless staircase, ending on the Alan Watts line).
Look: the cel-cartoon character style of the reference animation, moved into saturated,
hand-painted 3D scenes rendered with Remotion + Three.js.

## Reference analysis (175 s, 1280x720, 24 fps; studied frame by frame at 2 s intervals plus full-res stills)

What the reference does:
- **Line**: bold, near-black ink outlines on every silhouette and major fold, about 3 px at 720p.
  Interior lines are sparse.
- **Shading**: flat fills plus one hard-edged shadow tone (2-tone cel). Night scenes add a coloured rim
  or screen glow (cyan) instead of more shading.
- **Colour**: very saturated primaries. Sky blue #1e7bff to #58b4ff, cartoon clouds with a lighter
  outlined rim, desert ochres, hot reds and yellows on hero props. Measured saturation mean 0.40,
  luma std 0.31 (high contrast).
- **Characters**: big, readable faces. White oval eyes with large pupils, thick brows doing most of the
  acting, simple D-shaped mouths. Exaggerated squash and stretch on reactions.
- **Timing**: animated on twos (58% of frames are held duplicates in action shots). Cuts are fast,
  roughly every 1–3 s, mixing wides with extreme close-ups (eyes, hands, props).
- **Camera**: dynamic angles (low hero angles, dutch tilts, top-down), speed lines and smear frames
  on fast moves, impact frames (black-and-red flashes) on big beats.
- **Backgrounds**: painted but simple, with strong perspective. Depth comes from a blurred
  foreground or background, not detail.

## Our translation to 3D

| Reference trait | How we do it |
|---|---|
| Ink outlines | Post pass: depth and normal edges, about 3 px at 1080 wide; fades with distance and blur |
| 2-tone cel shading | `MeshToonMaterial` with a 3-step hard ramp; purple ambient for coloured shadows |
| Drawn faces | Faces painted on canvas and mapped onto the 3D head, so expressions are drawn, not modelled |
| Painted backgrounds | Seeded canvas textures: brush daubs, wobbly ink seams, painted cloud cards |
| Saturated palette | Grade: saturation 1.22, warm lifted blacks, gentle S-curve, vignette |
| Depth | Depth of field + aerial fog toward a peach horizon |
| On-twos feel | Character animation stepped on twos; camera moves stay smooth (decide per shot) |

## Rules
- Vertical 1080x1920, 30 fps, final export 1440x2560.
- Characters, world and story are original; the reference is study material only.
- No captions or burned-in text except story props (carved wall messages).
- Every line of the voice-over is illustrated literally.
- Each frame renders deterministically (seeded textures, no `Math.random`).

## Characters
- **Hero**: mint-green caterpillar (#6fd38a), yellow dot row, pale belly, yellow-tipped antennae,
  little red-brown suitcase.
- **Quitters**: desaturated sage palette, slumped poses.
- **Other climbers**: hero palette, smaller, out of focus up the stairs.
