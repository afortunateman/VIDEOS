# Render the Strasbourg 1518 film: panels + timing.json + voice.mp3 -> MP4.
# usage: python3 render.py out.mp4 [t_start t_end]
import sys, json, math, subprocess, cv2, numpy as np

W, H, FPS = 1920, 1080, 30
AH = 816                      # active picture height (2.35:1 letterbox)
TOP = (H - AH) // 2
FADE = 0.9                    # crossfade length (s)
rng = np.random.default_rng(7)

shots = json.load(open('timing.json'))
DUR = shots[-1]['end']
out = sys.argv[1]
T0, T1 = (float(sys.argv[2]), float(sys.argv[3])) if len(sys.argv) > 3 else (0.0, DUR)

# ---- per-panel look ----------------------------------------------------
DANCE = {3, 5, 8, 9, 10, 21, 26, 27, 28}
DARK = {6, 7, 12, 13, 14, 29, 30, 31, 37}
CANDLE = {19, 22, 23, 25, 31, 32, 35}
EMBERS = {1, 5, 36, 40, 19, 32, 35}
# custom moves: (zoom_from, zoom_to, cx_from, cx_to, cy)
MOVES = {
    1: (1.36, 1.2, .63, .58, .4), 37: (1.02, 1.22, .5, .5, .42), 25: (1.05, 1.25, .55, .66, .42),
    31: (1.05, 1.28, .42, .38, .45), 33: (1.04, 1.24, .45, .5, .42), 38: (1.04, 1.18, .5, .5, .4),
    40: (1.2, 1.03, .55, .5, .45), 36: (1.15, 1.04, .4, .55, .45), 20: (1.05, 1.2, .62, .6, .4),
    6: (1.05, 1.22, .4, .45, .5), 14: (1.05, 1.22, .45, .45, .5), 2: (1.08, 1.16, .55, .42, .43),
    3: (1.06, 1.18, .5, .5, .45),
}

def grade(img, p):
    f = img.astype(np.float32) / 255
    blur = cv2.GaussianBlur(f, (0, 0), 2.0)
    f = np.clip(f + 0.6 * (f - blur), 0, 1)                      # soften upscale mush
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)[..., None]
    sat, warm = (0.8, -0.02) if p in DARK else (1.05, 0.04 if p in CANDLE else 0.02)
    f = g + (f - g) * sat
    f[..., 2] *= 1 + warm; f[..., 0] *= 1 - warm                  # BGR
    f = f * f * (3 - 2 * f) * 0.35 + f * 0.65                     # gentle S-curve
    bright = np.clip(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) - 0.62, 0, 1)[..., None] * f
    f += cv2.GaussianBlur(bright, (0, 0), 18) * 0.9               # bloom
    return np.clip(f, 0, 1).astype(np.float32)

cache = {}
def panel(p):
    if p not in cache:
        cache[p] = grade(cv2.imread(f'clean/{p:02d}.png'), p)
    return cache[p]

def ease(x):
    x = min(max(x, 0), 1)
    return 0.5 * x + 0.5 * x * x * (3 - 2 * x)

def noise(t, seed, freqs=(0.13, 0.31, 0.57)):
    return sum(math.sin(t * f * 2 * math.pi + seed * 1.7 + i * 2.1) / (i + 1) for i, f in enumerate(freqs)) / 1.83

def render_shot(k, t):
    s = shots[k]; p = s['panel']; img = panel(p)
    h, w = img.shape[:2]
    a, b = s['start'] - FADE / 2, s['end'] + FADE / 2
    u = ease((t - a) / (b - a))
    flip = k % 2
    z0, z1, x0, x1, cy = MOVES.get(p, (1.06, 1.18, .44 if flip else .56, .56 if flip else .44, .44))
    z = z0 + (z1 - z0) * u
    scale = max(W / w, AH / h) * z
    vw, vh = W / scale / w, AH / scale / h                         # visible fraction
    cx = min(max(x0 + (x1 - x0) * u, vw / 2), 1 - vw / 2)
    cyy = min(max(cy, vh / 2), 1 - vh / 2)
    # handheld drift
    dx, dy, rot = noise(t, k) * 7, noise(t, k + 9) * 5, noise(t, k + 4) * 0.25
    if p in DANCE:                                                  # restless, rhythmic sway
        beat = t * 2 * math.pi * 0.9
        dx += math.sin(beat) * 14; dy += abs(math.sin(beat)) * -6; rot += math.sin(beat + .6) * 0.9
    if p in DARK:                                                   # slow, heavy breathing
        z *= 1 + 0.012 * math.sin(t * 2 * math.pi * 0.18)
    M = cv2.getRotationMatrix2D((cx * w, cyy * h), rot, scale)
    M[0, 2] += W / 2 - cx * w + dx; M[1, 2] += AH / 2 - cyy * h + dy
    fr = cv2.warpAffine(img, M, (W, AH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    light = 1.0
    if p in CANDLE: light += 0.05 * noise(t * 3.1, k) + 0.025 * math.sin(t * 23)
    if p == 38: light += 0.08 * max(0, math.sin(t * 2 * math.pi * 1.1)) ** 6   # heartbeat pulse
    return fr * light

# ---- static overlays ---------------------------------------------------
yy, xx = np.mgrid[0:AH, 0:W].astype(np.float32)
r = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - AH * 0.45) / (AH * 0.72)) ** 2)
vig = np.clip(1.15 - r ** 2.2 * 0.75, 0.22, 1)
vig *= np.clip(1 - np.clip((yy / AH - 0.8) / 0.2, 0, 1) ** 1.5 * 0.55, 0, 1)   # darker bottom edge
vig = vig[..., None].astype(np.float32)
grain = [cv2.resize(rng.normal(0, 1, (AH // 2, W // 2)).astype(np.float32), (W, AH))[..., None] * 0.028
         for _ in range(8)]
NP = 70
P = rng.random((NP, 6)).astype(np.float32)   # x, y, size, speed, phase, brightness

def particles(t, embers):
    ov = np.zeros((AH // 2, W // 2), np.float32)
    x = (P[:, 0] * W / 2 + np.sin(t * 0.3 + P[:, 4] * 6) * 30 + t * 6) % (W / 2)
    y = (P[:, 1] * AH / 2 - t * (4 + P[:, 3] * (22 if embers else 8))) % (AH / 2)
    for i in range(NP if embers else NP // 2):
        tw = 0.5 + 0.5 * math.sin(t * (1 + P[i, 3] * 2) + P[i, 4] * 9)
        cv2.circle(ov, (int(x[i]), int(y[i])), 1 + int(P[i, 2] * 2.5), float(P[i, 5] * tw), -1, cv2.LINE_AA)
    ov = cv2.GaussianBlur(ov, (0, 0), 2.2)
    ov = cv2.resize(ov, (W, AH))[..., None]
    col = np.array([0.25, 0.6, 1.0] if embers else [0.75, 0.85, 0.95], np.float32)
    return ov * col * (0.9 if embers else 0.35)

# ---- frame loop --------------------------------------------------------
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}',
                        '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
                        '-pix_fmt', 'yuv420p', out],
                       stdin=subprocess.PIPE)
full = np.zeros((H, W, 3), np.uint8)
n0, n1 = int(T0 * FPS), int(T1 * FPS)
for n in range(n0, n1):
    t = n / FPS
    k = max(i for i, s in enumerate(shots) if s['start'] - FADE / 2 <= t or i == 0)
    fr = render_shot(k, t)
    st = shots[k]['start']
    if k > 0 and t < st + FADE / 2:                                # crossfade from previous shot
        m = ease((t - (st - FADE / 2)) / FADE)
        fr = fr * m + render_shot(k - 1, t) * (1 - m)
    p = shots[k]['panel']
    fr = fr * vig + grain[n % 8] + particles(t, p in EMBERS)
    fr *= min(1, t / 2.0, max(0, (DUR - t) / 3.0))                # open / close fades
    full[TOP:TOP + AH] = np.clip(fr * 255, 0, 255).astype(np.uint8)
    enc.stdin.write(full.tobytes())
    if n % 300 == 0: print(f'{t:.0f}s', flush=True)
enc.stdin.close(); enc.wait()
print('done', out)
