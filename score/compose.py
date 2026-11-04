#!/usr/bin/env python3
"""
"THE CLIMB" — original score, composed to picture and voiceover (161.5 s).

One theme runs through every section: the CLIMB MOTIF, four rising steps
(scale degrees 5-1-2-3, e.g. A-D-E-F). It is heard as wonder, as resolve,
broken in exhaustion, inverted in grief, completed in major (F#) when the
voice from above speaks, and finally carried to the summit at the sun.

Harmonic signature: D minor, the loop Dm-Bb-F-C, and the bVI-bVII-I lift
(Bb-C-D) that only fully resolves at the sun.

Run:  python3 score/compose.py <input_video.mp4>
Needs: fluidsynth + FluidR3_GM.sf2, numpy, scipy, soundfile, pretty_midi, ffmpeg.
"""
import os, sys, subprocess
import numpy as np, soundfile as sf, pretty_midi as pm
from scipy.signal import butter, sosfilt, fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "build"); os.makedirs(OUT, exist_ok=True)
SR = 44100; DUR = 162.0; N = int(SR * DUR)
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
rng = np.random.default_rng(11)

# ---------------------------------------------------------------- helpers
NN = {"C":0,"C#":1,"Db":1,"D":2,"D#":3,"Eb":3,"E":4,"F":5,"F#":6,"Gb":6,
      "G":7,"G#":8,"Ab":8,"A":9,"A#":10,"Bb":10,"B":11}
def P(s):
    if isinstance(s, (int, np.integer)): return int(s)
    name = s[:2] if len(s) > 2 and s[1] in "#b" else s[:1]
    return 12 * (int(s[len(name):]) + 1) + NN[name]
def hz(p): return 440.0 * 2 ** ((P(p) - 69) / 12)
def grid(t0, bpm):
    b = 60.0 / bpm
    return lambda beat: t0 + beat * b

class Track:
    def __init__(s, name, prog, pan=0.0, drum=False, expr0=100):
        s.name, s.prog, s.pan, s.drum, s.expr0 = name, prog, pan, drum, expr0
        s.notes, s.ccs = [], []
    def n(s, p, t0, t1, v=80, hum=0.006):
        if hum:
            d = rng.uniform(-hum, hum); t0 += d; t1 += d
        v = int(np.clip(v + rng.integers(-3, 4), 1, 127))
        t0 = max(0.0, t0)
        s.notes.append(pm.Note(v, P(p), t0, max(t0 + 0.03, t1)))
    def ch(s, ps, t0, t1, v=80, roll=0.0, hum=0.006):
        for i, p in enumerate(ps): s.n(p, t0 + i * roll, t1, v, hum)
    def ex(s, t0, t1, a, b, curve=1.0):
        k = max(2, int((t1 - t0) * 25))
        for i in range(k + 1):
            x = i / k
            s.ccs.append(pm.ControlChange(11, int(np.clip(a + (b - a) * x ** curve, 0, 127)), t0 + x * (t1 - t0)))
    def render(s):
        m = pm.PrettyMIDI(initial_tempo=120)
        ins = pm.Instrument(program=s.prog, is_drum=s.drum, name=s.name)
        ins.control_changes += [pm.ControlChange(7, 110, 0), pm.ControlChange(10, int(64 + 63 * s.pan), 0),
                                pm.ControlChange(91, 0, 0), pm.ControlChange(93, 0, 0),
                                pm.ControlChange(11, s.expr0, 0)]
        ins.control_changes += sorted(s.ccs, key=lambda c: c.time)
        ins.notes = sorted(s.notes, key=lambda x: x.start)
        m.instruments.append(ins)
        mid, wav = f"{OUT}/{s.name}.mid", f"{OUT}/{s.name}.wav"
        m.write(mid)
        subprocess.run(["fluidsynth", "-ni", "-q", "-R", "0", "-C", "0", "-g", "0.5", "-r", str(SR),
                        "-o", "synth.polyphony=1024", "-O", "float", "-T", "wav", "-F", wav, SF2, mid], check=True)
        x, _ = sf.read(wav, dtype="float32")
        if x.ndim == 1: x = np.stack([x, x], 1)
        y = np.zeros((N, 2), np.float32); L = min(N, len(x)); y[:L] = x[:L]
        return y

T = {}
def tr(name, prog, pan=0.0, drum=False, expr0=100):
    T[name] = Track(name, prog, pan, drum, expr0); return T[name]

strL  = tr("strings_low", 48, -0.10)
strH  = tr("strings_high", 49, 0.15)
vlns  = tr("violins", 48, -0.35)
trem  = tr("tremolo", 44, 0.30)
pizz  = tr("pizzicato", 45, -0.25)
ost   = tr("ostinato", 48, 0.05)
cb    = tr("contrabass", 43, 0.05)
cello = tr("cello_solo", 42, -0.20)
horn  = tr("horns", 60, -0.30)
brass = tr("brass", 61, 0.20)
trb   = tr("trombones", 57, 0.25)
tuba  = tr("tuba", 58, 0.10)
choir = tr("choir", 52, 0.00)
oohs  = tr("oohs", 53, 0.00)
organ = tr("organ", 19, 0.00)
piano = tr("piano", 0, 0.10)
cel   = tr("celesta", 8, 0.35)
harp  = tr("harp", 46, -0.40)
flute = tr("flute", 73, 0.30)
timp  = tr("timpani", 47, 0.00)
kit   = tr("kit", 0, 0.0, drum=True)

# numpy-synth event lists
PULSE, TAIKO, BRAAM, RISER, REVCYM, ROLL, SUB, SHIM, HEART = [], [], [], [], [], [], [], [], []
SHEPARD = []

OST_PAT = [0, 0, 2, 0, 1, 0, 2, 1, 0, 0, 2, 0, 1, 2, 3, 1]       # 0=root 1=5th 2=8ve 3=3rd
OST_ACC = {0, 3, 6, 8, 11, 14}                                    # 3+3+2 accents
def ostinato(t0, sixteenth, steps, tones, v, vlo=None, track=None):
    track = track or ost
    vlo = vlo if vlo is not None else v - 22
    for i in range(steps):
        p = tones[OST_PAT[i % 16]]
        vel = v if (i % 16) in OST_ACC else vlo
        track.n(p, t0 + i * sixteenth, t0 + i * sixteenth + sixteenth * 0.85, vel, hum=0.003)

def arp(track, notes, t0, step, t_end, v, ring=None):
    t, i = t0, 0
    while t < t_end - 1e-3:
        track.n(notes[i % len(notes)], t, (t + ring) if ring else t_end, v); t += step; i += 1

def motif(track, notes, times, t_end, v, legato=True):
    for i, (p, t) in enumerate(zip(notes, times)):
        e = times[i + 1] + 0.05 if (legato and i + 1 < len(times)) else t_end
        track.n(p, t, e, v[i] if isinstance(v, (list, tuple)) else v)

# ======================================================== S1 PROLOGUE 0-15.43
# stairway to the sky / elders' story by the fire
for t0, t1, lo, hi in [(0.0, 4.03, ["D2", "A2"], ["D3", "F3", "A3"]),
                       (4.03, 8.43, ["Bb1", "F2"], ["D3", "F3", "Bb3", "C4"]),
                       (8.43, 12.0, ["A1", "F2"], ["C3", "F3", "A3"]),
                       (12.0, 15.43, ["C2", "G2"], ["C3", "E3", "G3", "D4"])]:
    strL.ch(lo, t0, t1 + 0.25, 64); strH.ch(hi, t0, t1 + 0.3, 60)
strL.ex(0, 3.0, 10, 78); strH.ex(0, 4.0, 10, 66); strH.ex(11.5, 15.4, 66, 84)
SUB.append((0.0, 9.0, "D1", 0.10))
motif(piano, ["A3", "D4", "E4", "F4"], [1.0, 1.9, 2.8, 3.7], 6.4, [44, 47, 50, 54])          # the motif, first breath
motif(cel, ["A5", "D6", "E6"], [6.1, 6.35, 6.6], 8.6, 38)                                    # sun glint
motif(piano, ["C4", "F4", "G4", "A4"], [8.9, 9.7, 10.5, 11.3], 14.2, [42, 45, 48, 52])       # same motif, in F: the story
arp(harp, ["F2", "C3", "F3", "A3", "C4", "F4", "A4", "C4"], 8.43, 0.23, 12.0, 42, ring=1.6)
arp(harp, ["C2", "G2", "C3", "E3", "G3", "C4", "E4", "G3"], 12.0, 0.23, 15.3, 46, ring=1.6)
for t, p in zip([12.2, 12.9, 13.4, 13.8, 14.1, 14.4, 14.65, 14.85, 15.05, 15.2],
                ["G5", "C6", "E6", "A5", "D6", "G6", "E6", "C6", "D6", "E6"]):              # the glyph glows
    cel.n(p, t, t + 1.2, int(30 + (t - 12) * 5))
oohs.ch(["G4", "C5", "E5"], 12.3, 15.6, 40); oohs.ex(12.3, 15.4, 20, 70)

# ======================================================== S2 WONDER 15.43-22.13 (no VO)
w = grid(15.43, 60 / 0.8375)
for b0, b1, lo, hi in [(0, 2, ["Bb1", "F2"], ["Bb2", "D3", "F3", "A3", "E4"]),     # Bbmaj7#11 — the wonder chord
                       (2, 4, ["A1", "F2"], ["A2", "C3", "F3", "C4", "G4"]),
                       (4, 6, ["G1", "D2"], ["Bb2", "D3", "F3", "A3"]),
                       (6, 7, ["A1", "E2"], ["A2", "D3", "E3", "A3"]),
                       (7, 8, ["A1", "E2"], ["A2", "C#3", "E3", "A3"])]:
    strL.ch(lo, w(b0), w(b1) + 0.2, 70); strH.ch(hi, w(b0), w(b1) + 0.25, 72)
strL.ex(15.43, w(3), 78, 92); strL.ex(w(3), w(8), 92, 84)
strH.ex(15.43, w(3), 84, 108); strH.ex(w(3), w(6), 108, 92); strH.ex(w(6), w(8), 92, 100)
harp.ch(["Bb3", "C4", "D4", "E4", "F4", "G4", "A4", "Bb4", "C5", "D5", "E5", "F5"], 15.0, 16.6, 52, roll=0.035)  # gliss
mel = [(0, "A5"), (0.75, "D6"), (1.5, "E6"), (2, "F6"), (3.5, "E6"), (4, "D6"), (4.5, "E6"),
       (5, "F6"), (5.5, "A6"), (6, "E6"), (7, "C#6")]
for i, (b, p) in enumerate(mel):
    nb = mel[i + 1][0] if i + 1 < len(mel) else 8
    cel.n(p, w(b), w(nb) + 0.5, 62 if b in (0, 2, 5.5) else 54)
    flute.n(P(p) - 12, w(b), w(nb) + 0.04, 66)
flute.ex(15.43, w(2), 70, 100); flute.ex(w(2), w(8), 100, 80)
for b0, notes in [(0, ["Bb2", "F3", "Bb3", "D4", "F4", "A4", "Bb4", "D5"]), (2, ["A2", "F3", "A3", "C4", "F4", "G4", "A4", "C5"]),
                  (4, ["G2", "D3", "G3", "Bb3", "D4", "F4", "A4", "Bb4"]), (6, ["A2", "E3", "A3", "D4", "E4", "A4", "C#5", "E5"])]:
    for i, p in enumerate(notes): harp.n(p, w(b0 + i * 0.25), w(b0 + 2) + 0.6, 50)
oohs.ch(["D5", "F5", "A5"], w(4), w(6) + 0.1, 48); oohs.ch(["E5", "A5", "C#6"], w(6), 22.4, 48); oohs.ex(w(4), 22.3, 40, 75)
SHIM.append((15.43, 22.13, 0.025)); SUB.append((15.43, 22.4, "A1", 0.05))

# ======================================================== S3 CLIMB 22.13-39.0
B3 = 0.52719; c = grid(22.13, 60 / B3)
BARS3 = [("D2", "A2", "D3", "F3", ["D4", "F4", "A4"]), ("Bb1", "F2", "Bb2", "D3", ["D4", "F4", "Bb4"]),
         ("F2", "C3", "F3", "A2", ["C4", "F4", "A4"]), ("C2", "G2", "C3", "E3", ["C4", "E4", "G4"]),
         ("D2", "A2", "D3", "F3", ["D4", "F4", "A4"]), ("Bb1", "F2", "Bb2", "D3", ["D4", "F4", "Bb4"]),
         ("G1", "D2", "G2", "Bb2", ["D4", "G4", "Bb4"]), ("A1", "E2", "A2", "C#3", ["C#4", "E4", "A4"])]
CUT3 = 38.85                                     # a breath of silence before the skeleton
cel.n("D6", 22.13, 24.0, 50)
for k, (r, f, o, t3, hi) in enumerate(BARS3):
    t0 = c(4 * k); t1 = min(c(4 * k + 4), CUT3)
    ostinato(t0, B3 / 4, 16, [r, f, o, t3], [72, 76, 84, 90, 96, 100, 106, 110][k])
    for j in range(8):
        PULSE.append((t0 + j * B3 / 2, hz(r) * (1 if j % 2 == 0 else 2), 0.35 + 0.06 * k))
    if k < 4:
        for j, p in enumerate([hi[0], hi[1], hi[2], hi[1]] * 2):
            pizz.n(P(p) - 12 if j % 2 else p, t0 + j * B3 / 2, t0 + j * B3 / 2 + 0.2, 58)
    if k >= 2:
        strL.ch([r, f], t0, t1 + (0.05 if k < 7 else 0), 72)
        strH.ch(hi, t0, t1 + (0.05 if k < 7 else 0), 64)
    if k >= 1: cb.n(r, t0, t1, 70)
    timp.n(P(r) + (12 if P(r) < P("D2") else 0), t0, t0 + 0.8, 70 + 6 * k)
ost.ex(22.13, CUT3, 88, 124); strL.ex(c(8), CUT3, 64, 112); strH.ex(c(8), CUT3, 52, 110)
pizz.ex(22.13, c(16), 90, 90)
# horns: the motif, then sequenced up the stairs (Dm → Gm → A)
motif(horn, ["A3", "D4", "E4", "F4"], [c(16), c(17), c(18), c(19)], c(22), [70, 74, 78, 84])
horn.n("D4", c(22), c(24), 74)
motif(horn, ["D4", "G4", "A4", "Bb4"], [c(24), c(25), c(26), c(27)], c(28), [80, 84, 88, 94])
motif(horn, ["E4", "A4", "B4", "C#5"], [c(28), c(29), c(30), c(31)], CUT3, [92, 96, 100, 108])
horn.ex(c(16), CUT3, 82, 122)
for k, p in [(4, "A4"), (5, "Bb4"), (6, "D5"), (7, "E5")]:
    vlns.n(p, c(4 * k), min(c(4 * k + 4) + 0.05, CUT3), 60 + 8 * (k - 4))
vlns.ex(c(16), CUT3, 50, 118)
brass.ch(["G2", "D3", "G3", "Bb3"], c(24), c(28) + 0.05, 72); brass.ch(["A2", "E3", "A3", "C#4"], c(28), CUT3, 86)
brass.ex(c(24), CUT3, 70, 120)
for i in range(int((CUT3 - c(30)) / (B3 / 8))):
    timp.n("A2", c(30) + i * B3 / 8, c(30) + i * B3 / 8 + 0.1, int(50 + 70 * i / ((CUT3 - c(30)) / (B3 / 8))), hum=0)
for bar in (2, 4, 5, 6, 7):
    for bt in (0, 1.5, 3):
        TAIKO.append((c(4 * bar + bt), 0.55 + 0.07 * bar if bt == 0 else 0.35 + 0.05 * bar))
for i in range(8): TAIKO.append((c(30) + i * B3 / 4, 0.4 + 0.08 * i))
ROLL.append((c(28), CUT3, 0.02, 0.22)); RISER.append((c(28), CUT3, 0.30))
kit.n(49, c(16), c(16) + 2.5, 70)

# ======================================================== S4 HORROR 39.0 — the skeleton
H = 39.0
trem.ch(["D2", "Eb2", "A2"], H, 42.5, 118); trem.ch(["A5", "Bb5", "B5", "C6"], H, 41.4, 110)
trem.ex(H, H + 0.25, 127, 127); trem.ex(H + 0.25, 41.4, 127, 40)
trb.ch(["D2", "Eb2", "A2"], H, 40.6, 122); trb.ex(H, 40.6, 127, 30)
tuba.n("D1", H, 40.8, 120)
brass.ch(["Eb3", "A3", "D4"], H, 40.2, 112)
piano.ch(["D1", "Eb1", "A1", "D2", "Eb2"], H, 43.5, 124, hum=0)                             # low piano slam
timp.n("D2", H, H + 2.0, 127, hum=0); kit.n(57, H, H + 3, 100); kit.n(35, H, H + 1, 127)
TAIKO.append((H, 1.4)); BRAAM.append((H, ["D1", "A1", "Eb2", "D2"], 2.6, 0.9, "dark"))
REVCYM.append((H - 1.2, H - 0.12, 0.25))

# ======================================================== S5 UNEASE 40.6-52.37
for i in range(int((52.3 - 41.0) / (B3 / 2))):
    t = 41.0 + i * B3 / 2
    cb.n("D2", t, t + 0.2, 52 + (6 if i % 2 == 0 else 0), hum=0.003)
    PULSE.append((t, hz("D1") * (1 if i % 2 == 0 else 2), 0.20))
for t0, t1, top, chd in [(41.2, 44.4, "A5", ["D3", "F3", "A3"]), (44.4, 46.6, "Bb5", ["Eb3", "G3", "Bb3"]),
                         (46.6, 49.1, "A5", ["D3", "F3", "A3"]), (49.1, 51.2, "Bb5", ["D3", "F3", "Bb3"]),
                         (51.2, 52.4, "C#6", ["C#3", "E3", "A3"])]:
    trem.n(top, t0, t1 + 0.1, 70); strH.ch(chd, t0, t1 + 0.15, 56)
trem.ex(41.4, 52.3, 50, 74); strH.ex(41.0, 51.2, 46, 58); strH.ex(51.2, 52.37, 58, 80)
strL.ch(["D2", "A2"], 41.0, 52.4, 58); strL.ex(41.0, 52.37, 46, 66)
timp.n("D2", 44.4, 45.4, 58); timp.n("D2", 48.6, 49.6, 58)
for i in range(18): timp.n("A2", 51.2 + i * 0.065, 51.2 + i * 0.065 + 0.08, 40 + 4 * i, hum=0)
SUB.append((40.6, 55.4, "D1", 0.08))

# ======================================================== S5b DETERMINED 52.37-55.37 (VO gap)
dd = grid(52.37, 60 / B3)
motif(horn, ["A3", "D4", "E4", "F4"], [dd(0), dd(1), dd(2), dd(3)], 55.3, [100, 104, 108, 112])
horn.ex(52.3, 52.4, 118, 118); horn.ex(dd(3), 55.3, 118, 80)
brass.ch(["D3", "F3", "A3"], dd(0), dd(3) + 0.05, 82); brass.ch(["Bb2", "D3", "F3"], dd(3), 55.3, 82); brass.ex(52.3, 55.3, 100, 70)
strL.ch(["D2", "A2"], dd(0), dd(3) + 0.05, 84); strL.ch(["Bb1", "F2"], dd(3), 55.7, 78)
strH.ch(["D4", "F4", "A4"], dd(0), dd(3) + 0.05, 74); strH.ch(["D4", "F4", "Bb4"], dd(3), 55.7, 70)
ostinato(dd(0), B3 / 4, 12, ["D2", "A2", "D3", "F3"], 100)
for t, v in zip([54.0, 54.16, 54.34, 54.55, 54.8, 55.1, 55.45], [92, 86, 80, 72, 64, 56, 48]):   # momentum drains
    ost.n("D2", t, t + 0.14, v, hum=0)
timp.n("D2", dd(0), dd(0) + 1.0, 100); TAIKO += [(dd(0), 0.9), (dd(3), 0.6)]
for j in range(8): PULSE.append((dd(0) + j * B3 / 2, hz("D2") * (1 if j % 2 == 0 else 2), 0.4 - 0.03 * j))

# ======================================================== S6 TIRED 55.37-68.9
for t0, t1, lo, hi in [(55.37, 58.5, ["D2", "A2"], ["F3", "A3", "D4"]), (58.5, 62.3, ["D2", "G2"], ["G3", "Bb3", "D4"]),
                       (62.3, 64.3, ["Bb1", "F2"], ["F3", "Bb3", "D4"]), (64.3, 68.9, ["C#2", "A2"], ["E3", "A3", "C#4"])]:
    strL.ch(lo, t0, t1 + 0.2, 56); strH.ch(hi, t0 + 0.15, t1 + 0.25, 48)
strL.ex(55.37, 58.5, 70, 46); strL.ex(58.5, 68.9, 46, 60); strH.ex(55.4, 68.9, 44, 54)
motif(cello, ["A3", "D4", "E4", "D4", "C#4"], [62.35, 62.85, 63.35, 64.05, 65.9], 68.2, [72, 74, 80, 64, 56])  # motif fails — never reaches F
cello.ex(62.3, 64.05, 92, 110); cello.ex(64.05, 68.2, 100, 60)
for t, p, v in [(55.4, "D2", 52), (58.5, "G1", 46), (62.3, "Bb1", 50), (64.3, "A1", 50)]:
    piano.n(p, t, t + 3.0, v)
piano.n("A4", 56.9, 59.0, 34); piano.n("F4", 60.5, 62.0, 30)
HEART.append((56.9, 68.4, 1.15)); SUB.append((55.4, 69.0, "D1", 0.09))

# ======================================================== S7 CRYING 68.9-74.9
for t0, t1, lo, hi in [(68.9, 70.4, ["Bb1", "F2"], ["D4", "F4", "Bb4"]), (70.4, 71.3, ["G1", "D2"], ["D4", "G4", "Bb4"]),
                       (71.3, 72.8, ["F1", "D2", "A2"], ["D4", "F4", "A4"]), (72.8, 73.6, ["A1", "E2"], ["D4", "E4", "A4"]),
                       (73.6, 75.0, ["A1", "E2"], ["C#4", "E4", "A4"])]:
    strL.ch(lo, t0, t1 + 0.15, 72); strH.ch(hi, t0, t1 + 0.2, 66)
strL.ex(68.9, 71.6, 62, 100); strL.ex(71.6, 74.9, 100, 52); strH.ex(68.9, 71.6, 56, 104); strH.ex(71.6, 74.9, 104, 48)
motif(vlns, ["F5", "E5", "D5", "A4", "C#5"], [68.95, 70.4, 71.3, 72.8, 73.6], 75.3, [86, 84, 96, 70, 60])  # the motif, falling
vlns.n("D6", 71.3, 72.85, 84)
vlns.ex(68.9, 71.6, 70, 112); vlns.ex(71.6, 75.2, 112, 50)
for t, p in [(69.5, "F6"), (70.9, "E6"), (71.8, "D6"), (73.2, "A5")]: piano.n(p, t, t + 1.8, 40)
for i in range(16): timp.n("D2", 70.4 + i * 0.055, 70.4 + i * 0.055 + 0.07, 30 + 3 * i, hum=0)
timp.n("D2", 71.3, 72.6, 80)

# ======================================================== S8 NIGHT 74.9-78.1
vlns.n("A5", 74.9, 78.7, 44); strL.n("D2", 74.9, 78.4, 48); strL.ex(74.9, 78.1, 52, 40)
harp.ch(["D3", "A3", "E4"], 75.5, 78.5, 38, roll=0.12); cel.n("A6", 76.0, 78.0, 30)
SUB.append((74.9, 78.4, "D1", 0.07))

# ======================================================== S9 VOICE FROM ABOVE 78.1-84.4
for t0, t1, lo, top, mid in [(78.1, 79.7, ["Bb1", "F2"], ["D5", "F5", "Bb5", "C6"], ["Bb2", "F3", "D4"]),
                             (79.7, 81.3, ["A1", "F2"], ["C5", "F5", "A5"], ["A2", "F3", "C4"]),
                             (81.3, 82.9, ["G1", "D2"], ["D5", "G5", "B5"], ["G2", "D3", "B3"]),
                             (82.9, 84.6, ["D2", "A2"], ["D5", "F#5", "A5", "D6"], ["D3", "A3", "F#4"])]:
    choir.ch(top, t0, t1 + 0.15, 72); organ.ch(lo + mid, t0, t1 + 0.1, 56)
    strL.ch(lo, t0, t1 + 0.15, 60); strH.ch(mid, t0, t1 + 0.2, 52)
choir.ex(78.1, 82.9, 30, 92); choir.ex(82.9, 84.4, 92, 80); organ.ex(78.1, 82.9, 30, 72)
strL.ex(78.1, 84.4, 48, 70); strH.ex(78.1, 84.4, 40, 70)
for t, p in [(78.3, "D6"), (78.9, "F6"), (79.8, "C6"), (80.6, "A6"), (81.5, "B6"), (82.2, "G6")]: cel.n(p, t, t + 1.5, 36)
harp.ch(["D4", "E4", "F#4", "A4", "B4", "D5", "E5", "F#5", "A5", "D6"], 82.6, 84.4, 46, roll=0.03)
motif(cel, ["A5", "D6", "E6", "F#6"], [82.9, 83.3, 83.7, 84.1], 85.6, [56, 58, 60, 66])  # first time in MAJOR
SHIM.append((78.1, 84.4, 0.02))

# ======================================================== S10/S11 TOGETHER + FINAL ASCENT 84.4-120.6
B2 = 0.5324; a = grid(84.4, 60 / B2)
D_, Bb_, F_, C_ = ("D2", "A2", "D3", "F#3", ["D4", "F#4", "A4"]), ("Bb1", "F2", "Bb2", "D3", ["D4", "F4", "Bb4"]), \
                  ("F2", "C3", "F3", "A2", ["C4", "F4", "A4"]), ("C2", "G2", "C3", "E3", ["C4", "E4", "G4"])
Dm_ = ("D2", "A2", "D3", "F3", ["D4", "F4", "A4"])
BARS4 = [D_, Bb_, F_, C_, D_, Bb_, F_, C_, Dm_, Bb_, F_, C_,
         ("G1", "D2", "G2", "Bb2", ["D4", "G4", "Bb4"]), Bb_, C_,
         ("E2", "G2", "C3", "E3", ["C4", "E4", "G4"]), ("A1", "E2", "A2", "C#3", ["C#4", "E4", "A4"])]
CUT4 = 120.45
for k, (r, f, o, t3, hi) in enumerate(BARS4):
    t0 = a(4 * k); t1 = min(a(4 * k + 4), CUT4)
    lvl = k / 16.0
    hi_ = hi if k != 16 else ["D4", "E4", "A4"]
    if k < 8:
        for j, p in enumerate([hi[0], hi[1], hi[2], hi[1]] * 2):
            pizz.n(P(p) - 12, t0 + j * B2 / 2, t0 + j * B2 / 2 + 0.22, 56 + 2 * k)
        step = B2 / 4 if k < 4 else B2 / 2
        notes = [P(x) - 12 for x in hi] + [P(x) for x in hi]
        arp(harp, notes, t0, step, t1, 44, ring=1.2)
    if k >= 4:
        ostinato(t0, B2 / 4, 16, [r, f, o, t3], int(70 + 40 * lvl))
    if k == 16:   # Asus4 → A
        strH.ch(["D4", "E4", "A4"], t0, a(66) + 0.04, 86); strH.ch(["C#4", "E4", "A4"], a(66), t1, 88)
    else:
        strH.ch(hi_, t0, t1 + 0.06, int(56 + 30 * lvl))
    if k >= 2: strL.ch([r, f], t0, t1 + 0.06, int(64 + 30 * lvl))
    if k >= 5: cb.n(r, t0, t1, 72)
    if k >= 5: timp.n(P(r) + (12 if P(r) < P("D2") else 0), t0, t0 + 0.9, int(66 + 40 * lvl))
    for j in range(8):
        PULSE.append((t0 + j * B2 / 2, hz(r) * (1 if j % 2 == 0 else 2), 0.18 + 0.32 * lvl))
    if k >= 8:
        for bt in (0, 1.5, 3): TAIKO.append((a(4 * k + bt), (0.45 if bt == 0 else 0.3) + 0.45 * lvl))
    if k >= 12:
        for bt in (2, 2.5): TAIKO.append((a(4 * k + bt), 0.3 + 0.3 * lvl))
        choir.ch([P(x) + 12 for x in hi_], t0, t1 + 0.06, int(60 + 40 * lvl))
        brass.ch([P(x) - 12 for x in hi_], t0, t1 + 0.06, int(66 + 40 * lvl))
        trb.ch([r, f], t0, t1 + 0.06, int(64 + 40 * lvl))
    elif k >= 10:
        brass.ch([P(x) - 12 for x in hi_], t0, t1 + 0.06, 62)
strH.ex(84.4, CUT4, 52, 112); strL.ex(a(8), CUT4, 58, 116); ost.ex(a(16), CUT4, 80, 124)
choir.ex(a(48), CUT4, 60, 110); brass.ex(a(40), CUT4, 60, 118); trb.ex(a(48), CUT4, 60, 116)
oohs.ch(["D5", "F#5", "A5"], 92.4, 94.6, 62); oohs.ex(92.4, 93.3, 30, 92); oohs.ex(93.3, 94.6, 92, 40)  # wide stair shot, VO gap
# horns: the motif climbs the same staircase again
motif(horn, ["C4", "F4", "G4", "A4"], [a(24), a(25), a(26), a(27)], a(28), 64)
motif(horn, ["G3", "C4", "D4", "E4"], [a(28), a(29), a(30), a(31)], a(32), 64)
motif(horn, ["A3", "D4", "E4", "F4"], [a(32), a(33), a(34), a(35)], a(38), 72)
motif(horn, ["C4", "F4", "G4", "A4"], [a(40), a(41), a(42), a(43)], a(44), 74)
horn.n("G4", a(44), a(48), 74)
motif(horn, ["D4", "G4", "A4", "Bb4"], [a(48), a(49), a(50), a(51)], a(52), 84)
motif(horn, ["F4", "Bb4", "C5", "D5"], [a(52), a(53), a(54), a(55)], a(56), 90)
motif(horn, ["G4", "C5", "D5", "E5"], [a(56), a(57), a(58), a(59)], a(60), 96)
horn.n("E5", a(60), a(64), 98)
motif(horn, ["E4", "A4", "B4", "C#5"], [a(64), a(65), a(66), a(67)], CUT4, [100, 104, 108, 114])
horn.ex(a(24), CUT4, 70, 124)
for k, p in [(8, "A4"), (9, "Bb4"), (10, "C5"), (11, "E5"), (12, "D5"), (13, "F5"), (14, "G5"), (15, "G5"), (16, "A5")]:
    vlns.n(p, a(4 * k), min(a(4 * k + 4) + 0.06, CUT4), int(60 + 4 * (k - 8)))
vlns.n("C#6", a(66), CUT4, 96); vlns.ex(a(32), CUT4, 56, 124)
motif(cel, ["A5", "D6", "E6", "F#6"], [116.9, 117.05, 117.2, 117.35], 119.0, 58)           # the chalk wings
for i in range(int((CUT4 - a(64)) / (B2 / 8))):
    timp.n("A2", a(64) + i * B2 / 8, a(64) + i * B2 / 8 + 0.1, int(60 + 60 * i / ((CUT4 - a(64)) / (B2 / 8))), hum=0)
for i in range(16): TAIKO.append((a(64) + i * B2 / 4, 0.45 + 0.04 * i))
kit.n(49, a(32), a(32) + 3, 64); kit.n(49, a(48), a(48) + 3, 80)
SHEPARD.append((a(32), CUT4, 0.03)); RISER.append((a(64), CUT4, 0.35)); ROLL.append((a(60), CUT4, 0.02, 0.25))

# ======================================================== S12 THE SUN 120.6-136.7
# hush... then the motif rises through Bb, F, Gm, A — each the same four steps
for (t0, t1, lo, mid, top, pn) in [
        (120.6, 121.9, ["Bb1", "F2"], ["Bb2", "D3", "F3", "C4"], ["D5", "F5"], ["F5", "Bb5", "C6", "D6"]),
        (121.9, 123.2, ["A1", "F2"], ["A2", "C3", "F3", "G3"], ["C5", "F5"], ["C5", "F5", "G5", "A5"]),
        (123.2, 124.5, ["G1", "D2"], ["Bb2", "D3", "G3", "A3"], ["D5", "G5"], ["D5", "G5", "A5", "Bb5"]),
        (124.5, 125.8, ["A1", "E2"], ["A2", "C#3", "E3", "B3"], ["C#5", "E5", "A5"], ["E5", "A5", "B5", "C#6"])]:
    strL.ch(lo, t0, t1 + 0.04, 74); strH.ch(mid, t0, t1 + 0.04, 72)
    organ.ch(lo + mid, t0, t1 + 0.03, 54); choir.ch(top, t0, t1 + 0.04, 66)
    for i, p in enumerate(pn): piano.n(p, t0 + i * 0.325, t1 + 0.6, 58 + 4 * i)
for t in (strL, strH, organ, choir): t.ex(120.6, 125.75, 50, 118, curve=1.6)
brass.ch(["A2", "E3", "A3", "C#4"], 124.5, 125.82, 70); brass.ex(124.5, 125.8, 60, 120)
for i in range(int(1.75 / 0.05)): timp.n("A2", 124.0 + i * 0.05, 124.0 + i * 0.05 + 0.06, int(36 + 2.4 * i), hum=0)
RISER.append((123.9, 125.8, 0.45)); REVCYM.append((124.2, 125.78, 0.35)); SHEPARD.append((120.6, 125.8, 0.04))

s = grid(125.8, 66); SB = 60 / 66
SUN = [(0, 4, ["D1", "D2", "A2"], ["D3", "F#3", "A3", "D4"], ["A4", "D5", "F#5"]),
       (4, 6, ["G1", "G2", "D3"], ["G3", "B3", "D4"], ["B4", "D5", "G5"]),
       (6, 8, ["B1", "B2", "F#2"], ["F#3", "B3", "D4"], ["B4", "D5", "F#5"]),
       (8, 10, ["Bb1", "Bb2", "F2"], ["F3", "Bb3", "D4"], ["Bb4", "D5", "F5"]),
       (10, 12, ["C2", "C3", "G2"], ["G3", "C4", "E4"], ["C5", "E5", "G5"]),
       (12, 16, ["D1", "D2", "A2"], ["D3", "F#3", "A3", "D4"], ["A4", "D5", "F#5", "A5"])]
for b0, b1, lo, mid, top in SUN:
    t0, t1 = s(b0), s(b1) + (0.05 if b1 < 16 else 0.15)
    strL.ch(lo, t0, t1, 104); cb.n(lo[1], t0, t1, 96); tuba.n(lo[0] if P(lo[0]) >= P("C1") else lo[1], t0, t1, 92)
    strH.ch(mid, t0, t1, 100); brass.ch(mid, t0, t1, 98); trb.ch(lo[1:], t0, t1, 94)
    choir.ch(top, t0, t1, 100); organ.ch(lo[1:] + mid, t0, t1, 74)
    timp.n(P(lo[1]) if P(lo[1]) >= P("D2") else P(lo[1]) + 12, t0, t0 + 1.2, 110)
    if b1 <= 12:
        tones = [lo[1], lo[2], P(lo[1]) + 12, mid[1] if P(mid[1]) < P("C4") else P(mid[1]) - 12]
        ostinato(t0, SB / 4, int((b1 - b0) * 4), tones, 108, 84)
        for j in range(int((b1 - b0) * 2)): PULSE.append((t0 + j * SB / 2, hz(lo[1]) * (1 if j % 2 == 0 else 2), 0.55))
# THE THEME: up through the thirds to the summit F#6
SUNMEL = [(0, 1, "A4"), (1, 1, "D5"), (2, 1, "E5"), (3, 1.5, "F#5"), (4.5, 0.5, "G5"), (5, 1, "A5"),
          (6, 2, "B5"), (8, 2, "D6"), (10, 2, "E6"), (12, 4.5, "F#6")]
for b, d, p in SUNMEL:
    vlns.n(p, s(b), s(b + d) + 0.05, 112); horn.n(P(p) - 12, s(b), s(b + d) + 0.05, 116)
    flute.n(p, s(b), s(b + d) + 0.05, 90)
    if b >= 8: choir.n(p, s(b), s(b + d) + 0.05, 104)
for t in (vlns, horn, strL, strH, brass, choir, organ, trb, ost, cb, tuba, flute):
    t.ex(125.8, s(12), 118, 127)
    t.ex(s(12), s(16), 127, 60, curve=0.7)
for i in range(int(2 * SB / 0.05)):
    timp.n("C3", s(10) + i * 0.05, s(10) + i * 0.05 + 0.06, int(60 + 60 * i / (2 * SB / 0.05)), hum=0)
for bt, g in [(0, 1.6), (2, 0.7), (4, 1.2), (5.5, 0.6), (6, 0.9), (7.5, 0.7), (8, 1.3), (10, 0.9), (11, 0.8), (11.5, 0.9), (12, 1.7)]:
    TAIKO.append((s(bt), g))
for bt in (0, 8, 12): kit.n(49, s(bt), s(bt) + 3, 110); kit.n(57, s(bt), s(bt) + 3, 96)
BRAAM += [(125.8, ["D1", "A1", "D2", "F#2", "A2"], 4.0, 0.85, "bright"),
          (s(8), ["Bb0", "F1", "Bb1", "D2"], 3.0, 0.55, "bright"),
          (s(12), ["D1", "A1", "D2", "F#2", "A2"], 6.0, 0.9, "bright")]
REVCYM.append((s(10.5), s(12) - 0.03, 0.3)); SHIM.append((125.8, 141.0, 0.03))

# ======================================================== S13 SUNSET → NIGHT → FADE 136.7-161.5
for t0, t1, lo, hi, top in [(140.3, 143.9, ["B1", "F#2"], ["B3", "D4", "F#4", "A4"], ["D5", "F#5"]),
                            (143.9, 147.6, ["G1", "D2"], ["B3", "D4", "A4"], ["D5", "G5"]),
                            (147.6, 150.3, ["Bb1", "F2"], ["D4", "F4", "A4", "E5"], ["F5", "A5"]),   # the wonder chord returns
                            (150.3, 153.0, ["C2", "G2"], ["E4", "G4", "D5"], ["E5", "G5"]),
                            (153.0, 161.0, ["D2", "A2"], ["D4", "F#4", "A4", "E5"], ["A4", "D5", "F#5"])]:
    strL.ch(lo, t0, t1 + 0.2, 66); strH.ch(hi, t0, t1 + 0.25, 62); choir.ch(top, t0, t1 + 0.2, 56)
for t in (strL, strH, choir): t.ex(140.4, 141.0, 60, 70); t.ex(153.0, 160.8, 76, 0, curve=0.8)
organ.ch(["D2", "A2", "D3", "F#3"], 153.0, 160.5, 44); organ.ex(153.0, 160.5, 60, 0)
arp(harp, ["Bb2", "F3", "A3", "D4", "E4", "A4"], 147.6, 0.3, 150.3, 40, ring=1.6)
arp(harp, ["C3", "G3", "D4", "E4", "G4", "D5"], 150.3, 0.3, 153.0, 40, ring=1.6)
motif(piano, ["A4", "D5", "E5"], [147.6, 148.5, 149.4], 152.8, [56, 58, 62])
piano.n("F#5", 153.0, 158.0, 64); piano.n("D3", 153.0, 158.0, 48); piano.n("A5", 156.0, 161.0, 42)
cel.n("F#6", 153.0, 156.0, 52); cel.n("A6", 156.0, 160.0, 40)
SUB.append((153.0, 160.5, "D1", 0.08)); SHIM.append((147.6, 159.0, 0.02))

# ---------------------------------------------------- breaths of silence
def silence(t0, t1):
    for tk in T.values():
        keep = []
        for nt in tk.notes:
            if t0 <= nt.start < t1: continue
            if nt.start < t0 < nt.end: nt.end = t0
            keep.append(nt)
        tk.notes = keep
    for ev in (PULSE, TAIKO):
        ev[:] = [e for e in ev if not (t0 <= e[0] < t1)]
silence(CUT3, H - 0.02); silence(CUT4, 120.58)

# ================================================================ SYNTH LAYERS
t_axis = np.arange(N) / SR
def put(buf, t0, sig, gain=1.0):
    i = int(t0 * SR)
    if i >= N or i + len(sig) <= 0: return
    j = min(N, i + len(sig)); buf[max(0, i):j] += gain * sig[max(0, -i):j - i]
def lp(x, f, o=2): return sosfilt(butter(o, f, "lowpass", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "highpass", fs=SR, output="sos"), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "bandpass", fs=SR, output="sos"), x)
def saw(f, n, ph=0.0): return 2 * ((f * np.arange(n) / SR + ph) % 1.0) - 1

syn = {k: np.zeros(N, np.float32) for k in ["pulse", "perc", "braam", "fx", "sub"]}
for t, f, g in PULSE:                                    # hybrid pluck pulse
    n = int(0.24 * SR); env = np.exp(-np.arange(n) / SR / 0.06)
    x = 0.5 * saw(f, n) + 0.5 * saw(f * 1.004, n, 0.3)
    put(syn["pulse"], t, lp(x * env, 1300) , 0.22 * g)
for t, g in TAIKO:                                       # big drum
    n = int(1.4 * SR); tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * (45 * tt + 40 * 0.04 * (1 - np.exp(-tt / 0.04)))) * np.exp(-tt / 0.32)
    skin = lp(rng.standard_normal(n), 900) * np.exp(-tt / 0.06) * 0.6
    snap = hp(rng.standard_normal(n), 1500) * np.exp(-tt / 0.012) * 0.25
    put(syn["perc"], t, np.tanh(1.8 * (body + skin + snap)) * 0.6, g)
for t0, t1, g0, g1 in ROLL:                              # snare-ish roll building
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR
    rate = 14 + 10 * tt / max(tt[-1], 1e-3)
    gate = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * np.cumsum(rate) / SR))
    env = (g0 + (g1 - g0) * (tt / tt[-1]) ** 2) * (0.35 + 0.65 * gate * np.exp(-((np.cumsum(rate) / SR) % 1) * 3))
    put(syn["perc"], t0, bp(rng.standard_normal(n), 300, 6000) * env, 1.0)
for t, notes, d, g, col in BRAAM:                        # the braam
    n = int(d * SR); tt = np.arange(n) / SR
    x = sum(saw(hz(p) * dt, n, rng.random()) for p in notes for dt in (0.997, 1.0, 1.003))
    x = np.tanh(x * 0.6)
    bright = lp(x, 2600 if col == "bright" else 1400, 2); dark = lp(x, 280, 2)
    open_ = np.clip(1 - tt / (1.4 if col == "bright" else 0.8), 0, 1) ** 1.5
    env = np.minimum(1, tt / 0.02) * np.exp(-tt / (d * 0.45))
    put(syn["braam"], t, (bright * open_ + dark * (1 - open_)) * env, 0.10 * g)
for t0, t1, g in RISER:                                  # noise + tone risers
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR; x = tt / tt[-1]
    noise = rng.standard_normal(n); lo_ = bp(noise, 400, 2000); hi_ = bp(noise, 2000, 9000)
    sw = lo_ * (1 - x) + hi_ * x
    tone = np.sin(2 * np.pi * np.cumsum(110 * 2 ** (2.5 * x)) / SR) * 0.3
    put(syn["fx"], t0, (sw * 0.6 + tone) * x ** 2.5, g)
for t0, t1, g in REVCYM:                                 # reverse cymbal
    n = int((t1 - t0) * SR); x = np.arange(n) / n
    put(syn["fx"], t0, hp(rng.standard_normal(n), 3500) * x ** 3, g)
for t0, t1, g in SHEPARD:                                # endless rising tone (Shepard)
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR; out = np.zeros(n)
    cyc = tt / 6.0                                       # one octave every 6 s
    for k in range(7):
        pos = (k + cyc) % 7; f = 55 * 2 ** pos
        amp = np.exp(-0.5 * ((pos - 3.5) / 1.3) ** 2)
        out += amp * np.sin(2 * np.pi * np.cumsum(f) / SR)
    fade = np.minimum(1, tt / 2.0) * np.minimum(1, (tt[-1] - tt) / 0.1 + 0.01)
    put(syn["fx"], t0, out * fade * (0.4 + 0.6 * tt / tt[-1]), g)
for t0, t1, p, g in SUB:                                 # sub drone
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR
    env = np.minimum(1, tt / 1.5) * np.minimum(1, (tt[-1] - tt) / 1.5)
    put(syn["sub"], t0, (np.sin(2 * np.pi * hz(p) * tt) + 0.3 * np.sin(4 * np.pi * hz(p) * tt)) * env, g)
for t0, t1, g in SHIM:                                   # air / sparkle
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR
    env = np.minimum(1, tt / 1.5) * np.minimum(1, (tt[-1] - tt) / 1.5) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.31 * tt))
    put(syn["fx"], t0, bp(rng.standard_normal(n), 6000, 12000) * env, g)
for t0, t1, per in HEART:                                # tired heartbeat
    t = t0
    while t < t1:
        for dt, g in ((0, 1.0), (0.24, 0.65)):
            n = int(0.35 * SR); tt = np.arange(n) / SR
            put(syn["perc"], t + dt, np.sin(2 * np.pi * (42 + 25 * np.exp(-tt / 0.03)) * tt) * np.exp(-tt / 0.09), 0.30 * g)
        t += per
# screech at the skeleton
n = int(1.6 * SR); tt = np.arange(n) / SR
scr = sum(saw(f * (1 + 0.006 * np.sin(2 * np.pi * 7.3 * tt)), n) for f in (1760, 1864.7, 1975.5))
put(syn["fx"], H, bp(scr, 1500, 7000) * np.exp(-tt / 0.5) * np.minimum(1, tt / 0.01), 0.025)

# ================================================================ RENDER + MIX
print("rendering orchestra stems …")
stems = {name: t.render() for name, t in T.items() if t.notes}
def mono2st(x, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l * 1.41, x * r * 1.41], 1).astype(np.float32)
stems["syn_pulse"] = mono2st(syn["pulse"], 0.0)
d = int(0.011 * SR); stems["syn_pulse"][d:, 1] = stems["syn_pulse"][:-d, 1].copy()   # widen
stems["syn_perc"] = mono2st(syn["perc"]); stems["syn_braam"] = mono2st(syn["braam"])
stems["syn_fx"] = mono2st(syn["fx"]); stems["syn_sub"] = mono2st(syn["sub"])

MIX = {  # gain dB, reverb send
    "strings_low": (2, .35), "strings_high": (1, .45), "violins": (2, .45), "tremolo": (-2, .40),
    "pizzicato": (1, .30), "ostinato": (0, .22), "contrabass": (-2, .25), "cello_solo": (5, .40),
    "horns": (1, .40), "brass": (-1, .35), "trombones": (-2, .35), "tuba": (-3, .25), "choir": (1, .55),
    "oohs": (3, .55), "organ": (-6, .50), "piano": (0, .35), "celesta": (6, .55), "harp": (-2, .45),
    "flute": (-2, .45), "timpani": (1, .30), "kit": (-5, .35),
    "syn_pulse": (-4, .18), "syn_perc": (-1, .22), "syn_braam": (-2, .25), "syn_fx": (-5, .40), "syn_sub": (-6, 0.0)}

# synthetic concert-hall impulse response (≈3.4 s, darker tail)
L = int(3.6 * SR); tt = np.arange(L) / SR
ir = np.zeros((L, 2))
for ch in range(2):
    nz = rng.standard_normal(L)
    ir[:, ch] = lp(nz, 7000) * np.exp(-tt * 6.9 / 3.4) * 0.6 + lp(nz, 1800) * np.exp(-tt * 6.9 / 2.4) * 0.4
pre = int(0.022 * SR); ir = np.vstack([np.zeros((pre, 2)), ir])[:L]
for k, dly in enumerate([0.011, 0.017, 0.023, 0.031, 0.041]):
    ir[int((dly + 0.002 * k) * SR), k % 2] += 0.5 / (k + 1)
ir /= np.sqrt((ir ** 2).sum(0, keepdims=True)) * 3.0

dry = np.zeros((N, 2)); send = np.zeros((N, 2))
for k, x in stems.items():
    g, r = MIX.get(k, (0, .3)); x = x * 10 ** (g / 20)
    dry += x; send += x * r
wet = np.stack([fftconvolve(send[:, c], ir[:, c])[:N] for c in range(2)], 1)
mus = dry + wet
mus = np.stack([hp(mus[:, c], 28) for c in range(2)], 1)

# glue compression (slow RMS) + soft clip
env = np.sqrt(lp(np.mean(mus ** 2, 1), 3.0, 1).clip(1e-12))
thr = 10 ** (-14 / 20); gr = np.where(env > thr, (thr / env) ** (1 - 1 / 2.0), 1.0)
mus *= gr[:, None]
mus /= np.abs(mus).max() + 1e-9
mus = np.tanh(mus * 1.15) / np.tanh(1.15) * 0.89
sf.write(f"{OUT}/score_music_only.wav", mus.astype(np.float32), SR, subtype="PCM_24")
print("music written")

# ================================================================ VO-AWARE MIX
if len(sys.argv) > 1:
    vid = sys.argv[1]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vid, "-vn", "-ac", "2", "-ar", str(SR), f"{OUT}/vo.wav"], check=True)
    vo, _ = sf.read(f"{OUT}/vo.wav"); vo = np.vstack([vo, np.zeros((max(0, N - len(vo)), 2))])[:N]
    # --- fader rides: lift the wordless moments (dB), interpolated
    FADER = [(0, 0), (15.0, 0), (15.7, 6), (21.9, 6), (22.5, 3), (38.8, 3), (39.0, 0), (55.3, 0), (68.6, 0), (69.3, 5),
             (74.6, 5), (75.3, 2), (78.0, 2), (78.8, 6), (84.4, 6), (85.0, 5), (100.5, 5), (103.0, 3), (120.4, 3),
             (120.6, 2), (125.8, 0), (136.7, 0), (140.0, 3), (147.0, 4), (148.5, 8), (162, 8)]
    ft, fv = zip(*FADER)
    mus = mus * (10 ** (np.interp(np.arange(N) / SR, ft, fv) / 20))[:, None]
    # --- adaptive ducking: keep music >= GAP dB under the voice while it speaks, full level in the gaps
    GAP, hop = 14.0, int(0.01 * SR)
    def frames_db(x, win):
        e = np.add.reduceat(x ** 2, np.arange(0, N, hop)) / hop
        k = max(1, int(win / 0.01)); e = np.convolve(e, np.ones(k) / k, "same")
        return 10 * np.log10(e + 1e-12)
    vb = bp(vo.mean(1), 200, 4000)
    act = np.clip((frames_db(vb, 0.02) + 44) / 12, 0, 1)
    act = np.maximum.reduce([np.roll(act, -i) for i in range(0, 12)])      # 120 ms look-ahead
    vo_db = frames_db(vo.mean(1), 1.2)                                     # phrase loudness
    mu_db = frames_db(mus.mean(1), 0.4)
    need = np.clip(mu_db - (vo_db - GAP), 0, 24) * act + 1.0 * act        # always a little room for words
    sm = np.zeros_like(need); y = 0.0
    for i, x in enumerate(need):
        y += (x - y) * (0.30 if x > y else 0.02); sm[i] = y
    red = np.interp(np.arange(N) / hop, np.arange(len(sm)), sm)
    g_all = 10 ** (-red / 20); g_mid = 10 ** (-2.5 * np.interp(np.arange(N) / hop, np.arange(len(act)), act) / 20)
    lo_b = np.stack([lp(mus[:, c], 250) for c in range(2)], 1)
    hi_b = np.stack([hp(mus[:, c], 4000) for c in range(2)], 1)
    mid_b = mus - lo_b - hi_b
    ducked = (lo_b + hi_b + mid_b * g_mid[:, None]) * g_all[:, None]
    MUSIC_LVL = 1.0
    final = vo + ducked * MUSIC_LVL
    # look-ahead peak limiter (1 ms blocks) instead of scaling the whole mix down
    from scipy.ndimage import maximum_filter1d
    blk = 44; pk = np.abs(final).max(1); nb = len(pk) // blk + 1
    pkb = np.array([pk[i * blk:(i + 1) * blk].max() if i * blk < len(pk) else 0 for i in range(nb)])
    pkb = maximum_filter1d(pkb, 7, origin=0)
    tgt = np.minimum(1.0, 0.94 / (pkb + 1e-9)); gs = np.empty_like(tgt); y = 1.0
    for i, x in enumerate(tgt):
        y = x if x < y else y + (x - y) * 0.01; gs[i] = y
    final *= np.repeat(gs, blk)[:len(final), None]
    sf.write(f"{OUT}/final_mix.wav", final.astype(np.float32), SR, subtype="PCM_24")
    sf.write(f"{OUT}/score_ducked.wav", (ducked * MUSIC_LVL).astype(np.float32), SR, subtype="PCM_24")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vid, "-i", f"{OUT}/final_mix.wav", "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", f"{OUT}/the_climb_scored.mp4"], check=True)
    print("video written")

    # ------------------------------------------------------------ deliverables
    os.makedirs(f"{HERE}/midi", exist_ok=True)
    for name in T:
        if os.path.exists(f"{OUT}/{name}.mid"):
            subprocess.run(["cp", f"{OUT}/{name}.mid", f"{HERE}/midi/{name}.mid"], check=True)
    subprocess.run(["cp", f"{OUT}/the_climb_scored.mp4", f"{HERE}/the_climb_scored.mp4"], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{OUT}/score_music_only.wav", "-t", "161.5",
                    "-sample_fmt", "s16", f"{HERE}/the_climb_score.flac"], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{OUT}/score_ducked.wav", "-t", "161.5",
                    "-c:a", "aac", "-b:a", "320k", f"{HERE}/the_climb_score_film_stem.m4a"], check=True)
    print("deliverables written")
