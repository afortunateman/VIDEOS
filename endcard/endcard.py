# 10 s black end card: small logo on the left, Subscribe button + bell; a cursor clicks both.
# Right half is left empty for YouTube end-screen video elements.
# usage: python3 endcard.py  -> radio_hour_endcard.mp4
import math, subprocess, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
from scipy.io import wavfile

W, H, FPS, DUR = 1920, 1080, 60, 10.0
SS = 3                                                   # supersampling for crisp shapes

def ease(x, p=3): x = min(max(x, 0), 1); return 1 - (1 - x) ** p
def smooth(x): x = min(max(x, 0), 1); return x * x * (3 - 2 * x)
def back(x, s=1.9):  # ease-out with overshoot
    x = min(max(x, 0), 1) - 1; return 1 + (s + 1) * x ** 3 + s * x ** 2

def rgba(draw_fn, w, h):
    im = Image.new('RGBA', (w * SS, h * SS), (0, 0, 0, 0)); draw_fn(ImageDraw.Draw(im), SS)
    a = np.asarray(im.resize((w, h), Image.LANCZOS)).astype(np.float32) / 255
    return a[..., [2, 1, 0]], a[..., 3:]                # BGR, alpha

# ---- assets -------------------------------------------------------------
logo = cv2.imread('../logo/logo.webp').astype(np.float32) / 255
LW = 640; logo = cv2.resize(logo, (LW, int(logo.shape[0] * LW / logo.shape[1])), interpolation=cv2.INTER_AREA)
f700 = lambda s: ImageFont.truetype('fonts/roboto-latin-700-normal.woff', s)
f500 = lambda s: ImageFont.truetype('fonts/roboto-latin-500-normal.woff', s)

BW, BH = 380, 104
def button(label, fill, fg):
    def d(dr, s):
        dr.rounded_rectangle([0, 0, BW * s - 1, BH * s - 1], radius=BH * s // 2, fill=fill)
        dr.text((BW * s / 2, BH * s / 2), label, font=f700(40 * s) if label == 'SUBSCRIBE' else f500(38 * s),
                fill=fg, anchor='mm')
    return rgba(d, BW, BH)
btn_red = button('SUBSCRIBE', (229, 9, 20, 255), (255, 255, 255, 255))
btn_grey = button('SUBSCRIBED', (52, 52, 52, 255), (200, 200, 200, 255))

BS = 112                                                 # bell canvas (pivot at top centre)
def bell(filled):
    def d(dr, s):
        c = BS * s / 2; k = s
        body = [(c - 30 * k, 78 * k), (c - 30 * k, 50 * k)]
        for i in range(0, 181, 10):                     # dome
            a = math.radians(180 + i); body.append((c + 30 * k * math.cos(a), 50 * k + 30 * k * math.sin(a)))
        body += [(c + 30 * k, 78 * k), (c + 40 * k, 90 * k), (c - 40 * k, 90 * k)]
        col = (255, 255, 255, 255)
        if filled: dr.polygon(body, fill=col)
        else: dr.line(body + [body[0]], fill=col, width=7 * k, joint='curve')
        dr.ellipse([c - 7 * k, 12 * k, c + 7 * k, 24 * k], fill=col)                  # top knob
        dr.chord([c - 12 * k, 88 * k, c + 12 * k, 108 * k], 0, 180, fill=col)        # clapper
    return rgba(d, BS, BS)
bell_line, bell_full = bell(False), bell(True)

def cursor():
    pts = [(0, 0), (0, 46), (12, 35), (21, 55), (29, 51), (20, 32), (36, 32)]
    def d(dr, s):
        p = [(4 * s + x * s * 1.25, 4 * s + y * s * 1.25) for x, y in pts]
        dr.polygon(p, fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=3 * s)
    return rgba(d, 56, 80)
cur = cursor()

# ---- layout -------------------------------------------------------------
LX, LY = 140, 300                                        # logo top-left
BX, BY = 190, 300 + logo.shape[0] + 60                   # button top-left
BELLX, BELLY = BX + BW + 40, BY - 4                      # bell canvas top-left
btn_c = (BX + BW / 2, BY + BH / 2); bell_c = (BELLX + BS / 2, BELLY + BS / 2)
T_CLICK1, T_CLICK2 = 2.6, 3.9

def paste(fr, rgb, a, x, y, scale=1.0, angle=0.0, pivot=None, alpha=1.0):
    h, w = a.shape[:2]; pv = pivot or (w / 2, h / 2)
    M = cv2.getRotationMatrix2D(pv, angle, scale); M[0, 2] += x; M[1, 2] += y
    rw = cv2.warpAffine(rgb, M, (W, H), flags=cv2.INTER_LINEAR)
    aw = cv2.warpAffine(a, M, (W, H), flags=cv2.INTER_LINEAR)[..., None] * alpha
    fr *= 1 - aw; fr += rw * aw

def cursor_pos(t):
    start, p1, p2, end = (1180, 1000), (btn_c[0] + 40, btn_c[1] + 10), (bell_c[0] + 6, bell_c[1] + 12), (1100, 1150)
    def lerp(a, b, u): u = smooth(u); return (a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - math.sin(math.pi * u) * 60)
    if t < 1.6: return None
    if t < 2.5: return lerp(start, p1, (t - 1.6) / 0.9)
    if t < 3.2: return p1
    if t < 3.8: return lerp(p1, p2, (t - 3.2) / 0.6)
    if t < 5.0: return p2                                             # stays on the bell while it rings
    return None

# ---- frame loop ---------------------------------------------------------
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}',
                        '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
                        '-pix_fmt', 'yuv420p', 'v.mp4'], stdin=subprocess.PIPE)
lh, lw = logo.shape[:2]
for n in range(int(DUR * FPS)):
    t = n / FPS; fr = np.zeros((H, W, 3), np.float32)
    out = smooth((DUR - t) / 0.6)                                      # everything fades at the very end
    # logo slides in from the left
    u = ease(t / 0.9); x = LX - 70 * (1 - u)
    fr[LY:LY + lh, int(x):int(x) + lw] = logo * u * out
    # button pops in, dips on click, turns grey
    sc = back((t - 0.7) / 0.5) if t < 1.2 else 1.0
    d = t - T_CLICK1; sc *= 1 - 0.07 * math.exp(-((d - 0.05) / 0.06) ** 2) if d > -0.2 else 1
    if t > 0.7:
        rgb, a = btn_grey if t >= T_CLICK1 + 0.08 else btn_red
        paste(fr, rgb, a, BX, BY, scale=max(sc, 0.01), alpha=min(1, (t - 0.7) / 0.15) * out)
    # bell pops in, then swings and fills when clicked
    if t > 0.95:
        bsc = back((t - 0.95) / 0.5) if t < 1.45 else 1.0
        d2 = t - T_CLICK2
        ang = 28 * math.exp(-d2 * 2.6) * math.sin(d2 * 2 * math.pi * 2.6) if d2 > 0 else 0.0
        rgb, a = bell_full if d2 > 0.05 else bell_line
        paste(fr, rgb, a, BELLX, BELLY, scale=bsc, angle=ang, pivot=(BS / 2, 14), alpha=min(1, (t - 0.95) / 0.15) * out)
        if 0 < d2 < 1.2:                                                # ring waves
            for k in range(2):
                q = d2 * 1.6 - k * 0.3
                if 0 < q < 1:
                    r = int(46 + 40 * q); col = (1 - q) * 0.8 * out
                    for side in (-1, 1):
                        cv2.ellipse(fr, (int(bell_c[0]), int(bell_c[1] - 4)), (r, r), 0, 270 + side * 55 - 22, 270 + side * 55 + 22,
                                    (col, col, col), 4, cv2.LINE_AA)
    # click ripples
    for tc, c in ((T_CLICK1, btn_c), (T_CLICK2, bell_c)):
        q = (t - tc) / 0.45
        if 0 < q < 1:
            cv2.circle(fr, (int(c[0] + (40 if c is btn_c else 6)), int(c[1] + (10 if c is btn_c else 12))), int(10 + 46 * ease(q)),
                       (0.9 * (1 - q),) * 3, 3, cv2.LINE_AA)
    # cursor
    p = cursor_pos(t)
    if p:
        csc = 1.0
        for tc in (T_CLICK1, T_CLICK2): csc -= 0.18 * math.exp(-((t - tc) / 0.06) ** 2)
        fade = min(1, (t - 1.6) / 0.25, max(0, (5.0 - t) / 0.4))     # fades out in place
        csc *= 1 - 0.15 * (1 - fade) * (t > 4.6)
        paste(fr, *cur, p[0] - 6, p[1] - 6, scale=csc, pivot=(6, 6), alpha=fade)
    enc.stdin.write((np.clip(fr, 0, 1) * 255).astype(np.uint8).tobytes())
enc.stdin.close(); enc.wait()

# ---- sound: soft pad, two clicks, a bell ding ------------------------------
SR = 48000; N = int(DUR * SR); tt = np.arange(N) / SR; rng = np.random.default_rng(2)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
pad = sum(np.sin(2 * np.pi * hz(m) * tt * (1 + det)) for m in (41, 53, 57, 60, 64) for det in (-0.003, 0.003))
pad *= np.clip(tt / 1.5, 0, 1) * np.clip((DUR - tt) / 2.5, 0, 1) * 0.02
mix = pad.copy()
def add(x, t0, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(x)); mix[i:j] += x[:j - i] * g
k = np.arange(int(0.03 * SR)) / SR
click = (rng.normal(0, 1, len(k)) * np.exp(-k * 400) + np.sin(2 * np.pi * 2400 * k) * np.exp(-k * 300)) * 0.25
add(click, T_CLICK1); add(click, T_CLICK2)
d = np.arange(int(2.5 * SR)) / SR
ding = sum(a * np.sin(2 * np.pi * 1320 * r * d) * np.exp(-d * dec) for r, a, dec in ((1, 1, 2.2), (2.76, 0.45, 4), (5.4, 0.25, 7), (8.9, 0.1, 10)))
add(ding * 0.12, T_CLICK2 + 0.04); add(ding * 0.06, T_CLICK2 + 0.42)
pop = np.sin(2 * np.pi * np.cumsum(500 + 700 * (np.arange(int(0.12 * SR)) / SR / 0.12)) / SR) * np.exp(-np.arange(int(0.12 * SR)) / SR * 30) * 0.08
add(pop, 0.72); add(pop * 0.8, 0.97)
mix = mix / np.abs(mix).max() * 0.6
wavfile.write('a.wav', SR, (np.repeat(mix[:, None], 2, 1) * 32767).astype(np.int16))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'v.mp4', '-i', 'a.wav', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
                '-shortest', '-movflags', '+faststart', 'radio_hour_endcard.mp4'], check=True)
print('done radio_hour_endcard.mp4')
