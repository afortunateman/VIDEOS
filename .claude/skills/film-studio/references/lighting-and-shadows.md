# Lighting and shadows

## Principles
- Every light is motivated (sun, fire, a glow from above) and changes with the story beat:
  hope warms, despair cools, revelation pulses.
- Warm key, cool/purple shadows. No pure black; lift darks with colour.
- Glow/bloom only on light sources.
- Faces get light. If a dramatic light source (campfire) sits between camera and face, move
  the camera or the source, or add a soft fill on the face. Check the whole beat, every frame.
- Light continuity across cuts and inserts: same direction, colour, softness. Re-use the shot's
  light function instead of re-describing it.

## Shadows (the biggest source of revisions)
Problems seen: saw-tooth edges on steps and faces with a low sun; shadows swimming/crawling as
the camera moves; harsh shadows across a face; shadows at night; shadow direction jumping when
the sun moved for a sunset.

Fixes (Three.js; the ideas carry to any engine):
1. **Softer filtering**: three.js PCF uses 5 taps. Patch the shader chunk to 16 Vogel-disc taps:
   ```ts
   const chunk = THREE.ShaderChunk.shadowmap_pars_fragment;
   const five = /shadow = \(\s*texture\( shadowMap, vec3\( shadowCoord\.xy \+ vogelDiskSample\( 0, 5, phi \)[\s\S]*?\) \* 0\.2;/;
   if (!five.test(chunk)) throw new Error('shadow patch: three.js shader changed');
   THREE.ShaderChunk.shadowmap_pars_fragment = chunk.replace(five, `shadow = 0.0;
     for ( int i = 0; i < 16; i ++ ) {
       shadow += texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( i, 16, phi ) * radius, shadowCoord.z ) );
     }
     shadow /= 16.0;`);
   ```
   with `shadow-radius={2.5}` and a 4096 map (cost was about the same as 2048).
2. **Stable shadows**: snap the shadow camera centre to whole shadow-map texels in the light's
   view plane, so edges don't crawl when the camera moves:
   `texel = 2*size/MAP; for axis in (right, up): c += axis*(round(dot(c,axis)/texel)*texel - dot(c,axis))`.
3. **Tight shadow frustum** around what's on screen (`shadowCenter` per shot), not the whole world.
4. **Keep the sun high enough for shadows** (clamp key elevation ≥ ~0.28) even when the visible
   sun is on the horizon; a grazing key makes long streaky shadows.
5. **Per-shot shadow strength** as a function of time (`sunShadow(t)` → `light.shadow.intensity`),
   so a sunset fades shadows to 0, and night has none. Turn `castShadow` off at 0.
6. **Fixed key direction** across a time-of-day transition (`keyDir`), so shadows don't swing
   while the sky changes colour.
7. For stills (book pages), soften shadow intensity (e.g. 0.15–0.5) so faces read.

## Grade (final pass, fixes many gaps at once)
Tone curve (gentle S), lifted coloured blacks, saturation ×1.1–1.25, slight warm/cool cast per
time of day, vignette (corners darker than centre), fine grain, DOF and bloom. Measure luma
mean/std and saturation against the reference after grading.
