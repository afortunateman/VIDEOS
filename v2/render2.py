# Vertical 9:16 retention edit: one+ shot per sentence, crops/pans/punch-ins, vintage-colorized grade.
# usage: python3 render2.py out.mp4 [t0 t1]     (video only; audio muxed in build2.sh)
import sys, json, math, glob, subprocess, cv2, numpy as np

import os
VERT = os.environ.get('FORMAT') == '9x16'
W, H, FPS = (1080, 1920, 30) if VERT else (1920, 1080, 30)
T = json.load(open('sent_timing.json'))
FILES = sorted(glob.glob('pics/*.png'))       # index = contact-sheet number
# sub-panels of the two collage images: (pic, x0, y0, x1, y1) normalized
SUB = {'12a': (12, 0, 0, .5, .5), '12b': (12, .5, 0, 1, .5), '12c': (12, 0, .5, .5, 1), '12d': (12, .5, .5, 1, 1),
       '13a': (13, 0, .1, .452, .485), '13b': (13, .457, .1, 1, .485), '13c': (13, 0, .57, 1, 1)}

# per sentence: list of shots (pic, cx, cy, zoom, move). moves: in out L R U D punch shake
SHOTS = [
 [(5, .56, .42, 1.0, 'punch')],                                   # 0  1518.
 [(5, .35, .55, 1.0, 'R')],                                       # 1  Strasbourg, between Germany & France
 [(21, .18, .5, 1.15, 'in'), (21, .5, .55, 1.0, 'punch')],         # 2  Frau Troffea walks out / dances
 [(18, .2, .4, 1.1, 'L')],                                        # 3  nobody took it seriously
 [(18, .33, .35, 1.3, 'in')],                                     # 4  strange behaviour
 [(18, .85, .5, 1.1, 'in')],                                      # 5  maybe mentally unwell
 [(18, .55, .5, 1.4, 'in')],                                      # 6  but soon it became clear
 [(21, .62, .6, 1.25, 'shake')],                                  # 7  she would not stop
 [('12a', .5, .5, 1.0, 'R'), ('12b', .5, .5, 1.0, 'in')],          # 8  morning -> evening
 [('12c', .45, .5, 1.0, 'in')],                                   # 9  into the night
 [(21, .85, .3, 1.0, 'out')],                                     # 10 next morning, same
 [(10, .68, .72, 1.45, 'in')],                                    # 11 legs began to hurt
 [(4, .5, .3, 1.5, 'in')],                                        # 12 body exhausted
 [('12d', .3, .55, 1.2, 'punch')],                                   # 13 collapsed
 [(1, .74, .58, 1.3, 'in')],                                      # 14 rested, danced again (her alone)
 [(5, .7, .4, 1.2, 'in'), (0, .45, .45, 1.0, 'shake')],           # 15 days passed / others began dancing too
 [('13a', .3, .55, 1.0, 'R')],                                # 16 first two
 [('13b', .25, .55, 1.0, 'R')],                                # 17 then ten
 [('13c', .3, .5, 1.0, 'R')],                                     # 18 the number kept growing
 [(14, .5, .45, 1.0, 'out'), (7, .5, .5, 1.0, 'L')],               # 19 hundreds, records say
 [(0, .47, .35, 1.35, 'in')],                                     # 20 nobody danced happily
 [(7, .75, .4, 1.1, 'R')],                                        # 21 not a celebration
 [(6, .5, .4, 1.2, 'shake')],                                     # 22 couldn't control bodies
 [(10, .28, .72, 1.3, 'in')],                                     # 23 fainted in the street
 [(20, .35, .7, 1.3, 'in')],                                      # 24 wounds on their feet
 [(14, .6, .55, 1.15, 'shake')],                                  # 25 dance did not stop
 [(5, .55, .4, 1.25, 'out')],                                     # 26 but understand this
 [(20, .5, .5, 1.0, 'L')],                                        # 27 city already in a bad state
 [(20, .75, .82, 1.4, 'in')],                                     # 28 famine across Europe
 [(3, .18, .5, 1.2, 'in')],                                       # 29 crops failed
 [(20, .85, .6, 1.2, 'in')],                                      # 30 food prices rose
 [(20, .18, .8, 1.3, 'R')],                                       # 31 disease and poverty
 [(1, .2, .55, 1.0, 'in')],                                       # 32 today we see a doctor
 [(21, .85, .25, 1.2, 'D')],                                      # 33 not 500 years ago
 [(19, .8, .25, 1.2, 'in')],                                      # 34 religion was everything
 [(19, .68, .4, 1.1, 'U'), (2, .65, .3, 1.0, 'in')],               # 35 God's punishment / a curse
 [(16, .12, .45, 1.0, 'R')],                                      # 36 so they read the dance that way
 [(16, .5, .2, 1.4, 'in'), (19, .82, .18, 1.5, 'out')],            # 37 Saint Vitus could curse
 [(16, .7, .6, 1.0, 'shake')],                                    # 38 the cursed dance uncontrollably
 [(14, .5, .35, 1.0, 'in')],                                      # 39 "Saint Vitus's Dance"
 [(9, .78, .25, 1.2, 'in'), (9, .45, .45, 1.1, 'in')],             # 40 officials didn't know what to do
 [(9, .75, .5, 1.1, 'L')],                                        # 41 asked the physicians
 [(15, .3, .35, 1.05, 'in')],                                     # 42 doctors thought they knew
 [(15, .25, .8, 1.3, 'in'), (6, .5, .35, 1.4, 'in')],              # 43 "too much hot blood"
 [(15, .38, .28, 1.5, 'punch')],                                  # 44 the solution?
 [(7, .4, .5, 1.0, 'punch')],                                     # 45 dance even more
 [(0, .45, .45, 1.1, 'punch')],                                   # 46 yes.
 [(4, .5, .4, 1.0, 'in'), (17, .5, .5, 1.0, 'shake')],             # 47 keep dancing until cured
 [(7, .88, .3, 1.2, 'in')],                                       # 48 officials made arrangements
 [(7, .12, .2, 1.3, 'punch')],                                    # 49 hired musicians
 [(7, .5, .55, 1.0, 'R')],                                        # 50 dance spaces set aside
 [(14, .35, .6, 1.2, 'L')],                                       # 51 even professional dancers
 [('13c', .65, .5, 1.0, 'L'), (14, .5, .5, 1.1, 'in'), (7, .5, .4, 1.0, 'out')],  # 52 a bigger dance event
 [(10, .3, .7, 1.2, 'out')],                                      # 53 the treatment failed
 [(0, .2, .6, 1.2, 'in')],                                        # 54 it got worse
 [(20, .15, .82, 1.4, 'in')],                                     # 55 collapsed from exhaustion
 [(4, .5, .32, 1.5, 'in')],                                       # 56 serious illness
 [(15, .25, .82, 1.6, 'in')],                                     # 57 some died
 [(8, .2, .6, 1.1, 'in'), (8, .4, .75, 1.3, 'R')],                 # 58 up to 15 a day, unproven
 [(9, .45, .45, 1.3, 'in')],                                      # 59 officials saw their mistake
 [(19, .1, .18, 1.5, 'punch')],                                   # 60 music stopped
 [(20, .85, .15, 1.4, 'in')],                                     # 61 public dancing banned
 [(19, .5, .5, 1.0, 'R'), (19, .45, .7, 1.2, 'in')],               # 62 taken to Saint Vitus shrine
 [(19, .7, .4, 1.3, 'U')],                                        # 63 rituals performed
 [(19, .8, .2, 1.2, 'out')],                                      # 64 prayers to lift the curse
 [(5, .55, .4, 1.0, 'out')],                                      # 65 by September it ended
 [(11, .9, .45, 1.3, 'punch')],                                   # 66 but what really happened?
 [(11, .4, .5, 1.0, 'L')],                                        # 67 still no clear answer
 [(2, .65, .3, 1.2, 'in'), (2, .4, .7, 1.0, 'R')],                 # 68 mass psychogenic illness
 [(0, .85, .35, 1.2, 'in'), (2, .3, .6, 1.1, 'L'), (14, .5, .5, 1.0, 'out')],    # 69 stress spreads as symptoms
 [(6, .5, .22, 1.6, 'in')],                                       # 70 they weren't acting
 [(0, .47, .3, 1.6, 'in')],                                       # 71 the symptoms were real
 [(8, .2, .55, 1.0, 'in')],                                       # 72 historian John Waller
 [(8, .6, .4, 1.1, 'R'), (20, .5, .6, 1.1, 'in'), (8, .85, .3, 1.2, 'in')],      # 73 famine, poverty, disease, fear
 [(3, .15, .5, 1.0, 'in'), (3, .45, .2, 1.5, 'in')],               # 74 ergot, a fungus
 [(3, .2, .45, 1.5, 'in')],                                       # 75 grows on grain
 [(3, .62, .18, 1.4, 'shake')],                                   # 76 hallucinations
 [(3, .75, .75, 1.3, 'L')],                                       # 77 doesn't fully explain it
 [(5, .5, .5, 1.0, 'in')],                                        # 78 500 years later
 [(8, .45, .8, 1.3, 'R')],                                        # 79 research continues
 [(21, .5, .6, 1.0, 'out')],                                      # 80 what interests me
 [(9, .5, .5, 1.0, 'L')],                                         # 81 the officials
 [(9, .78, .22, 1.4, 'in')],                                      # 82 they saw a problem
 [(15, .3, .35, 1.2, 'in')],                                      # 83 thought they found the cause
 [(7, .88, .3, 1.4, 'in')],                                       # 84 built a treatment
 [(14, .5, .5, 1.0, 'shake')],                                    # 85 it spiralled out of control
 [(1, .25, .55, 1.0, 'R')],                                       # 86 today we may be amazed
 [(16, .5, .2, 1.3, 'out')],                                      # 87 a saint's curse
 [(1, .3, .2, 1.3, 'in')],                                        # 88 we also invent explanations
 [(2, .3, .65, 1.1, 'L')],                                        # 89 believe without question
 [(1, .65, .55, 1.1, 'in'), (1, .5, .45, 1.0, 'out')],             # 90 future people will look at us
 [(21, .5, .55, 1.1, 'in')],                                      # 91 1518, a woman began to dance
 [(14, .5, .45, 1.0, 'out')],                                     # 92 hundreds followed
 [(11, .9, .45, 1.4, 'in')],                                      # 93 we don't know why
 [('12c', .5, .5, 1.0, 'in')],                                    # 94 not even her first name
 [(5, .55, .35, 1.2, 'out')],                                     # 95 one thing remained
 [(14, .5, .5, 1.0, 'out')],                                      # 96 a whole city couldn't stop dancing
]
assert len(SHOTS) == len(T), (len(SHOTS), len(T))

# flatten to timed shots
shots = []
for i, (sh, t) in enumerate(zip(SHOTS, T)):
    s, e = t['s'], t['e']
    cuts = [s, t['m'], e] if len(sh) == 2 else [s + (e - s) * k / len(sh) for k in range(len(sh) + 1)]
    for k, spec in enumerate(sh): shots.append((cuts[k], cuts[k + 1], spec))
shots[0] = (0.0, shots[0][1], shots[0][2])
DUR = T[-1]['e']

def grade(img):  # colorized-vintage look: soft contrast, warm highlights, muted hand-tinted color, crisp detail
    f = img.astype(np.float32) / 255
    f = np.clip(f + 0.55 * (f - cv2.GaussianBlur(f, (0, 0), 1.4)), 0, 1)
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)[..., None]
    sep = np.concatenate([g * .82, g * .95, g * 1.08], 2)          # BGR sepia
    f = (g + (f - g) * 1.15) * 0.8 + sep * 0.2
    f = 0.035 + f * 0.95                                           # lifted blacks
    f = f * f * (3 - 2 * f) * 0.3 + f * 0.7
    return np.clip(f, 0, 1).astype(np.float32)

cache = {}
def source(p):
    if p not in cache:
        if isinstance(p, str):
            q, x0, y0, x1, y1 = SUB[p]; im = cv2.imread(FILES[q]); h, w = im.shape[:2]
            im = im[int(y0 * h) + 3:int(y1 * h) - 3, int(x0 * w) + 3:int(x1 * w) - 3]
        else:
            im = cv2.imread(FILES[p])
        cache[p] = grade(im)
    return cache[p]

def ease(x): x = min(max(x, 0), 1); return x * x * (3 - 2 * x)

def frame(k, t):
    s, e, (p, cx, cy, z, mv) = shots[k]
    if not VERT: z = 1.15 if z <= 1.0 else min(1.15 + (z - 1) * 2.0, 2.1)   # wider frame -> push in more for detail shots
    img = source(p); h, w = img.shape[:2]
    u = (t - s) / max(e - s, 1e-3); ue = 0.35 * u + 0.65 * ease(u)
    zz = z; dx = dy = 0.0
    if mv == 'in': zz = z * (1 + 0.12 * ue)
    elif mv == 'out': zz = z * (1.12 - 0.12 * ue)
    elif mv == 'punch': zz = z * (1 + 0.28 * math.exp(-(t - s) / 0.09) + 0.06 * ue)
    elif mv == 'shake': zz = z * (1.04 + 0.08 * ue)
    else: zz = z * 1.06
    pr = 0.25 if isinstance(p, str) else 0.07
    if mv == 'L': dx = pr - 2 * pr * ue
    if mv == 'R': dx = -pr + 2 * pr * ue
    if mv == 'U': dy = 0.06 - 0.12 * ue
    if mv == 'D': dy = -0.06 + 0.12 * ue
    ch = min(h / zz, w * H / W)                                    # crop height in source px
    cw = ch * W / H
    px = min(max((cx + dx) * w, cw / 2), w - cw / 2); py = min(max((cy + dy) * h, ch / 2), h - ch / 2)
    amp = 7 if mv == 'shake' else 1.5                              # handheld feel (output px)
    jx = amp * (math.sin(t * 7.3 + k) + 0.5 * math.sin(t * 13.1 + 2 * k))
    jy = amp * (math.sin(t * 6.1 + 3 * k) + 0.5 * math.sin(t * 11.7 + k))
    sc = H / ch
    M = np.float32([[sc, 0, W / 2 - px * sc + jx], [0, sc, H / 2 - py * sc + jy]])
    fr = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
    if mv == 'punch' and t - s < 0.12: fr = fr * (1 + 0.6 * (1 - (t - s) / 0.12))   # flash pop
    return fr

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
vig = np.clip(1.08 - (((xx - W / 2) / W) ** 2 + ((yy - H * 0.48) / H) ** 2 * 0.8) * 1.6, 0.35, 1)[..., None].astype(np.float32)

if __name__ == '__main__':
    out = sys.argv[1]
    T0, T1 = (float(sys.argv[2]), float(sys.argv[3])) if len(sys.argv) > 3 else (0.0, DUR)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}',
                            '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
                            '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    k = 0
    for n in range(int(T0 * FPS), int(T1 * FPS)):
        t = n / FPS
        while k + 1 < len(shots) and t >= shots[k + 1][0]: k += 1
        while k > 0 and t < shots[k][0]: k -= 1
        fr = frame(k, t) * vig * min(1, max(0, (DUR + 0.3 - t) / 1.5))
        enc.stdin.write(np.clip(fr * 255, 0, 255).astype(np.uint8).tobytes())
    enc.stdin.close(); enc.wait(); print('done', out)
