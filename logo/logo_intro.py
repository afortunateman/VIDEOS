# usage: python3 logo_intro.py
# 4 s motion-graphic intro for the Radio Hour Tamil logo -> radio_hour_intro.mp4
# Radio rises out of black, title writes on with a glowing edge, rule lines draw out,
# TAMIL tracks in, a light sweep crosses the chrome, short hold, fade.
import subprocess, numpy as np, cv2
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

W, H, FPS, DUR = 1920, 1080, 60, 4.0
src = cv2.imread('logo.webp').astype(np.float32) / 255
h, w = src.shape[:2]
g = cv2.cvtColor(src, cv2.COLOR_BGR2GRAY)

# ---- separate text from the grille --------------------------------------
def text_mask(y0, y1, x0, x1, thick):
    m = np.zeros((h, w), np.uint8)
    m[y0:y1, x0:x1] = (g[y0:y1, x0:x1] > 0.72).astype(np.uint8)
    return cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((thick, thick), np.uint8))   # thin grille threads drop out
title = text_mask(300, 560, 280, 1520, 5)
tamil = text_mask(570, 640, 330, 1460, 3)
ell = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
def shadowed(m, r, drop):  # text + its soft drop shadow (falls downward)
    d = cv2.dilate(m, ell(r)); out = d.copy()
    for dy in range(2, drop + 1, 2): out[dy:] |= d[:-dy]
    return out
title_r = shadowed(title, 20, 34); tamil_r = shadowed(tamil, 12, 20)
hard = title_r | tamil_r

# exact grille spacing (sub-pixel), measured on clean areas, so long copies stay in phase
def period(strip, axis):
    x = strip - strip.mean(); best = []
    for k in (8, 10, 12):
        lags = range(int(12.4 * k), int(13.8 * k) + 1)
        sc = [(x.take(range(L, x.shape[axis]), axis) * x.take(range(0, x.shape[axis] - L), axis)).mean() for L in lags]
        best.append(lags[int(np.argmax(sc))] / k)
    return float(np.median(best))
Px = period(g[265:322, 200:1560], 1); Py = period(g[270:720, 150:300], 0)
shifts = sorted({(int(round(a * Py)), 0) for a in range(-30, 31, 2) if a} | {(0, int(round(b * Px))) for b in range(-100, 101, 2) if b},
                key=lambda d: abs(d[0]) + abs(d[1]))
plate = src.copy(); todo = hard.astype(bool).copy()
for dy, dx in shifts:
    if not todo.any(): break
    ys, xs = np.nonzero(todo); ys2, xs2 = ys + dy, xs + dx
    ok = (xs2 >= 0) & (xs2 < w) & (ys2 >= 0) & (ys2 < h); ok[ok] &= ~hard[ys2[ok], xs2[ok]].astype(bool)
    plate[ys[ok], xs[ok]] = src[ys2[ok], xs2[ok]]; todo[ys[ok], xs[ok]] = False
# match local brightness to the surrounding grille (removes shadow ghosts / lighting seams)
hf = hard.astype(np.float32); inv = 1 - hf
lf = cv2.GaussianBlur(src * inv[..., None], (0, 0), 30) / (cv2.GaussianBlur(inv, (0, 0), 30)[..., None] + 1e-4)
hp = plate - cv2.GaussianBlur(plate, (0, 0), 4)
sd = lambda x, wgt: np.sqrt(cv2.GaussianBlur((x ** 2).mean(2) * wgt, (0, 0), 30) / (cv2.GaussianBlur(wgt, (0, 0), 30) + 1e-4))
hp_src = src - cv2.GaussianBlur(src, (0, 0), 4)
gain = sd(hp_src, inv) / (sd(hp, np.ones_like(inv)) + 1e-4)                     # match grille contrast too
fill = np.clip(lf + hp * np.clip(gain, 0.5, 2.5)[..., None], 0, 1)
fe = cv2.GaussianBlur(hf, (0, 0), 3)[..., None]
plate = plate * (1 - fe) + fill * fe
title_a = cv2.GaussianBlur((title_r & (1 - cv2.dilate(tamil, ell(10)))).astype(np.float32), (0, 0), 3)[..., None]
title_core = cv2.GaussianBlur(title.astype(np.float32), (0, 0), 1.5)
tamil_a = cv2.GaussianBlur(tamil_r.astype(np.float32), (0, 0), 2)[..., None]

# TAMIL row: split into rule lines (long) and letters
n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.dilate(tamil, np.ones((5, 5), np.uint8)))
parts = [st[i] for i in range(1, n) if st[i][4] > 30]
lines = [p for p in parts if p[2] > 150]; letters = [p for p in parts if p[2] <= 150]
cx_row = (min(p[0] for p in letters) + max(p[0] + p[2] for p in letters)) / 2

def ease(x, p=3):  # ease-out
    x = np.clip(x, 0, 1); return 1 - (1 - x) ** p
def smooth(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)

xx = np.arange(w, dtype=np.float32)[None, :, None]
yy = np.arange(h, dtype=np.float32)[:, None, None]
title_x0, title_x1 = 300, 1520

def compose(t):
    img = plate.copy()
    # 1. title write-on: soft wipe left->right with a bright leading edge
    u = smooth((t - 0.55) / 1.0)
    edge = title_x0 - 60 + (title_x1 - title_x0 + 120) * u
    reveal = np.clip((edge - xx) / 60, 0, 1)
    img = img * (1 - title_a * reveal) + src * title_a * reveal
    if 0 < u < 1:
        glow = np.exp(-((xx - edge) / 28) ** 2)[..., 0] * title_core * (xx[..., 0] < edge + 10)
        img += cv2.GaussianBlur(glow.astype(np.float32), (0, 0), 6)[..., None] * 1.4 * np.array([0.85, 0.95, 1.0], np.float32)
    # 2. rule lines draw outward from the word
    v = ease((t - 1.25) / 0.7)
    for x0, y0, lw, lh, _ in lines:
        inner_right = x0 + lw < cx_row
        L = lw * v
        a, b = (x0 + lw - L, x0 + lw) if inner_right else (x0, x0 + L)
        m = ((xx >= a) & (xx <= b)).astype(np.float32) * tamil_a
        m[:y0 - 14] = 0; m[y0 + lh + 34:] = 0
        img = img * (1 - m) + src * m
    # 3. TAMIL letters track in toward the centre and fade up
    s = ease((t - 1.35) / 0.9)
    for x0, y0, lw, lh, _ in letters:
        pad = 14; xa, ya, xb, yb = x0 - pad, y0 - pad, x0 + lw + pad, y0 + lh + pad + 20
        a = tamil_a[ya:yb, xa:xb] * s
        off = int(round((x0 + lw / 2 - cx_row) * 0.45 * (1 - s)))
        if xa + off < 0 or xb + off > w: continue
        reg = img[ya:yb, xa + off:xb + off]
        img[ya:yb, xa + off:xb + off] = reg * (1 - a) + src[ya:yb, xa:xb] * a
    # 4. light sweep across chrome and lettering
    p = (t - 1.85) / 0.9
    if 0 < p < 1:
        pos = -400 + (w + 800) * smooth(p)
        band = np.exp(-(((xx + 0.45 * yy) - pos) / 70) ** 2)
        lum = cv2.cvtColor(img.astype(np.float32), cv2.COLOR_BGR2GRAY)[..., None]
        img += band * np.clip(lum - 0.35, 0, 1) ** 1.5 * 0.9
    return np.clip(img, 0, 1).astype(np.float32)

# ---- frame loop ----------------------------------------------------------
base = 1560 / w
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}',
                        '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
                        '-pix_fmt', 'yuv420p', 'v.mp4'], stdin=subprocess.PIPE)
for n in range(int(DUR * FPS)):
    t = n / FPS
    e = ease(t / 1.1)
    sc = base * (1.07 - 0.07 * e + 0.018 * smooth((t - 1.1) / 2.9))        # settle, then slow push-in
    dy = 40 * (1 - e)
    M = np.float32([[sc, 0, W / 2 - w / 2 * sc], [0, sc, H / 2 - h / 2 * sc + dy]])
    fr = cv2.warpAffine(compose(t), M, (W, H), flags=cv2.INTER_AREA if sc < 1 else cv2.INTER_CUBIC)
    blur = 10 * (1 - ease(t / 0.8))
    if blur > 0.3: fr = cv2.GaussianBlur(fr, (0, 0), blur)
    fade = min(ease(t / 0.7, 2), smooth((DUR - t) / 0.4))
    enc.stdin.write((np.clip(fr * fade, 0, 1) * 255).astype(np.uint8).tobytes())
enc.stdin.close(); enc.wait()

# ---- sound: radio tuning static that locks into a warm chord ------------
SR = 48000; N = int(DUR * SR); tt = np.arange(N) / SR; rng = np.random.default_rng(1)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
out = np.zeros(N)
seg = tt < 0.8
noise = rng.normal(0, 1, N)
for i0 in range(0, int(0.8 * SR), 2400):                                 # sweeping band of static
    c = 700 + 2200 * (i0 / (0.8 * SR)); sl = slice(i0, i0 + 2400)
    out[sl] += bp(noise[max(i0 - 4800, 0):i0 + 2400], c * 0.7, c * 1.3)[-2400:] * 0.35
whistle = np.sin(2 * np.pi * np.cumsum(1900 - 1100 * np.clip(tt / 0.8, 0, 1)) / SR) * 0.12
out += whistle * seg * np.clip(tt / 0.3, 0, 1)
out *= np.where(seg, np.clip(tt / 0.15, 0, 1), np.exp(-(tt - 0.8) * 40))  # cut when it "locks"
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
d = np.clip(tt - 0.78, 0, None); on = tt >= 0.78
thump = np.sin(2 * np.pi * np.cumsum(45 + 70 * np.exp(-d * 20)) / SR) * np.exp(-d * 6) * on * 0.8
chord = sum(np.sin(2 * np.pi * hz(m) * tt) + 0.3 * np.sin(4 * np.pi * hz(m) * tt) for m in (41, 53, 57, 60, 64))
chord = chord * on * (1 - np.exp(-d * 8)) * np.exp(-d * 0.7) * 0.07
d2 = np.clip(tt - 1.9, 0, None); on2 = tt >= 1.9                           # shimmer with the light sweep
shimmer = sum(np.sin(2 * np.pi * hz(m) * tt) * np.exp(-d2 * (2 + k)) for k, m in enumerate((84, 88, 91))) * on2 * 0.05
mix = out + thump + chord + shimmer
mix *= np.clip((DUR - tt) / 0.45, 0, 1)
mix = mix / np.abs(mix).max() * 0.7
wavfile.write('a.wav', SR, (np.repeat(mix[:, None], 2, 1) * 32767).astype(np.int16))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'v.mp4', '-i', 'a.wav', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
                '-shortest', '-movflags', '+faststart', 'radio_hour_intro.mp4'], check=True)
print('done radio_hour_intro.mp4')
