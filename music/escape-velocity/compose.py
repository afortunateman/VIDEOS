#!/usr/bin/env python3
"""
ESCAPE VELOCITY  -  an original composition for orchestra.

Written after studying "Can You Hear the Music" and applying its mechanics
(not its notes):

  1. One small cell, sequenced up a staircase and back down, never altered.
  2. The tempo is a ratchet: every climb is slower than the fall that follows,
     and every new climb starts faster than the last one did.
  3. The figure stays fixed while the harmony underneath keeps re-lighting it.
  4. Pulses in the accompaniment cut across the figure's grouping
     (3 against 2, then 4, then 6, then 8) so the ground keeps shifting.
  5. Each harmony change is an accent followed by subito piano + crescendo.
  6. The figure finally dissolves into pure pulse, and the piece stops dead
     on an unresolved chord.

What is new here: B minor, 3/4 written as 12 sixteenths, a four-note zigzag
cell that outlines a rising chain of triads, a 5-bar climb against a 3-bar
fall, a strict canon in the second violins (which yields parallel thirds on
the way up and open fifths on the way down), a mensuration canon in the
violas (the same arch at half speed), a slow rising cantus, a bass that climbs
by step for the entire piece, and a Shepard-tone celesta that never stops
rising.

Usage:  python3 compose.py [outdir]     -> writes escape_velocity.mid
"""
import math
import random
import sys
from pathlib import Path

import mido

random.seed(7)

PPQ = 480
S = PPQ // 4            # one sixteenth
BAR = 12 * S            # 3/4
CYCLES = 8              # 8-bar cycles: 5 bars up, 3 bars down
CODA_BAR = CYCLES * 8
CODA_BLOCKS = [4, 4, 4, 3]          # bars
END_BAR = CODA_BAR + sum(CODA_BLOCKS)

# tempo ratchet (quarter-note bpm): (climb, fall) for each cycle
TEMPI = [(84, 96), (88, 108), (96, 120), (104, 130),
         (112, 140), (122, 152), (134, 166), (146, 180)]
CODA_TEMPI = [176, 186, 196, 208]

# ---------------------------------------------------------------- pitch
SCALE = [0, 2, 3, 5, 7, 8, 10]      # B natural minor


def deg(n):
    """diatonic degree -> midi note, degree 0 = B3"""
    return 59 + 12 * (n // 7) + SCALE[n % 7]


# ---------------------------------------------------------------- the arch
def arch_cells():
    """24 four-note cells: 15 climbing by step, 9 falling. Returns degrees."""
    cells = []
    for i in range(15):
        bar = i // 3
        shape = ([0, 2, 1, 4], [0, 2, 1, 4], [0, 2, 1, 5],
                 [0, 2, 1, 5], [0, 2, 4, 7])[bar]      # the cell widens as it climbs
        cells.append([i + s for s in shape])
    falls = [20, 18, 16, 13, 11, 9, 6, 4, 2]
    for j, st in enumerate(falls):
        shape = [0, -2, -1, -4] if j < 8 else [0, -2, -1, -3]
        cells.append([st + s for s in shape])
    return cells


ARCH = arch_cells()
ARCH_NOTES = [n for c in ARCH for n in c]      # 96 sixteenths = 8 bars

# ---------------------------------------------------------------- harmony
# (bass pitch-class note, pulse chord) for (climb, fall) of each cycle.
HARM = {
    1: ((35, [47, 54, 59, 62]), (31, [43, 50, 54, 59])),          # Bm      | Gmaj7
    2: ((40, [52, 59, 62, 66, 67]), (42, [54, 57, 61, 64])),      # Em9     | F#m7
    3: ((43, [55, 59, 62, 66, 69]), (45, [57, 62, 64, 69])),      # Gmaj9   | Asus4
    4: ((47, [54, 59, 61, 62, 66]), (49, [49, 57, 61, 64])),      # Bm(9)   | A/C#
    5: ((50, [50, 57, 61, 64, 66]), (52, [52, 57, 59, 62, 67])),  # Dmaj9   | Em11
    6: ((54, [54, 59, 61, 64]), (55, [55, 59, 61, 62, 66])),      # F#sus   | Gmaj7#11
    7: ((57, [57, 59, 62, 64]), (59, [59, 61, 64, 66])),          # Asus2/4 | Bm11
}
CODA_HARM = [
    (40, [52, 59, 62, 66, 67]),        # Em9
    (42, [54, 59, 61, 64, 69]),        # F#m11
    (45, [57, 62, 64, 69, 71]),        # Asus
    (31, [55, 59, 62, 66, 69, 73]),    # Gmaj9#11 - unresolved, wide open
]
# cantus: one long note per harmony, climbing a twelfth over the piece
CANTUS = {2: (59, 61), 3: (62, 64), 4: (66, 69), 5: (69, 71),
          6: (73, 74), 7: (76, 78)}
PULSES_PER_BAR = {2: 2, 3: 4, 4: 6, 5: 8, 6: 6, 7: 6}   # 3:2, 3:4, 3:6, 3:8

# ---------------------------------------------------------------- channels
CH = dict(v1=0, v1s=1, v2=2, v2s=3, va=4, pulse=5, pizz=6, cb=7, vc=8,
          horn=10, brass=11, harp=12, cel=13, timp=14, piano=15, trem=6)
PROG = dict(v1=48, v1s=40, v2=48, v2s=40, va=48, pulse=48, pizz=45, cb=43,
            vc=42, horn=60, brass=61, harp=46, cel=8, timp=47, piano=0,
            trem=44)
PAN = dict(v1=38, v1s=34, v2=92, v2s=96, va=74, pulse=64, pizz=70, cb=80,
           vc=72, horn=50, brass=78, harp=30, cel=64, timp=58, piano=64,
           trem=64)
VOL = dict(v1=98, v1s=100, v2=92, v2s=90, va=100, pulse=96, pizz=92, cb=118,
           vc=108, horn=104, brass=92, harp=84, cel=96, timp=104, piano=96,
           trem=84)

events = {name: [] for name in CH}      # name -> [(tick, msg)]


def clamp(v, lo=1, hi=127):
    return max(lo, min(hi, int(round(v))))


def note(name, pitch, start, dur, vel, jitter=3):
    j = random.randint(-jitter, jitter) if jitter and start > 0 else 0
    t0 = max(0, start + j)
    ch = CH[name]
    events[name].append((t0, mido.Message('note_on', channel=ch, note=pitch,
                                          velocity=clamp(vel))))
    events[name].append((max(t0 + 1, start + dur), mido.Message(
        'note_off', channel=ch, note=pitch, velocity=0)))


def swell(name, t0, t1, a, b, step=60, curve=1.0):
    """expression (CC11) ramp"""
    n = max(1, (t1 - t0) // step)
    for i in range(n + 1):
        x = (i / n) ** curve
        events[name].append((t0 + (t1 - t0) * i // n, mido.Message(
            'control_change', channel=CH[name], control=11,
            value=clamp(a + (b - a) * x, 0))))


def fold(p, lo, hi):
    while p < lo:
        p += 12
    while p > hi:
        p -= 12
    return p


def segments():
    """yield (cycle, phase, start_tick, end_tick) for every harmony area"""
    for k in range(CYCLES):
        b = k * 8
        yield k, 0, b * BAR, (b + 5) * BAR
        yield k, 1, (b + 5) * BAR, (b + 8) * BAR


CODA_T = CODA_BAR * BAR
END_T = END_BAR * BAR

# ================================================================ 1. the figure
V1_BASE = [58, 63, 69, 75, 82, 90, 100, 110]
for k in range(CYCLES):
    for i, d in enumerate(ARCH_NOTES):
        t = k * 8 * BAR + i * S
        height = (d + 4) / 25.0                       # louder as it climbs
        acc = 9 if i % 4 == 0 else 0
        vel = V1_BASE[k] + 12 * height + acc + random.randint(-3, 3)
        note('v1', deg(d), t, int(S * 1.05), vel)
        note('v1s', deg(d), t, int(S * 0.8), vel - 2)
        # a piano shadows the figure so every sixteenth keeps its edge
        note('piano', deg(d), t, int(S * 0.9), vel - 14 - 4 * k)
        if i % 4 == 0:                                # harp picks out the triad roots
            note('harp', deg(d) - (12 if d > 9 else 0), t, S * 3,
                 vel - 4)

# ================================================================ 2. canon (2 cells behind)
DELAY = 8 * S
for k in range(2, CYCLES):
    for i, d in enumerate(ARCH_NOTES):
        t = k * 8 * BAR + i * S + DELAY
        if t >= CODA_T:
            break
        vel = V1_BASE[k] - 10 + 10 * (d + 4) / 25.0 + (7 if i % 4 == 0 else 0)
        vel += random.randint(-3, 3)
        note('v2', deg(d), t, int(S * 1.05), vel)
        note('v2s', deg(d), t, int(S * 0.8), vel - 8)

# ================================================================ 3. mensuration canon
# violas: the same arch at half speed, an octave down - one arch per two cycles
for k0 in (4, 6):
    for i, d in enumerate(ARCH_NOTES):
        t = k0 * 8 * BAR + i * 2 * S
        k = t // (8 * BAR)
        vel = V1_BASE[k] - 6 + (8 if i % 4 == 0 else 0)
        note('va', deg(d - 7), t, int(2 * S * 0.95), vel)

# ================================================================ 4. bass, pulses, cantus
for k, ph, t0, t1 in segments():
    if k == 0:
        continue                                      # cycle 1: the figure alone
    bass, chord = HARM[k][ph]
    lvl = (k - 1) / 6.0                               # 0..1 across the piece

    # --- bass: re-struck at every harmony change, then swelling
    cbp = fold(bass, 28, 40)
    note('cb', cbp, t0, t1 - t0 - 20, 60 + 50 * lvl, 0)
    note('vc', cbp + 12, t0, t1 - t0 - 20, 58 + 50 * lvl, 0)
    if k >= 2:
        note('vc', cbp + 19, t0, t1 - t0 - 20, 50 + 50 * lvl, 0)
    for nm in ('cb', 'vc'):
        swell(nm, t0, t1, 62 + 20 * lvl, 100 + 27 * lvl, curve=1.4)
    note('piano', cbp, t0, BAR * 2, 48 + 60 * lvl, 0)
    note('piano', cbp - 12 if cbp - 12 >= 24 else cbp + 12, t0, BAR * 2,
         44 + 60 * lvl, 0)
    if k >= 4:
        note('timp', fold(bass, 41, 52), t0, BAR, 70 + 45 * lvl, 0)
    if k >= 5 and ph == 1:                            # timpani roll into the next cycle
        n = 12
        for i in range(n):
            note('timp', fold(HARM[min(k + 1, 7)][0][0], 41, 52),
                 t1 - BAR + i * S, S, 34 + 60 * (i / n) ** 1.5 * (0.6 + 0.4 * lvl))

    if k < 2:
        continue

    # --- pulses cutting across the figure: accent, subito p, crescendo
    ppb = PULSES_PER_BAR[k]
    step = BAR // ppb
    n = (t1 - t0) // step
    base = 40 + 34 * lvl
    for i in range(n):
        t = t0 + i * step
        x = i / max(1, n - 1)
        vel = base + 34 if i == 0 else base + 30 * x ** 1.3
        if ppb >= 6 and i % (ppb // 2) == 0 and i:
            vel += 7                                  # keep the 2-feel alive inside
        for p in chord:
            note('pulse', p, t, int(step * 0.72), vel + random.randint(-2, 2))
        if k <= 4:
            for p in chord[:3]:
                note('pizz', p, t, step // 2, vel - 4)

    # --- cantus: horns + cellos, one rising step per harmony
    c = CANTUS[k][ph]
    note('horn', c - 12, t0, t1 - t0 - 30, 64 + 40 * lvl, 0)
    note('horn', c - 24 if k >= 5 else c - 12, t0, t1 - t0 - 30, 60 + 40 * lvl, 0)
    swell('horn', t0, t1, 58 + 18 * lvl, 104 + 23 * lvl, curve=1.6)
    if k >= 5:                                        # low brass under the last cycles
        for p in (fold(bass, 36, 47), fold(bass, 36, 47) + 7, chord[1], chord[-1]):
            note('brass', p, t0, t1 - t0 - 30, 58 + 44 * lvl, 0)
        swell('brass', t0, t1, 50 + 14 * lvl, 96 + 31 * lvl, curve=1.8)
    if k >= 6:                                        # tremolo strings halo
        for p in chord:
            note('trem', p + 12, t0, t1 - t0 - 20, 60 + 40 * lvl, 0)
        swell('trem', t0, t1, 46, 100 + 20 * lvl, curve=1.5)

# ================================================================ 5. Shepard celesta
# The cell keeps climbing forever: every note sounds in several octaves under a
# fixed loudness window, so the ear never finds the top.
def shepard(t_start, t_end, vmax0, vmax1):
    i = 0
    t = t_start
    while t < t_end:
        cell, pos = divmod(i, 4)
        d = cell + [0, 2, 1, 4][pos]
        x = (t - t_start) / (t_end - t_start)
        vmax = vmax0 + (vmax1 - vmax0) * x
        pc = deg(d % 7)                               # 59..69
        for octv in range(1, 5):
            p = pc + 12 * octv
            if 66 <= p <= 108:
                w = math.exp(-((p - 86) / 10.0) ** 2)
                if w > 0.12:
                    note('cel', p, t, S * 2, vmax * w + (6 if pos == 0 else 0), 2)
        i += 1
        t += S


shepard(6 * 8 * BAR, END_T, 50, 112)

# ================================================================ 6. coda: pure pulse
t = CODA_T
for b, bars in enumerate(CODA_BLOCKS):
    t0, t1 = t, t + bars * BAR
    bass, chord = CODA_HARM[b]
    last = b == len(CODA_BLOCKS) - 1
    cbp = fold(bass, 28, 40)
    hold = t1 - t0 - (0 if last else 20)

    # the hit
    for nm, p, v in (('cb', cbp, 118), ('vc', cbp + 12, 116), ('vc', cbp + 19, 110)):
        note(nm, p, t0, hold, v, 0)
    for nm in ('cb', 'vc'):
        swell(nm, t0, t1, 96, 127, curve=1.5)
    note('piano', cbp, t0, BAR * 2, 120, 0)
    note('piano', cbp - 12 if cbp - 12 >= 24 else cbp + 12, t0, BAR * 2, 118, 0)
    for p in chord[-3:]:
        note('piano', p + 24, t0, BAR, 108, 0)
    note('timp', fold(bass, 41, 52), t0, BAR, 122, 0)
    for p in (fold(bass, 36, 47), fold(bass, 36, 47) + 7, chord[1], chord[2], chord[-1]):
        note('brass', p, t0, hold, 108 + 4 * b, 0)
    swell('brass', t0, t1, 74, 127, curve=2.0)
    top = chord[-1] + (0 if b < 3 else 0)
    note('horn', fold(top, 55, 66), t0, hold, 112, 0)
    note('horn', fold(chord[-2], 48, 60), t0, hold, 108, 0)
    swell('horn', t0, t1, 80, 127, curve=1.8)
    for p in chord:
        note('trem', p + 12, t0, hold, 100, 0)
    swell('trem', t0, t1, 60, 127, curve=1.5)

    # eighth-note pulses: accent, subito piano, crescendo - every block climbs higher
    step = 2 * S
    n = (t1 - t0) // step
    lift = 12 if b >= 2 else 0
    for i in range(n):
        tt = t0 + i * step
        x = i / (n - 1)
        if i == 0:
            vel = 124
        else:
            vel = (58 + 6 * b) + (58 - 4 * b) * x ** (1.2 if not last else 0.9)
        dur = int(step * 0.72)
        for p in chord:
            note('pulse', p, tt, dur, vel)
            note('v2', p + 12 + lift, tt, dur, vel - 2)
        for p in chord[-4:]:
            note('v1', p + 24 + (lift if p + 24 + lift <= 98 else 0), tt, dur, vel)
        if i % 3 == 0:
            note('va', cbp + 24, tt, step * 2, vel)      # violas hammer the 2-feel
        if last or i % 6 == 0:
            note('timp', fold(bass, 41, 52), tt, step, vel - (0 if last else 22))
    t = t1

# ================================================================ write the file
mid = mido.MidiFile(type=1, ticks_per_beat=PPQ)

tt = mido.MidiTrack()
mid.tracks.append(tt)
tempo_events = [(0, mido.MetaMessage('track_name', name='Escape Velocity')),
                (0, mido.MetaMessage('time_signature', numerator=3, denominator=4)),
                (0, mido.MetaMessage('key_signature', key='Bm'))]
for k, (up, down) in enumerate(TEMPI):
    tempo_events.append((k * 8 * BAR, mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(up))))
    tempo_events.append(((k * 8 + 5) * BAR, mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(down))))
t = CODA_T
for bpm, bars in zip(CODA_TEMPI, CODA_BLOCKS):
    tempo_events.append((t, mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(bpm))))
    t += bars * BAR
tempo_events.append((END_T + 8 * BAR, mido.MetaMessage('end_of_track')))


def flush(track, evs):
    order = {'control_change': 0, 'program_change': 0, 'note_off': 1, 'note_on': 2}
    evs = sorted(evs, key=lambda e: (e[0], order.get(e[1].type, 0)))
    now = 0
    for tick, msg in evs:
        track.append(msg.copy(time=tick - now))
        now = tick


flush(tt, tempo_events)

NAMES = dict(v1='Violins I', v1s='Violin I solo', v2='Violins II',
             v2s='Violin II solo', va='Violas', pulse='Strings (pulse)',
             pizz='Pizzicato', cb='Contrabasses', vc='Cellos', horn='Horns',
             brass='Low brass', harp='Harp', cel='Celesta', timp='Timpani',
             piano='Piano', trem='Tremolo strings')
for name, ch in CH.items():
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    # the tremolo strings take over the pizzicato channel once the pizzicati
    # have finished (channel 10 is reserved for percussion in General MIDI)
    at = 6 * 8 * BAR - S if name == 'trem' else 0
    setup = [(0, mido.MetaMessage('track_name', name=NAMES[name])),
             (at, mido.Message('program_change', channel=ch, program=PROG[name])),
             (at, mido.Message('control_change', channel=ch, control=7, value=VOL[name])),
             (at, mido.Message('control_change', channel=ch, control=10, value=PAN[name])),
             (at, mido.Message('control_change', channel=ch, control=11, value=110)),
             (at, mido.Message('control_change', channel=ch, control=91, value=80))]
    # everything stops dead at the end
    cut = [(END_T, mido.Message('control_change', channel=ch, control=123, value=0))]
    evs = [(min(tk, END_T), m) for tk, m in events[name]]
    flush(tr, setup + evs + cut)

out = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).parent)
out.mkdir(parents=True, exist_ok=True)
mid.save(out / 'escape_velocity.mid')
print(f'{out / "escape_velocity.mid"}  length {mid.length:.1f}s  bars {END_BAR}')
