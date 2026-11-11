#!/usr/bin/env python3
"""
EVERY HORIZON  -  an original composition for orchestra, in 7/8.

The idea: an eight-bar theme that never comes home. Its last note is left
hanging, and each time that hanging note turns out to be the ground of a new
key a major third higher (Db -> F -> A -> Db). The horizon you were looking at
becomes the floor you are standing on, three times, until the circle closes.

Form
  Intro     a haze on A; a three-note question (up a fifth, up a step)
  I         Db   theme in the solo cello over harp
  II        F    theme in the violins, horn countermelody, running violas
  III       A    fugato on the head of the theme over a falling bass,
                 all voices converging on a single C sharp
  IV        Db   C sharp is D flat: the theme at half speed in full orchestra,
                 and the only real cadence in the piece
  Coda      the question again, now ending on the raised fourth, unanswered

Usage:  python3 compose.py [outdir]     -> writes every_horizon.mid
"""
import random
import sys
from pathlib import Path

import mido

random.seed(11)

PPQ = 480
E = PPQ // 2            # eighth
X = E // 2              # sixteenth
BAR = 7 * E             # 7/8, felt 2+2+3

INTRO, S1, S2, S3, S4, ARR, CODA, END = 0, 6, 14, 22, 32, 48, 51, 57

# ------------------------------------------------------------ the theme (in C)
THEME = [
    [(67, 4), (74, 3)],                 # up a fifth: the question
    [(78, 2), (76, 2), (74, 3)],        # raised fourth, falling back
    [(72, 4), (79, 3)],                 # the question, a fourth higher
    [(83, 2), (81, 2), (79, 3)],
    [(84, 4), (87, 3)],                 # the floor drops away (bVI)
    [(86, 2), (84, 2), (82, 3)],
    [(81, 4), (84, 3)],
    [(88, 7)],                          # left hanging: the next key's ground
]
COUNTER = [
    [(64, 7)], [(62, 4), (66, 3)], [(64, 7)], [(62, 4), (59, 3)],
    [(60, 4), (63, 3)], [(62, 4), (65, 3)], [(60, 7)], [(57, 4), (59, 3)],
]
# one harmony per bar: five-note voicing, lowest note is the bass
VOICING = [
    [48, 55, 62, 64, 67],   # C add9
    [48, 57, 62, 66, 69],   # D/C
    [45, 55, 59, 60, 64],   # Am9
    [40, 55, 59, 62, 64],   # Em7
    [44, 55, 60, 63, 67],   # Abmaj7
    [46, 53, 60, 62, 65],   # Bb add9
    [45, 53, 60, 65, 69],   # F/A
    [41, 57, 59, 60, 64],   # Fmaj7#11
]
HARP_FIG = [0, 2, 3, 2, 4, 3, 2]                         # eighths, 2+2+3
RUN_FIG = [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 3, 2, 1]     # sixteenths

# fugato harmony in A: (root, third, fifth, ninth) pitch classes + voicing
FUG = [
    ((9, 1, 4, 11), [45, 52, 59, 61, 64]),   # A
    ((4, 8, 11, 6), [44, 52, 59, 64, 66]),   # E/G#
    ((6, 9, 1, 8),  [42, 52, 57, 61, 64]),   # F#m7
    ((9, 1, 4, 11), [40, 52, 57, 59, 61]),   # A/E
    ((2, 6, 9, 4),  [38, 54, 57, 61, 64]),   # Dmaj7
    ((9, 1, 4, 11), [37, 52, 57, 61, 64]),   # A/C#
    ((11, 2, 6, 1), [35, 54, 57, 61, 62]),   # Bm7
    ((4, 8, 11, 6), [40, 52, 56, 59, 66]),   # E
    ((6, 9, 1, 8),  [37, 54, 57, 61, 66]),   # F#m/C#
]

# ------------------------------------------------------------ orchestra
CH = dict(vln1=0, hz=1, vln2=2, va=3, vc=4, cb=5, pad=6, horn=7, brass=8,
          flute=10, harp=11, cel=12, timp=13, piano=14, pizz=15, trem=15)
PROG = dict(vln1=48, hz=48, vln2=48, va=48, vc=42, cb=43, pad=49, horn=60,
            brass=61, flute=73, harp=46, cel=8, timp=47, piano=0, pizz=45,
            trem=44)
PAN = dict(vln1=36, hz=64, vln2=52, va=82, vc=92, cb=86, pad=64, horn=48,
           brass=80, flute=58, harp=28, cel=70, timp=60, piano=64, pizz=88,
           trem=64)
VOL = dict(vln1=112, hz=100, vln2=100, va=98, vc=116, cb=116, pad=88,
           horn=106, brass=100, flute=92, harp=104, cel=100, timp=106,
           piano=100, pizz=104, trem=92)
NAMES = dict(vln1='Violins I', hz='Violins (horizon note)', vln2='Violins II',
             va='Violas', vc='Cellos', cb='Contrabasses', pad='Strings (pad)',
             horn='Horns', brass='Brass', flute='Flute', harp='Harp',
             cel='Celesta', timp='Timpani', piano='Piano', pizz='Pizzicato',
             trem='Tremolo strings')
events = {n: [] for n in CH}


def clamp(v, lo=1, hi=127):
    return max(lo, min(hi, int(round(v))))


def note(name, pitch, start, dur, vel, jit=4):
    t0 = max(0, start + (random.randint(-jit, jit) if jit else 0))
    ch = CH[name]
    events[name].append((t0, mido.Message('note_on', channel=ch, note=pitch, velocity=clamp(vel))))
    events[name].append((max(t0 + 10, start + dur), mido.Message('note_off', channel=ch, note=pitch, velocity=0)))


def expr(name, t0, t1, a, b, curve=1.0, step=60):
    n = max(1, (t1 - t0) // step)
    for i in range(n + 1):
        v = a + (b - a) * (i / n) ** curve
        events[name].append((t0 + (t1 - t0) * i // n, mido.Message(
            'control_change', channel=CH[name], control=11, value=clamp(v, 0))))


def fold(p, lo, hi):
    while p < lo:
        p += 12
    while p > hi:
        p -= 12
    return p


def nearest(pc, target):
    below = target - ((target - pc) % 12)
    return below if target - below <= 5 else below + 12


def line(name, bars, start_bar, tr, vel, scale=1, legato=0.97, shape=None):
    """play a list of bars [(pitch, eighths), ...]"""
    t = start_bar * BAR
    total = sum(d for b in bars for _, d in b)
    done = 0
    for b in bars:
        for p, d in b:
            v = vel + (shape(done / total) if shape else 0)
            note(name, p + tr, t, int(d * E * scale * legato), v + random.randint(-2, 2))
            t += d * E * scale
            done += d


def harp_bar(name, voicing, tr, bar, vel, lo=34, octave=0, fade=0):
    v = [fold(voicing[0] + tr, lo, lo + 11)] + [p + tr + octave for p in voicing[1:]]
    for i, idx in enumerate(HARP_FIG):
        acc = 10 if i == 0 else (4 if i in (2, 4) else 0)
        note(name, v[idx], bar * BAR + i * E, E * 2, vel + acc - fade * i)


def run_bar(name, voicing, tr, bar, vel, octave=0):
    t = [p + tr + octave for p in voicing[1:]]
    for i, idx in enumerate(RUN_FIG):
        acc = 8 if i in (0, 4, 8) else 0
        note(name, t[idx], bar * BAR + i * X, int(X * 0.95), vel + acc + random.randint(-3, 3), 3)


def bass_of(voicing, tr):
    return fold(voicing[0] + tr, 28, 39)


arch = lambda x: 10 * (1 - abs(2 * x - 1.15))        # phrases swell toward 5/8ths

# ============================================================ INTRO: a haze on A
t0 = INTRO * BAR
note('hz', 85, t0, 8 * BAR, 54, 0)                   # C sharp: the first horizon
expr('hz', t0, t0 + 5 * BAR, 52, 76)
expr('hz', t0 + 5 * BAR, t0 + 6 * BAR, 76, 100)
expr('hz', S1 * BAR, (S1 + 2) * BAR, 100, 0, curve=0.7)
question = [
    (0, [(0, 64), (2, 71)]),
    (1, [(0, 64), (2, 71), (4, 73)]),
    (2, [(1, 69), (3, 76), (5, 78)]),
    (3, [(1, 73), (3, 80), (5, 81)]),
    (4, [(0, 69), (2, 76), (4, 78), (5, 80)]),
]
for bar, ns in question:
    for i, (e, p) in enumerate(ns):
        note('piano', p, t0 + bar * BAR + e * E, 5 * E, 74 + 5 * i + 3 * bar)
        if bar >= 2:
            note('cel', p + 12, t0 + bar * BAR + e * E, 4 * E, 58 + 4 * i)
for bar, (lo, hi) in ((2, (45, 52)), (3, (42, 49)), (4, (38, 45)), (5, (37, 49))):
    note('vc', hi, t0 + bar * BAR, BAR - 20, 52, 0)
    note('cb', lo, t0 + bar * BAR, BAR - 20, 50, 0)
    note('piano', lo, t0 + bar * BAR, BAR, 46, 0)
for nm in ('vc', 'cb'):
    expr(nm, t0 + 2 * BAR, t0 + 6 * BAR, 50, 92)
note('pad', 57, t0 + 2 * BAR, 4 * BAR - 20, 50, 0)
note('pad', 64, t0 + 2 * BAR, 4 * BAR - 20, 50, 0)
expr('pad', t0 + 2 * BAR, t0 + 6 * BAR, 30, 84)
for i, p in enumerate([61, 64, 69, 71, 73, 76, 81]):  # the door opens
    note('harp', p, t0 + 5 * BAR + i * E, 3 * E, 52 + 7 * i)
    note('piano', p, t0 + 5 * BAR + i * E, 2 * E, 46 + 7 * i)

# ============================================================ I: Db, solo cello
TR = 1
events['vc'].append((S1 * BAR - 5, mido.Message('control_change', channel=CH['vc'], control=11, value=118)))
events['cb'].append((S1 * BAR - 5, mido.Message('control_change', channel=CH['cb'], control=11, value=100)))
line('vc', THEME, S1, TR - 12, 88, shape=arch)
line('horn', THEME[4:7], S1 + 4, TR - 12, 58)
expr('horn', (S1 + 4) * BAR, (S1 + 7) * BAR, 70, 100)
expr('pad', S1 * BAR, (S1 + 8) * BAR, 60, 96)
for b in range(8):
    bar = S1 + b
    v = VOICING[b]
    harp_bar('harp', v, TR, bar, 66 + 2 * b)
    note('pizz', bass_of(v, TR), bar * BAR, E * 2, 74 + 2 * b, 0)
    note('pizz', bass_of(v, TR) + 12, bar * BAR + 4 * E, E * 2, 60 + 2 * b, 0)
    if b >= 2:
        for p in v[1:4]:
            note('pad', p + TR, bar * BAR, BAR - 20, 52, 0)
# the hanging F: next key's ground
note('hz', 89, (S1 + 7) * BAR, 3 * BAR, 70, 0)
note('flute', 89, (S1 + 7) * BAR, 3 * BAR, 62, 0)
for nm in ('hz', 'flute'):
    expr(nm, (S1 + 7) * BAR, S2 * BAR, 20, 108, curve=1.4)
    expr(nm, S2 * BAR, (S2 + 2) * BAR, 108, 0, curve=0.7)

# ============================================================ II: F, violins + horn + violas
TR = 5
line('vln1', THEME, S2, TR, 96, shape=arch)
line('flute', THEME[2:7], S2 + 2, TR, 70)
events['flute'].append(((S2 + 2) * BAR, mido.Message('control_change', channel=CH['flute'], control=11, value=104)))
line('horn', COUNTER, S2, TR, 84)
expr('horn', S2 * BAR, (S2 + 8) * BAR, 96, 118)
expr('pad', S2 * BAR, (S2 + 8) * BAR, 84, 108)
for b in range(8):
    bar = S2 + b
    v = VOICING[b]
    harp_bar('harp', v, TR, bar, 72 + 2 * b)
    run_bar('va', v, TR, bar, 62 + 3 * b)
    bs = bass_of(v, TR)
    note('cb', bs, bar * BAR, BAR - 20, 84, 0)
    note('vc', bs + 12, bar * BAR, BAR - 20, 76, 0)
    note('pizz', bs + 12, bar * BAR, E * 2, 84, 0)
    note('pizz', bs + 19, bar * BAR + 4 * E, E * 2, 72, 0)
    for p in v[1:4]:
        note('pad', p + TR, bar * BAR, BAR - 20, 60, 0)
# the hanging A
note('hz', 93, (S2 + 7) * BAR, 3 * BAR, 76, 0)
note('hz', 81, (S2 + 7) * BAR, 3 * BAR, 70, 0)
expr('hz', (S2 + 7) * BAR, S3 * BAR, 30, 116, curve=1.4)
expr('hz', S3 * BAR, (S3 + 2) * BAR, 116, 0, curve=0.7)

# ============================================================ III: A, fugato
# The head of the theme, restated as "fifth up to ninth | third, ninth, root" of
# whatever chord is sounding, entering one bar apart while the bass falls.
def head_voice(name, base, entry, octave=0):
    prev = None
    for b in range(entry, 8):
        (r, th, f, n), _ = FUG[b]
        lvl = 80 + 4 * b
        t = (S3 + b) * BAR
        if (b - entry) % 2 == 0:
            p = nearest(f, base)
            seq = [(p, 4), (p + 7, 3)]
        else:
            top = nearest(th, prev + 3)
            mid = top - ((top - n) % 12)
            low = mid - ((mid - r) % 12)
            seq = [(top, 2), (mid, 2), (low, 3)]
        for p, d in seq:
            note(name, p + octave, t, int(d * E * 0.96), lvl + (8 if b == entry else 0))
            t += d * E
        prev = seq[-1][0]


head_voice('va', 62, 0)
head_voice('vln2', 68, 1)
head_voice('vc', 62, 2, -12)
head_voice('vln1', 68, 3, 12)
events['vc'].append((S3 * BAR, mido.Message('control_change', channel=CH['vc'], control=11, value=120)))
for b in range(9):
    bar = S3 + b
    (r, th, f, n), v = FUG[b]
    harp_bar('harp', v, 0, bar, 78 + 3 * b)
    harp_bar('piano', v, 0, bar, 54 + 4 * b, octave=12)
    bs = fold(v[0], 28, 39)
    note('cb', bs, bar * BAR, BAR - 20, 88 + 3 * b, 0)
    note('piano', bs, bar * BAR, BAR, 70 + 4 * b, 0)
    if b < 2 or b == 8:
        note('vc', bs + 12, bar * BAR, BAR - 20, 84, 0)
    note('horn', nearest(th, 61), bar * BAR, BAR - 20, 76 + 3 * b, 0)
    note('horn', nearest(f, 54), bar * BAR, BAR - 20, 72 + 3 * b, 0)
    for p in v[1:4]:
        note('pad', p, bar * BAR, BAR - 20, 62 + 3 * b, 0)
    if b >= 4:
        note('timp', fold(v[0], 41, 52), bar * BAR, BAR, 60 + 7 * b, 0)
expr('cb', S3 * BAR, (S3 + 10) * BAR, 92, 127)
expr('horn', S3 * BAR, (S3 + 10) * BAR, 88, 127)
expr('pad', S3 * BAR, (S3 + 9) * BAR, 96, 124)
# bar 9: every voice asks the question at once (C# up to G#) ...
t = (S3 + 8) * BAR
for nm, p in (('vln1', 85), ('vln2', 73), ('va', 61), ('vc', 49), ('brass', 49), ('flute', 85)):
    note(nm, p, t, int(4 * E * 0.96), 110)
    note(nm, p + 7, t + 4 * E, int(3 * E * 0.96), 114)
# ... bar 10: and lands on one bare C sharp, then a breath
t = (S3 + 9) * BAR
for nm, ps in (('vln1', (85, 97)), ('vln2', (73, 85)), ('va', (61, 73)), ('vc', (37, 49)),
               ('cb', (37,)), ('horn', (49, 61)), ('brass', (37, 49, 61)), ('trem', (61, 73, 85)),
               ('piano', (25, 37))):
    for p in ps:
        note(nm, p, t, 6 * E - 30, 112, 0)
for nm in ('vln1', 'vln2', 'va', 'vc', 'brass', 'trem'):
    expr(nm, t, t + 6 * E, 92, 127, curve=1.5)
for i in range(12):
    note('timp', 49, t + i * X, X, 52 + 6 * i)

# ============================================================ IV: Db, the theme at half speed
TR = 1
for nm in ('vln1', 'vln2', 'va', 'vc', 'cb', 'horn', 'brass', 'flute', 'trem'):
    events[nm].append((S4 * BAR - 4, mido.Message('control_change', channel=CH[nm], control=11, value=124)))
line('vln1', THEME, S4, TR, 116, scale=2)
line('flute', THEME, S4, TR, 104, scale=2)
line('brass', THEME, S4, TR - 12, 112, scale=2)
line('horn', COUNTER, S4, TR, 110, scale=2)
line('brass', THEME[4:], S4 + 8, TR - 24, 112, scale=2)     # the floor drops: add the low octave
for b in range(8):
    v = VOICING[b]
    bs = bass_of(v, TR)
    t = (S4 + 2 * b) * BAR
    note('cb', bs, t, 2 * BAR - 20, 116, 0)
    note('vc', bs + 12, t, 2 * BAR - 20, 112, 0)
    note('piano', bs, t, 2 * BAR, 112, 0)
    note('piano', bs - 12 if bs - 12 >= 24 else bs + 12, t, 2 * BAR, 108, 0)
    note('timp', fold(bs, 41, 52), t, BAR, 112, 0)
    nxt = bass_of(VOICING[b + 1], TR) if b < 7 else 37
    for i in range(6):                                  # roll into the next harmony
        note('timp', fold(nxt, 41, 52), t + 2 * BAR - (6 - i) * X, X, 62 + 9 * i)
    for p in v[1:]:
        note('pad', p + TR, t, 2 * BAR - 20, 96, 0)
        note('trem', p + TR + 12, t, 2 * BAR - 20, 88, 0)
    for k in range(2):
        bar = S4 + 2 * b + k
        harp_bar('harp', v, TR, bar, 100)
        harp_bar('piano', v, TR, bar, 84, octave=12)
        run_bar('va', v, TR, bar, 96)
        run_bar('vln2', v, TR, bar, 98, octave=12)
expr('pad', S4 * BAR, ARR * BAR, 110, 127)
expr('trem', S4 * BAR, ARR * BAR, 100, 127)

# ---- the arrival: the one cadence in the piece (Db add9)
t = ARR * BAR
L = 3 * BAR
for nm, ps, v in (('cb', (25, 37), 120), ('vc', (37, 44), 116), ('brass', (49, 56, 61, 65), 114),
                  ('horn', (56, 65), 112), ('vln2', (75, 80), 112), ('va', (63, 68), 108),
                  ('vln1', (77, 89), 118), ('trem', (68, 73, 77), 100), ('pad', (49, 56, 63, 65), 100),
                  ('piano', (25, 37, 49), 120)):
    for p in ps:
        note(nm, p, t, L - 30, v, 0)
    if nm != 'piano':
        expr(nm, t, t + L, 127, 34, curve=0.8)
note('timp', 49, t, 2 * BAR, 122, 0)
ARRV = [49, 56, 63, 65, 68]
for k in range(3):
    harp_bar('harp', ARRV, 0, ARR + k, 100 - 16 * k, fade=2)
    harp_bar('cel', ARRV, 0, ARR + k, 86 - 12 * k, lo=73, octave=24, fade=2)

# ============================================================ CODA: the question, unanswered
t = CODA * BAR
note('hz', 89, t - E, 5 * BAR, 60, 0)
expr('hz', t - E, t + BAR, 20, 66)
expr('hz', t + BAR, t + 5 * BAR - E, 66, 0, curve=1.3)
for nm, ps in (('pad', (49, 56, 63)), ('cb', (25, 37))):
    events[nm].append((t - 2, mido.Message('control_change', channel=CH[nm], control=11, value=60)))
    for p in ps:
        note(nm, p, t, 4 * BAR, 50, 0)
    expr(nm, t, t + 4 * BAR, 60, 0, curve=1.5)
coda_q = [
    (0, [(0, 68), (2, 75)]),
    (1, [(0, 68), (2, 75), (4, 77)]),
    (2, [(1, 73), (3, 80), (5, 82)]),
    (3, [(0, 68), (3, 75), (6, 79)]),      # ...and the last word is G natural
]
for bar, ns in coda_q:
    for i, (e, p) in enumerate(ns):
        note('piano', p, t + bar * BAR + e * E, 7 * E, 72 - 4 * bar + 3 * i)
        note('cel', p + 12, t + bar * BAR + e * E, 5 * E, 60 - 3 * bar + 3 * i)
note('cel', 91, t + 4 * BAR + 3 * E, 6 * E, 64)
note('cel', 79, t + 4 * BAR + 3 * E, 6 * E, 48)

# ============================================================ tempo map
def bpm8(e):                      # eighths per minute -> midi tempo
    return mido.bpm2tempo(e / 2)


tempo = [(0, 120)]
for i in range(8):                                         # the door opens
    tempo.append((5 * BAR + i * (BAR // 8), 120 + (200 - 120) * ((i + 1) / 8) ** 1.5))
tempo += [(S1 * BAR, 200), (S2 * BAR, 208), (S3 * BAR, 216),
          ((S3 + 9) * BAR, 204), (S4 * BAR, 196), (ARR * BAR, 190)]
for i in range(12):                                        # the arrival settles
    tempo.append((ARR * BAR + i * (BAR // 4), 190 - (190 - 126) * ((i + 1) / 12)))
for i in range(8):
    tempo.append(((CODA + 2) * BAR + i * (BAR // 2), 126 - 4 * (i + 1)))

mid = mido.MidiFile(type=1, ticks_per_beat=PPQ)


def flush(track, evs):
    order = {'program_change': 0, 'control_change': 1, 'note_off': 2, 'note_on': 3}
    now = 0
    for tick, msg in sorted(evs, key=lambda e: (e[0], order.get(e[1].type, 0))):
        track.append(msg.copy(time=tick - now))
        now = tick


END_T = END * BAR
tr0 = mido.MidiTrack()
mid.tracks.append(tr0)
flush(tr0, [(0, mido.MetaMessage('track_name', name='Every Horizon')),
            (0, mido.MetaMessage('time_signature', numerator=7, denominator=8)),
            (0, mido.MetaMessage('key_signature', key='Db')),
            (END_T, mido.MetaMessage('end_of_track'))]
      + [(tk, mido.MetaMessage('set_tempo', tempo=bpm8(e))) for tk, e in tempo])

for name, ch in CH.items():
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    # tremolo strings take over the pizzicato channel once the pizzicati are done
    at = (S3 + 9) * BAR - E if name == 'trem' else 0
    setup = [(0, mido.MetaMessage('track_name', name=NAMES[name])),
             (at, mido.Message('program_change', channel=ch, program=PROG[name])),
             (at, mido.Message('control_change', channel=ch, control=7, value=VOL[name])),
             (at, mido.Message('control_change', channel=ch, control=10, value=PAN[name])),
             (at, mido.Message('control_change', channel=ch, control=11, value=110)),
             (at, mido.Message('control_change', channel=ch, control=91, value=90))]
    flush(tr, setup + events[name])

out = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).parent)
out.mkdir(parents=True, exist_ok=True)
mid.save(out / 'every_horizon.mid')
print(f'{out / "every_horizon.mid"}  length {mid.length:.1f}s  bars {END}')
