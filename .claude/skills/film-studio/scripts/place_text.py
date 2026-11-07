"""Choose where a page's text goes: the calmest, darkest candidate box of the picture (white text).
python3 place_text.py <stills dir> <plan.json> > placement.json
plan.json: [{"id": "p01", "text": "...", "pos": optional pin}, ...]; stills/<id>.png must exist."""
import json, sys
import numpy as np
from PIL import Image, ImageFilter

stills, plan = sys.argv[1], json.load(open(sys.argv[2]))
# candidate boxes as fractions of the page (x0, y0, x1, y1); bands span the safe width, corners half of it
C = {
    'top': (0.07, 0.06, 0.93, 0.32), 'bottom': (0.07, 0.68, 0.93, 0.94),
    'top-left': (0.07, 0.06, 0.52, 0.40), 'top-right': (0.48, 0.06, 0.93, 0.40),
    'bottom-left': (0.07, 0.60, 0.52, 0.94), 'bottom-right': (0.48, 0.60, 0.93, 0.94),
    'mid-left': (0.05, 0.30, 0.45, 0.58), 'mid-right': (0.55, 0.30, 0.95, 0.58),   # pinned only
}
out = {}
for p in plan:
    if 'blocks' in p:
        out[p['id']] = {'pos': 'blocks'}; continue
    im = Image.open(f"{stills}/{p['id']}.png").convert('RGB').resize((256, 256))
    g = im.convert('L')
    edges = np.asarray(g.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(3)), float) / 255
    lum = np.asarray(g, float) / 255
    rgb = np.asarray(im, float) / 255
    sat = rgb.max(2) - rgb.min(2)
    long_text = len(p['text']) > 70
    scores = {}
    for k, (x0, y0, x1, y1) in C.items():
        if k.startswith('mid'): continue
        sl = (slice(int(y0 * 256), int(y1 * 256)), slice(int(x0 * 256), int(x1 * 256)))
        busy = edges[sl].mean() * 4 + edges[sl].std() * 2      # detail: characters, carvings, steps
        bright = max(0, lum[sl].mean() - 0.55) * 1.5           # white text needs a darker ground
        colorful = sat[sl].mean() * 0.3                          # saturated areas are usually the subject
        s = busy + bright + colorful
        if '-' in k and long_text: s += 0.25                     # long text needs a full band
        if k.startswith('top'): s -= 0.03                        # slight preference for reading from the top
        scores[k] = round(s, 3)
    best = p.get('pos') or min(scores, key=scores.get)   # a page can pin its text position
    out[p['id']] = {'pos': best, 'box': C[best], 'scores': scores}
json.dump(out, sys.stdout, indent=1)
