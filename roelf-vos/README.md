# The Story of Roelf Vos

A 118-second animated short about Roelf Vos (1921–1992): Dutch resistance, migration to
Tasmania, a 13-store supermarket chain, and the Swiss village he built near Launceston,
which got its rare snowfall shortly before he died.

The visual style follows Motionlab's *The Story of Coffee*: flat angular characters with
wedge noses, bold warm palettes, layered parallax scenery, film grain, and titles written
on in a single gold line.

- **Animation:** JavaScript (SVG built in code, motion on one GSAP timeline), rendered with
  [HyperFrames](https://hyperframes.heygen.com).
- **Music:** original score synthesised in Python (`music/compose.py`). No samples are used.
- **Output:** `renders/roelf-vos.mp4`, 1920×1080, 30 fps.

## Structure

```
index.html            HyperFrames composition: 14 scene clips, grain, score
js/timing.js          the shared 100 BPM bar grid (1 bar = 2.4 s) used by scenes and music
js/lib.js             drawing toolkit: script writer, clouds, mountains, chalets, people, snow…
js/scenes/NN-*.js     one builder per scene (title → end card)
js/data/              generated data: single-stroke script font, world land, Tasmania coast
js/vendor/            gsap, d3-array, d3-geo (vendored so renders never hit the network)
music/compose.py      the score: instruments, arrangement, reverb, mastering
assets/audio/         score.m4a (used by the composition) and score.wav
assets/fonts/         Cormorant Garamond, Josefin Sans (SIL OFL)
tools/build-data.mjs  regenerates js/data/ from npm packages (see tools/package.json)
```

## Scenes and bars

| Bars  | Time (s)      | Scene                                        | Music                                   |
| ----- | ------------- | -------------------------------------------- | --------------------------------------- |
| 0–3   | 0–7.2         | Title, written in gold                       | celesta states the theme                |
| 3–6   | 7.2–14.4      | The Netherlands, 1921                        | pastoral flute, harp, pizzicato         |
| 6–10  | 14.4–24.0     | War and the Dutch resistance                 | B minor, tremolo strings, timpani       |
| 10–14 | 24.0–33.6     | 1951 voyage on a turning globe               | horn theme, rolling piano               |
| 14–18 | 33.6–43.2     | Arrival, odd jobs, the grocery store         | sparse piano, busy pizzicato, shop bell |
| 18–21 | 43.2–50.4     | 13 supermarkets pop up across Tasmania       | 13 glockenspiel pops on the 8ths        |
| 21–25 | 50.4–60.0     | Switzerland, then the idea                   | accordion ländler, clarinet             |
| 25–29 | 60.0–69.6     | 1980: the blueprint becomes a village        | full theme, driving rhythm              |
| 29–32 | 69.6–76.8     | 1982: SOLD to Woolworths                     | question motif, coins                   |
| 32–35 | 76.8–84.0     | The building rules (chalkboard)              | staccato, comic veto, bright approval   |
| 35–38 | 84.0–91.2     | 1989: the village complete                   | the big statement                       |
| 38–41 | 91.2–98.4     | Two Grindelwalds: snow is rare here          | solo piano, sparkles only on the left   |
| 41–45 | 98.4–108.0    | 1992: it snowed                              | celesta, choir, falling shimmer         |
| 45–48 | 108.0–118.0   | End card                                     | the theme resolves                      |

## Rebuild

```bash
# music (needs numpy + scipy, and ffmpeg for the .m4a)
python3 music/compose.py

# preview and edit in HyperFrames Studio
npx hyperframes preview

# validate and render (the renderer's master is ~260 MB; the delivery copy is a 2-pass 6 Mbps encode)
npm run check
npx hyperframes render --quality standard --output renders/master.mp4
ffmpeg -i renders/master.mp4 -c:v libx264 -preset slow -b:v 6000k -pass 1 -an -f mp4 /dev/null
ffmpeg -i renders/master.mp4 -c:v libx264 -preset slow -b:v 6000k -maxrate 12000k -bufsize 16000k -pass 2 \
  -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 256k renders/roelf-vos.mp4

# optional: regenerate js/data/
cd tools && npm install && node build-data.mjs
```


their text or timing directly, or in Studio.

## Credits

Map data from Natural Earth (public domain) via `world-atlas`. Single-stroke script font
EMS Allure (SIL OFL) via `hersheytext`. Fonts: Cormorant Garamond and Josefin Sans (SIL OFL).
