# Cut storyboard grid into panels, remove baked-in captions, upscale 4x.
import sys, cv2, numpy as np
src, out = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 else None
img = cv2.imread(src)
xs = [0, 334, 668, 1003, 1338, 1672]
ys = [0, 147, 286, 416, 524, 635, 733, 833, 941]
if model:
    sr = cv2.dnn_superres.DnnSuperResImpl_create(); sr.readModel(model); sr.setModel('edsr', 4)

def clean(p):
    h, w = p.shape[:2]
    g = cv2.cvtColor(p, cv2.COLOR_BGR2GRAY)
    th = cv2.morphologyEx(g, cv2.MORPH_TOPHAT, cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9)))
    b = ((th > 45) & (g > 150)).astype(np.uint8)
    b[:int(h * 0.45)] = 0; b[:, int(w * 0.95):] = 0
    # keep only rows that look like text lines (many bright strokes)
    rows = b.sum(1) > 6
    rows = np.convolve(rows, np.ones(5), 'same') > 0
    b[~rows] = 0
    if b.sum() == 0: return p, b
    yy, xx = np.nonzero(b)
    box = np.zeros_like(b); box[yy.min()-2:yy.max()+3, max(xx.min()-3,0):xx.max()+4] = 1
    m = ((th > 25) & (g > 110)).astype(np.uint8) & box
    m = cv2.dilate(m * 255, np.ones((3, 3), np.uint8), iterations=1)
    return cv2.inpaint(p, m, 3, cv2.INPAINT_TELEA), m

n = 0
for r in range(8):
    for c in range(5):
        n += 1
        p = img[ys[r]+3:ys[r+1]-2, xs[c]+3:xs[c+1]-2].copy()
        p, m = clean(p)
        cv2.imwrite(f'{out}/{n:02d}.png', sr.upsample(p) if model else p)
        print(n, flush=True)
