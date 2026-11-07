# Print books (KDP), ebooks, screenplays, docs

## KDP picture book (paperback, 8.5×8.5 in, bleed, glossy colour)
- Interior page with bleed: 8.625 × 8.75 in → at 300 dpi **2588 × 2625 px** (the bleed is
  0.125 in on the outside edge and top/bottom, not the spine side). Keep text ≥ 0.375 in
  (~115 px) inside the trim edge.
- Page count: an even number ≥ 24; the user wanted > 32 (we made 42: 38 story pages + title,
  copyright, dedication, end).
- Cover (one PDF): width = 0.125 + 8.5 + spine + 8.5 + 0.125 in, height = 8.75 in; spine =
  pages × 0.002347 in for premium colour (check KDP's calculator); no spine text under 79
  pages.
- Build PDFs with exact page size (`img2pdf` with a layout function), images JPEG q95 at 300 dpi.
- Choose **glossy** in KDP settings if the user asks (default is matte).

## Story pages from a film
- One clear still per text beat; prefer frames where the hero's **face is visible and well
  lit** (no flame/shadow over it, eyes open, emotion matching the text). Don't go several
  pages without the hero's face.
- Re-render stills (not video frames) at print resolution with per-page camera tweaks
  (pull back, re-aim, soften shadows) and fix geometry that looks wrong in a still.
- Text: big (kids' book), **white with a dark outline**, rounded font (Fredoka). Put each
  thought on its own block; quotes in quotation marks; don't clump lines; vary size to
  emphasise key words. Place by image analysis: `scripts/place_text.py` scores candidate
  boxes by edge busyness, brightness and saturation, picks the calmest; allow pins
  (`"pos": "mid-left"`) and multiple blocks per page.
- Special pages: title (blurred hero image + logo), copyright (no awkward gaps),
  dedication, end page (light background with the symbol and THE END), back cover with blurb.
- Render page layouts as HTML with Playwright (`page.goto` an HTML file; `setContent` can't
  load local files), screenshot at exact pixels.

## Ebook (Kindle) differs from print
No bleed, no spine; a single front cover JPEG (e.g. 2560 px tall, 1:1 for a square book);
fixed-layout interior via Kindle Kids' Book Creator from the trimmed interior PDF.

## Screenplay
Write Fountain (`Title:`, `INT./EXT. PLACE - TIME`, action, `NARRATOR (V.O.)`), render to PDF.
For Google Docs: upload HTML via the Drive connector (converts to a Doc), then fix page breaks
with `pageBreakBefore` paragraph styles.
