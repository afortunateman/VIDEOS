# Text-on-black intro (one sentence at a time) + soft drone -> intro_v.mp4, intro.wav
# usage: python3 intro.py   (fonts/: Noto Serif Tamil, OFL)
import os, subprocess, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
from scipy.io import wavfile

LINES = [
    "1518-ஆம் ஆண்டு, Strasbourg நகரத்தில் ஒரு பெண் திடீரெனக் கட்டுப்பாடில்லாமல் நடனமாடத் தொடங்கினார்.",
    "அவளால் நிறுத்தவே முடியவில்லை.",
    "நாட்கள் கடந்தும் அவள் தொடர்ந்து நடனமாடினாள்.",
    "ஆனால் அதைவிட விசித்திரமானது, அவளைப் பார்த்த மற்றவர்களும் ஒவ்வொருவராகக் கட்டுப்பாடில்லாமல் நடனமாடத் தொடங்கியதுதான்.",
    "விரைவில், ஒரு நகரமே இந்த விசித்திரமான நடனத்தில் சிக்கிக்கொண்டது.",
]
HOLD = [5.4, 2.9, 3.5, 6.6, 4.6]          # seconds on screen (reading time)
FIN, FOUT, GAP, LEAD, TAIL = 0.7, 0.6, 0.35, 1.0, 0.9
VERT = os.environ.get('FORMAT') == '9x16'
W, H, FPS = (1080, 1920, 30) if VERT else (1920, 1080, 30)
SIZE = 46 if VERT else 60
ta = ImageFont.truetype('fonts/noto-serif-tamil-tamil-500-normal.woff', SIZE, layout_engine=ImageFont.Layout.RAQM)
la = ImageFont.truetype('fonts/noto-serif-tamil-latin-500-normal.woff', SIZE, layout_engine=ImageFont.Layout.RAQM)

def runs(s):  # split into (text, font) runs: Tamil letters vs digits/Latin/punctuation
    out = []
    for ch in s:
        f = ta if '\u0b80' <= ch <= '\u0bff' or ch in '\u200c\u200d' else la
        if out and (out[-1][1] is f or ch == ' '): out[-1][0] += ch
        else: out.append([ch, f])
    return out
MAXW = int(W * 0.78)

def card(text):
    d = ImageDraw.Draw(Image.new('L', (8, 8)))
    width = lambda t: sum(d.textlength(r, font=f) for r, f in runs(t))
    rows, cur = [], ''
    for word in text.split():
        t = (cur + ' ' + word).strip()
        if width(t) > MAXW and cur: rows.append(cur); cur = word
        else: cur = t
    rows.append(cur)
    lh = int(SIZE * 1.75)
    im = Image.new('L', (W, lh * len(rows) + 40), 0); dr = ImageDraw.Draw(im)
    for i, r in enumerate(rows):
        x = (W - width(r)) / 2; y = 20 + i * lh + lh * 0.68
        for txt, f in runs(r):
            dr.text((x, y), txt, font=f, fill=255, anchor='ls'); x += dr.textlength(txt, font=f)
    a = np.asarray(im, np.float32) / 255
    glow = cv2.GaussianBlur(a, (0, 0), 9) * 0.35
    col = np.array([0.80, 0.89, 0.94], np.float32)               # warm cream (BGR)
    return np.clip(a[..., None] * col + glow[..., None] * np.array([0.25, 0.45, 0.7], np.float32), 0, 1)

cards = [card(t) for t in LINES]
starts, t = [], LEAD
for h in HOLD: starts.append(t); t += h + GAP
DUR = t - GAP + TAIL

enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}',
                        '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
                        '-pix_fmt', 'yuv420p', 'intro_v.mp4'], stdin=subprocess.PIPE)
for n in range(int(DUR * FPS)):
    t = n / FPS; fr = np.zeros((H, W, 3), np.float32)
    for c, s, h in zip(cards, starts, HOLD):
        if s <= t < s + h:
            a = min(1, (t - s) / FIN, (s + h - t) / FOUT)
            u = (t - s) / h
            z = 1.0 + 0.025 * u                                      # slow drift toward camera
            ch, cw = c.shape[:2]
            img = cv2.resize(c, (int(cw * z), int(ch * z)), interpolation=cv2.INTER_AREA)
            ih, iw = img.shape[:2]; y0 = (H - ih) // 2 - int(6 * u); x0 = (W - iw) // 2
            fr[y0:y0 + ih, max(x0, 0):max(x0, 0) + min(iw, W)] = img[:, max(-x0, 0):max(-x0, 0) + min(iw, W)] * a * a
    enc.stdin.write((fr * 255).astype(np.uint8).tobytes())
enc.stdin.close(); enc.wait()

# ---- soundtrack: reuse instruments from audio2.py ------------------------
src = open('audio2.py').read()
exec(src[:src.index('# A: opening')])                                # defines SR, drone, pad, heartbeat, riser, ...
N = int(DUR * SR); buf = np.zeros(N, np.float32)
def add(x, t, g=1.0):
    i = int(t * SR); j = min(i + len(x), N); buf[i:j] += x[:j - i] * g
add(drone(hz(38), DUR + 1), 0, 1.0); add(drone(hz(45), DUR + 1), 0, 0.45)
add(pad([50, 53, 57], 12), 0.5, 0.8); add(pad([46, 50, 53], DUR - 11), 11, 0.8)
for k in range(3): add(heartbeat(), starts[3] + 0.4 + k * 1.1, 0.35)          # "others began dancing"
add(riser(2.2), DUR - 2.2, 0.8)
buf *= env(N, 1.5, 0.05)
buf *= 0.2 / (np.abs(buf).max() + 1e-9)
wavfile.write('intro.wav', SR, (buf * 32767).astype(np.int16))
print('intro', round(DUR, 2), 's')
