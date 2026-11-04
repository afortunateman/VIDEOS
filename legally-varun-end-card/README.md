# Legally Varun — Shorts end card

3-second, 1080x1920, 60fps cartoon 3D title card built with Three.js.

- `card.html` — the whole animation (scene, timing, easing). Every frame is computed from time, so renders are exact.
- `render.js` — opens the page in headless Chromium, renders 180 frames with motion blur, encodes `build/legally-varun-end-card.mp4`.
- `legally-varun-end-card.mp4` — the finished video.

Re-render:

```bash
npm install
node render.js build
```

Quick preview stills: `node render.js build --frames=30,90,179`
