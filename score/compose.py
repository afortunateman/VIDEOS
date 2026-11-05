#!/usr/bin/env python3
"""
"THE CLIMB" — original score, v2 (ethereal, no percussion). 161.5 s, scored to
picture and to the voiceover's real phrase timings (see score/README.md).

One theme carries the film: the CLIMB MOTIF, four rising steps (degrees 5-1-2-3,
A-D-E-F). It is a question when it stops short (A-D-E…), it completes in major
(A-D-E-F#) when the voice from above promises the top, echoes from every
caterpillar at once, fails to finish at "no wings", reaches its summit at
"And that was enough", and is left unanswered at the very end.

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
rng = np.random.default_rng(23)

# ---------------------------------------------------------------- helpers
NN = {"C":0,"C#":1,"Db":1,"D":2,"D#":3,"Eb":3,"E":4,"F":5,"F#":6,"Gb":6,
      "G":7,"G#":8,"Ab":8,"A":9,"A#":10,"Bb":10,"B":11}
def P(s):
    if isinstance(s, (int, np.integer)): return int(s)
    name = s[:2] if len(s) > 2 and s[1] in "#b" else s[:1]
    return 12 * (int(s[len(name):]) + 1) + NN[name]
def hz(p): return 440.0 * 2 ** ((P(p) - 69) / 12)

class Track:
    def __init__(s, name, prog, pan=0.0, expr0=100):
        s.name, s.prog, s.pan, s.expr0 = name, prog, pan, expr0
        s.notes, s.ccs = [], []
    def n(s, p, t0, t1, v=70, hum=0.01):
        if hum:
            d = rng.uniform(-hum, hum); t0 += d; t1 += d
        v = int(np.clip(v + rng.integers(-3, 4), 1, 127)); t0 = max(0.0, t0)
        s.notes.append(pm.Note(v, P(p), t0, max(t0 + 0.05, t1)))
    def ch(s, ps, t0, t1, v=70, roll=0.0):
        for i, p in enumerate(ps): s.n(p, t0 + i * roll, t1, v)
    def ex(s, t0, t1, a, b):
        k = max(2, int((t1 - t0) * 20))
        for i in range(k + 1):
            x = i / k
            s.ccs.append(pm.ControlChange(11, int(np.clip(a + (b - a) * x, 0, 127)), t0 + x * (t1 - t0)))
    def curve(s, pts):
        for (t0, a), (t1, b) in zip(pts[:-1], pts[1:]): s.ex(t0, t1 - 1e-3, a, b)
    def render(s):
        m = pm.PrettyMIDI(initial_tempo=120)
        ins = pm.Instrument(program=s.prog, name=s.name)
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
def tr(name, prog, pan=0.0, expr0=100):
    T[name] = Track(name, prog, pan, expr0); return T[name]

strL  = tr("strings_low", 49, -0.15)     # slow-attack ensemble for everything sustained
strH  = tr("strings_high", 49, 0.20)
vlns  = tr("violins", 48, -0.35)
trem  = tr("tremolo", 44, 0.30)
cello = tr("cello_solo", 42, -0.20)
horn  = tr("horn", 60, -0.30)
choir = tr("choir", 52, 0.00)
oohs  = tr("oohs", 53, 0.05)
organ = tr("organ", 19, 0.00)
piano = tr("piano", 0, 0.10)
cel   = tr("celesta", 8, 0.35)
harp  = tr("harp", 46, -0.40)
flute = tr("flute", 73, 0.30)
halo  = tr("halo_pad", 94, 0.00)

PADS, SHIMS, BELLS, AIR, SWELLS, SHEPARD, EERIE, SUB = [], [], [], [], [], [], [], []

def motif(track, notes, times, t_end, v):
    for i, (p, t) in enumerate(zip(notes, times)):
        e = times[i + 1] + 0.08 if i + 1 < len(times) else t_end
        track.n(p, t, e, v[i] if isinstance(v, (list, tuple)) else v)

def flow(track, notes, t0, t1, step, v, ring=2.5, jitter=0.18):
    """unhurried, rubato arpeggio — motion without a beat"""
    t, i = t0, 0
    while t < t1 - 0.05:
        track.n(notes[i % len(notes)], t, min(t + ring, t1 + 1.0), v - (6 if i % 3 else 0), hum=0)
        t += step * (1 + rng.uniform(-jitter, jitter)); i += 1

# ================================================================== HARMONY
# (start, end, bass, upper) — one continuous chord stream under the whole film
CH = [
    # prologue — "There was once a caterpillar…"
    (0.0, 4.2, ["D2", "A2"], ["F3", "A3", "E4"]),                # Dm(add9)
    (4.2, 8.6, ["Bb1", "F2"], ["D3", "F3", "A3"]),               # Bbmaj7 — "Nobody knew…"
    (8.6, 11.4, ["F2", "C3"], ["A3", "C4", "G4"]),               # F(add9) — the elders' stories
    (11.4, 14.1, ["G1", "D2"], ["Bb3", "D4", "A4"]),             # Gm9 — "Climb high enough"
    (14.1, 15.9, ["Bb1", "F2"], ["D4", "E4", "A4"]),             # Bbmaj7#11 — "become a butterfly"
    # wonder (no VO)
    (15.9, 17.5, ["Bb1", "F2"], ["D4", "E4", "A4"]),
    (17.5, 19.2, ["A1", "F2"], ["C4", "F4", "G4"]),
    (19.2, 20.8, ["G1", "D2"], ["Bb3", "D4", "F4", "A4"]),
    (20.8, 21.6, ["A1", "E2"], ["A3", "D4", "E4"]),
    (21.6, 22.4, ["A1", "E2"], ["A3", "C#4", "E4"]),
    # the climb
    (22.4, 26.4, ["D2", "A2"], ["D3", "F3", "A3", "E4"]),        # "So he climbed"
    (26.4, 28.6, ["Bb1", "F2"], ["D3", "F3", "Bb3", "C4"]),      # "past caterpillars who had given up"
    (28.6, 31.6, ["G1", "D2"], ["Bb2", "D3", "G3", "A3"]),       # "past the skeletons…"
    (31.6, 35.0, ["Eb2", "Bb2"], ["Eb3", "G3", "Bb3", "D4"]),    # "messages carved into the walls"
    (35.0, 36.3, ["C2", "G2"], ["C3", "G3", "Eb4"]),             # "Keep going."
    (36.3, 37.8, ["Bb1", "F2"], ["D3", "F3", "Bb3"]),            # "The top is worth it."
    (37.8, 39.0, ["A1", "E2"], ["C#3", "E3", "A3"]),             # "You're almost there."
    (39.0, 40.8, ["D2"], ["Eb4", "A4"]),                         # …the skeleton (cold, unresolved)
    # the one coming down
    (40.8, 44.7, ["D2", "A2"], ["F3", "A3", "D4"]),
    (44.7, 46.8, ["Bb1", "F2"], ["D3", "F3", "A3"]),             # "What's at the top?"
    (46.8, 49.2, ["D2", "A2"], ["D3", "F#3", "A3", "E4"]),       # "Glory."  (the golden chord)
    (49.2, 50.5, ["G1", "D2"], ["Bb2", "D3", "G3"]),             # "Have you seen it?"
    (50.5, 51.4, ["D2"], ["A3"]),                                # "No."
    (51.4, 52.6, ["Bb1", "F2"], ["D3", "F3"]),                   # "But I've heard."
    (52.6, 55.0, ["D2", "A2"], ["F3", "A3", "D4"]),              # his resolve (VO gap)
    # years
    (55.0, 58.6, ["D2", "A2"], ["F3", "A3", "D4"]),              # "Years passed."
    (58.6, 60.5, ["C2", "G2"], ["E3", "G3", "D4"]),              # "His body grew tired… legs weakened"
    (60.5, 64.4, ["Bb1", "F2"], ["D3", "F3", "A3"]),
    (64.4, 66.5, ["G1", "D2"], ["Bb2", "D3", "G3"]),             # "But he kept climbing…"
    (66.5, 69.1, ["A1", "E2"], ["C#3", "E3", "Bb3"]),            # "…terrified him more than the staircase"
    (69.1, 71.5, ["Bb1", "F2"], ["D4", "F4", "Bb4"]),            # "couldn't take it anymore"
    (71.5, 73.0, ["G1", "D2"], ["D4", "G4", "Bb4"]),             # "stopped climbing and screamed…"
    (73.0, 75.1, ["F1", "D2", "A2"], ["D4", "F4", "A4"]),
    (75.1, 78.1, ["D2"], ["A3"]),                                # "Then, from somewhere above…"
    # the voice
    (78.1, 79.5, ["Bb1", "F2"], ["D4", "F4", "C5"]),             # "You're almost there."
    (79.5, 80.8, ["A1", "F2"], ["C4", "F4", "A4"]),              # "Don't give up now."
    (80.8, 81.6, ["G1", "D2"], ["D4", "G4", "B4"]),              # "You've come so far!"
    (81.6, 82.7, ["D2", "A2"], ["D4", "F#4", "A4"]),
    (82.7, 85.0, ["D2", "A2"], ["D3", "A3", "E4"]),              # "But something was different…"
    (85.0, 89.9, ["D2", "A2"], ["D3", "F#3", "A3", "E4"]),       # "…every caterpillar was hearing the same voice"
    (89.9, 94.0, ["D2", "A2"], ["D3", "F3", "A3", "E4"]),        # "…every single one of them was almost there"
    (94.0, 96.6, ["Bb1", "F2"], ["D3", "F3", "A3", "C4"]),       # "the endless staircase"
    (96.6, 99.0, ["G1", "D2"], ["Bb2", "D3", "A3"]),             # "his little suitcase"
    (99.0, 100.3, ["A1", "E2"], ["A2", "D3", "E3"]),             # "And finally,"
    (100.3, 101.2, ["D2", "A2"], ["A2", "D3", "E3"]),            # "he sat down."
    # stillness
    (101.2, 105.6, ["D2", "A2"], ["A3", "D4", "E4"]),            # "For a while, he waited…"
    (105.6, 107.3, ["D2"], ["A4"]),                              # "But nothing did."
    (107.3, 111.9, ["Bb1", "F2"], ["D3", "F3", "A3"]),           # "The staircase carried on…"
    (111.9, 114.8, ["G1", "D2"], ["Bb2", "D3", "A3"]),           # "…just as he was before."
    (114.8, 117.4, ["Eb2", "Bb2"], ["G3", "Bb3", "D4"]),         # "no revelation or enlightenment"
    (117.4, 119.3, ["C2", "G2"], ["E3", "G3", "D4"]),            # "There were no wings."
    (119.3, 120.85, ["D2", "A2"], ["A3", "D4", "A4"]),           # "…no glory."
    # enough
    (120.85, 123.0, ["G1", "D2"], ["B2", "D3", "G3", "A3"]),     # "But for the first time in his life,"
    (123.0, 125.8, ["A1", "E2"], ["A2", "C#3", "E3", "B3"]),     # "he wasn't miserable."
    (125.8, 128.4, ["D2", "A2"], ["D3", "F#3", "A3", "D4"]),     # THE SUN — "he was just there."
    (128.4, 129.9, ["G1", "D2"], ["G3", "B3", "D4"]),
    (129.9, 131.4, ["B1", "F#2"], ["F#3", "B3", "D4"]),
    (131.4, 133.0, ["Bb1", "F2"], ["F3", "Bb3", "D4"]),
    (133.0, 134.68, ["C2", "G2"], ["G3", "C4", "E4"]),
    (134.68, 138.48, ["D2", "A2"], ["D3", "F#3", "A3", "D4"]),   # "And that was enough."
    # the question
    (138.48, 140.92, ["B1", "F#2"], ["D3", "F#3", "A3"]),        # "…he wondered"
    (140.92, 143.86, ["G1", "D2"], ["B2", "D3", "F#3", "A3"]),   # "What if the top was invented"
    (143.86, 146.0, ["E2", "B2"], ["G3", "B3", "D4", "F#4"]),    # "by caterpillars who couldn't bear the thought"
    (146.0, 150.5, ["Bb1", "F2"], ["D3", "F3", "A3", "E4"]),     # "that climbing was all there was?" — the wonder chord
    (150.5, 155.0, ["C2", "G2"], ["E3", "G3", "D4"]),
    (155.0, 161.5, ["D2", "A2"], ["A3", "D4", "E4"]),            # Dsus2 — left open
]
for t0, t1, lo, hi in CH:
    strL.ch(lo, t0, t1 + 0.35, 62); strH.ch(hi, t0, t1 + 0.4, 58)
    PADS.append((t0, t1, lo + hi))

# one dynamic line for the whole film (CC11 for strings, gain for pads)
DYN = [(0, 25), (3, 62), (14, 72), (16, 88), (20, 98), (22.4, 72), (28.6, 62), (32, 58), (37.8, 76), (39.0, 82),
       (40.8, 56), (46.8, 76), (49.2, 56), (52.6, 72), (55.0, 56), (64, 60), (68, 72), (69.1, 74), (73.5, 112),
       (75.0, 70), (75.4, 46), (78.1, 62), (81.6, 88), (82.7, 64), (89.9, 60), (94, 58), (100.5, 50), (101.2, 44),
       (105.6, 32), (107.3, 42), (117, 44), (120.85, 60), (125.8, 96), (128.4, 104), (134.68, 124), (136.6, 96),
       (140.9, 72), (147.6, 68), (150.5, 62), (155, 56), (160.8, 0), (162, 0)]
strL.curve(DYN); strH.curve(DYN)
dt_, dv_ = zip(*DYN)
def dyn(t): return np.interp(t, dt_, dv_) / 127.0

# ================================================================== FOREGROUND
# --- prologue
motif(piano, ["A4", "D5", "E5", "F5"], [0.6, 1.5, 2.4, 3.3], 7.0, [38, 41, 44, 48])
motif(cel, ["A5", "D6", "E6"], [6.5, 6.95, 7.4], 9.5, 46)                                     # what was at the top? (unfinished)
flow(harp, ["F2", "C3", "A3", "G4", "C4", "F3", "A3", "E4"], 8.6, 11.4, 0.42, 44)
flow(harp, ["G2", "D3", "Bb3", "D4", "A4", "D5"], 11.4, 14.1, 0.40, 46, jitter=0.08)          # rising: "climb high enough"
for t, p in [(14.15, "A5"), (14.6, "E6"), (15.0, "D6"), (15.4, "A6")]: BELLS.append((t, p, 0.10))
oohs.ch(["D5", "E5", "A5"], 14.1, 16.2, 42); oohs.curve([(14.1, 20), (15.9, 72)])
SHIMS.append((13.8, 22.6, ["A5", "E6"], 0.5))

# --- wonder
wb = 6.5 / 8; w = lambda b: 15.9 + b * wb
mel = [(0, "A5"), (0.75, "D6"), (1.5, "E6"), (2, "F6"), (3.5, "E6"), (4, "D6"), (4.5, "E6"),
       (5, "F6"), (5.5, "A6"), (6, "E6"), (7, "C#6")]
for i, (b, p) in enumerate(mel):
    nb = mel[i + 1][0] if i + 1 < len(mel) else 8
    cel.n(p, w(b), w(nb) + 0.6, 62 if b in (0, 2, 5.5) else 54)
    flute.n(P(p) - 12, w(b), w(nb) + 0.06, 62)
flute.curve([(15.9, 70), (w(2), 96), (w(8), 74)])
for b0, notes in [(0, ["Bb2", "F3", "D4", "E4", "A4", "D5"]), (2, ["A2", "F3", "C4", "G4", "A4", "C5"]),
                  (4, ["G2", "D3", "Bb3", "F4", "A4", "Bb4"]), (6, ["A2", "E3", "A3", "E4", "A4", "C#5"])]:
    for i, p in enumerate(notes): harp.n(p, w(b0 + i * 0.33), w(b0 + 2) + 1.0, 46, hum=0)
oohs.ch(["D5", "F5", "A5"], w(4), w(6) + 0.2, 46); oohs.ch(["E5", "A5", "C#6"], w(6), 22.9, 46)
oohs.curve([(w(4), 40), (22.4, 72), (23.0, 30)])

# --- the climb
motif(piano, ["A4", "D5", "E5", "F5"], [22.45, 23.2, 23.95, 24.7], 26.5, [46, 48, 50, 54])  # "So he climbed."
motif(piano, ["F4", "Bb4", "C5", "D5"], [26.45, 27.0, 27.55, 28.1], 28.7, [42, 44, 46, 48])
for t0, t1, notes in [(22.4, 26.4, ["D3", "A3", "E4", "F4", "A4", "D5"]), (26.4, 28.6, ["Bb2", "F3", "C4", "D4", "F4", "Bb4"]),
                      (28.6, 31.6, ["G2", "D3", "A3", "Bb3", "D4", "G4"])]:
    flow(harp, notes, t0, t1, 0.44, 42)
trem.ch(["D5", "Eb5"], 28.6, 31.8, 40); trem.curve([(28.6, 10), (30.0, 58), (31.8, 10)])  # the skeletons: a cold shiver
oohs.ch(["G4", "Bb4", "D5"], 31.8, 35.2, 40); oohs.ch(["G4", "C5", "Eb5"], 35.0, 36.5, 44)
oohs.ch(["F4", "Bb4", "D5"], 36.3, 38.0, 46); oohs.ch(["E4", "A4", "C#5"], 37.8, 39.1, 50)
oohs.curve([(31.8, 20), (35.0, 60), (38.9, 82), (39.05, 30)])                                 # voices in the walls
for t, p in [(35.1, "E6"), (36.35, "G6"), (37.85, "A6")]: BELLS.append((t, p, 0.09))           # the carved messages
EERIE.append((39.0, 41.6, ["D3", "Eb4", "A4", "D5"], 0.03))                                    # the skeleton
trem.ch(["Eb5", "A5"], 39.0, 41.8, 40); trem.curve([(39.0, 40), (39.8, 56), (41.8, 0)])
SUB.append((38.8, 42.0, "D1", 0.08))

# --- the one coming down
flow(harp, ["D5", "A4", "F4", "D4", "A3", "F3", "D3"], 40.85, 44.6, 0.52, 42, jitter=0.05)  # descending
motif(cel, ["A5", "D6", "E6"], [44.75, 45.2, 45.65], 47.0, 48)                               # "What's at the top?"
oohs.ch(["D5", "F#5", "A5", "E6"], 46.8, 49.4, 56); oohs.curve([(46.7, 30), (47.4, 82), (49.4, 20)])  # "Glory."
for t, p in [(46.85, "F#6"), (47.2, "A6"), (47.55, "D7"), (47.9, "E7")]: BELLS.append((t, p, 0.08))
SHIMS.append((46.6, 49.6, ["F#5", "A5", "D6"], 0.9))
piano.n("D2", 50.5, 52.5, 34); piano.n("A4", 50.52, 52.5, 30)                                # "No."
horn.curve([(52.6, 84), (54.4, 96), (55.6, 60)])
motif(horn, ["A3", "D4", "E4", "F4"], [52.65, 53.15, 53.65, 54.15], 55.6, [64, 66, 70, 74])   # quiet resolve
flute.n("A5", 52.7, 55.4, 40)

# --- years
for t, p in [(55.05, "A4"), (56.4, "F4"), (57.8, "D4"), (59.3, "E4"), (60.6, "C4")]: piano.n(p, t, t + 3.0, 32)
cello.curve([(62.3, 92), (63.6, 104), (68.4, 62)])
motif(cello, ["A3", "D4", "E4", "D4"], [62.35, 62.9, 63.45, 64.2], 66.6, [62, 64, 68, 54])    # the motif can't reach the top
trem.ch(["Bb4", "C#5"], 66.5, 69.2, 36); trem.curve([(66.5, 0), (68.2, 56), (69.2, 10)])     # "terrified"

# --- the scream
vlns.curve([(69.1, 66), (73.6, 116), (75.2, 40)])
motif(vlns, ["F5", "E5", "D5", "A4"], [69.15, 71.5, 73.0, 74.4], 75.6, [72, 74, 86, 60])     # the motif, falling
vlns.n("D6", 73.0, 74.45, 76)
for t, p in [(70.0, "F6"), (71.9, "E6"), (73.5, "D6")]: piano.n(p, t, t + 2.0, 34)

# --- the voice from above
for t, p in [(75.6, "A5"), (76.5, "D6"), (77.3, "A6")]: BELLS.append((t, p, 0.07))
SHIMS.append((75.2, 78.3, ["A5"], 0.6))
for t0, t1, top in [(78.1, 79.5, ["D5", "F5", "C6"]), (79.5, 80.8, ["C5", "F5", "A5"]),
                    (80.8, 81.6, ["D5", "G5", "B5"]), (81.6, 82.9, ["D5", "F#5", "A5", "D6"])]:
    choir.ch(top, t0, t1 + 0.2, 70); organ.ch([P(x) - 24 for x in top], t0, t1 + 0.15, 50)
choir.curve([(78.1, 30), (81.6, 92), (82.9, 70), (83.6, 20)]); organ.curve([(78.1, 30), (81.6, 70), (83.4, 0)])
motif(cel, ["A5", "D6", "E6", "F#6"], [81.6, 81.95, 82.3, 82.65], 84.0, [56, 58, 60, 64])     # completes — in major
SHIMS.append((78.1, 83.5, ["D6", "F#6", "A6"], 0.7))

# --- "every caterpillar was hearing the same voice" — the motif echoes from everywhere
ECHO = [(85.1, cel, 0, 52), (86.0, flute, -12, 50), (86.9, piano, -12, 40), (87.7, cel, 12, 40),
        (88.4, harp, -12, 44), (89.0, flute, 0, 40), (89.5, piano, 0, 34)]
for t0, trk, sh, v in ECHO:
    motif(trk, [P(x) + sh for x in ["A5", "D6", "E6", "F#6"]], [t0, t0 + 0.32, t0 + 0.64, t0 + 0.96], t0 + 2.2, v)
motif(cel, ["A5", "D6", "E6", "F6"], [89.95, 90.4, 90.85, 91.3], 93.0, 44)                   # …all "almost there": F natural
oohs.ch(["D5", "A5"], 85.0, 89.95, 36); oohs.ch(["D5", "F5", "A5"], 89.9, 93.8, 40)
oohs.curve([(85.0, 30), (88.0, 62), (93.8, 20)])

# --- endless staircase / suitcase / he sits
SHEPARD.append((93.6, 98.0, 0.015))
for t, p in [(96.7, "D5"), (97.4, "C5"), (98.1, "A4")]: piano.n(p, t, t + 2.5, 40)           # the little suitcase
harp.ch(["A2", "D3", "E3", "A3", "D4"], 100.3, 103.5, 40, roll=0.14)                        # he sits down

# --- stillness: waiting, nothing, no wings, no glory
SHIMS.append((101.2, 105.6, ["E5", "A5"], 0.4))
for t, p in [(102.3, "E5"), (104.1, "D5"), (108.6, "F5"), (113.0, "D5")]: piano.n(p, t, t + 3.0, 28)
flow(harp, ["Bb3", "F4", "A4", "D5", "F5", "A4"], 107.3, 111.9, 0.62, 30)                   # the staircase carries on, distantly
halo.ch(["G3", "Bb3", "D4"], 114.8, 117.6, 46); halo.curve([(114.8, 30), (116.4, 70), (117.6, 20)])
motif(cel, ["A5", "D6", "E6"], [117.45, 117.9, 118.35], 120.2, 50)                           # "There were no wings." — never finishes
flute.n("A4", 119.35, 121.0, 34)                                                             # "…no glory."

# --- enough
piano.n("D5", 120.9, 123.5, 46); piano.n("B4", 121.7, 123.5, 42); piano.n("A4", 122.6, 124.0, 44)
oohs.ch(["A4", "C#5", "E5"], 123.0, 126.0, 48); oohs.curve([(123.0, 30), (125.7, 90), (126.0, 40)])
SUN = [(125.8, 128.4), (128.4, 129.9), (129.9, 131.4), (131.4, 133.0), (133.0, 134.68), (134.68, 138.48)]
CHOIR_SUN = [["A4", "D5", "F#5"], ["B4", "D5", "G5"], ["B4", "D5", "F#5"], ["Bb4", "D5", "F5"], ["C5", "E5", "G5"],
             ["A4", "D5", "F#5", "A5"]]
for (t0, t1), top in zip(SUN, CHOIR_SUN):
    choir.ch(top, t0, t1 + 0.12, 82)
    organ.ch([P(x) - 12 for x in top], t0, t1 + 0.1, 52)
    harp.ch(sorted([P(x) - 12 for x in top] + [P(x) for x in top]), t0, t1 + 1.5, 46, roll=0.09)
choir.curve([(125.8, 64), (128.4, 84), (134.68, 108), (137.0, 84), (138.6, 40)])
organ.curve([(125.8, 40), (134.68, 76), (138.6, 20)])
SUNMEL = [(125.8, "A4"), (126.45, "D5"), (127.1, "E5"), (127.75, "F#5"), (128.4, "A5"), (129.9, "B5"),
          (131.4, "D6"), (133.0, "E6"), (134.68, "F#6")]
for i, (t, p) in enumerate(SUNMEL):
    e = SUNMEL[i + 1][0] + 0.08 if i + 1 < len(SUNMEL) else 138.3
    vlns.n(p, t, e, 82); flute.n(p, t, e, 70)
    horn.n(P(p) - 12, t, e, 64)
vlns.curve([(125.8, 64), (128.4, 88), (134.68, 112), (136.6, 92), (138.4, 30)])
horn.curve([(125.8, 60), (134.68, 96), (138.4, 30)])
flute.curve([(125.8, 60), (134.68, 92), (138.4, 30)])
for t, p in [(128.45, "A6"), (129.95, "B6"), (131.45, "D7"), (133.05, "E7"), (134.7, "F#7")]: BELLS.append((t, p, 0.06))
SHIMS.append((125.8, 139.0, ["D6", "F#6", "A6"], 1.0))

# --- the question
cel.n("A5", 138.6, 140.6, 38)                                                                # "…he wondered"
for t, p in [(141.0, "F#5"), (142.5, "D5"), (144.0, "B4"), (145.4, "A4")]: piano.n(p, t, t + 2.8, 32)
halo.ch(["D4", "F4", "A4", "E5"], 146.0, 151.0, 44); halo.curve([(145.9, 20), (148.0, 64), (151.0, 30)])
motif(piano, ["A4", "D5", "E5"], [148.2, 149.1, 150.0], 156.0, [46, 48, 52])                  # …and no answer
flow(harp, ["C3", "G3", "D4", "E4", "G4", "D5"], 150.5, 154.8, 0.6, 34)
for t, p in [(155.05, "E6"), (157.6, "A6")]: BELLS.append((t, p, 0.06))
SHIMS.append((146.0, 160.5, ["E5", "A5", "E6"], 0.6))
SUB.append((154.0, 160.6, "D1", 0.05))
AIR += [(0, 162, 0.006)]

# ================================================================ SYNTH LAYERS
def put(buf, t0, sig):
    i = int(t0 * SR)
    if i >= N: return
    j = min(N, i + len(sig)); buf[i:j] += sig[:j - i]
def lp(x, f, o=2): return sosfilt(butter(o, f, "lowpass", fs=SR, output="sos"), x, axis=0)
def hp(x, f, o=2): return sosfilt(butter(o, f, "highpass", fs=SR, output="sos"), x, axis=0)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "bandpass", fs=SR, output="sos"), x, axis=0)
def env_ar(n, a, r):
    tt = np.arange(n) / SR; return np.minimum(1, tt / a) * np.minimum(1, (tt[-1] - tt) / r + 1e-3)

pad = np.zeros((N, 2)); shim = np.zeros((N, 2)); fx = np.zeros((N, 2)); sub = np.zeros((N, 2))
for t0, t1, notes in PADS:                       # warm detuned pad, gently breathing
    t1 += 1.2; n = int((t1 - t0) * SR); tt = np.arange(n) / SR
    for c in range(2):
        x = np.zeros(n)
        for p in notes:
            for dc in (-7, 0, 7):
                f = hz(p) * 2 ** ((dc + (c * 2 - 1) * 2) / 1200)
                x += 2 * ((f * tt + rng.random()) % 1.0) - 1
        x = lp(x, 900 + 500 * dyn(t0 + tt.mean()), 2) / len(notes)
        x *= env_ar(n, 1.4, 1.6) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.13 * tt + c))
        x *= dyn(t0 + tt)
        put(pad[:, c], t0, x * 0.05)
for t0, t1, notes, g in SHIMS:                   # glassy high partials ("shimmer")
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR
    for c in range(2):
        x = sum(np.sin(2 * np.pi * np.cumsum(hz(p) * (1 + 0.002 * np.sin(2 * np.pi * (4.7 + c * 0.6) * tt))) / SR + rng.random() * 6)
                * (0.6 + 0.4 * np.sin(2 * np.pi * rng.uniform(0.07, 0.2) * tt + rng.random() * 6)) for p in notes)
        put(shim[:, c], t0, x * env_ar(n, 2.0, 2.0) * 0.012 * g)
for t, p, g in BELLS:                            # FM glass bells
    n = int(4.0 * SR); tt = np.arange(n) / SR; f = hz(p)
    idx = 2.2 * np.exp(-tt / 0.5)
    x = np.sin(2 * np.pi * f * tt + idx * np.sin(2 * np.pi * f * 3.5 * tt)) * np.exp(-tt / 1.4) * np.minimum(1, tt / 0.004)
    pan = rng.uniform(-0.6, 0.6)
    put(shim[:, 0], t, x * g * 0.5 * (1 - pan)); put(shim[:, 1], t, x * g * 0.5 * (1 + pan))
for t0, t1, g in SWELLS:                         # soft breath swells into a moment
    n = int((t1 - t0) * SR); x = np.arange(n) / n
    for c in range(2): put(fx[:, c], t0, bp(rng.standard_normal(n), 500, 5000) * x ** 3 * g)
for t0, t1, notes, g in EERIE:                   # slow-beating cluster
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR
    for c in range(2):
        x = sum(np.sin(2 * np.pi * hz(p) * (1 + (0.004 if c else -0.004)) * tt) for p in notes)
        put(fx[:, c], t0, x * env_ar(n, 0.35, 1.6) * g)
for t0, t1, g in SHEPARD:                        # the endless staircase
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR; out = np.zeros(n)
    for k in range(7):
        pos = (k + tt / 5.0) % 7; f = 110 * 2 ** pos
        out += np.exp(-0.5 * ((pos - 3.5) / 1.2) ** 2) * np.sin(2 * np.pi * np.cumsum(f) / SR)
    out *= env_ar(n, 1.5, 1.8) * g
    put(fx[:, 0], t0, out); put(fx[:, 1], t0, out)
for t0, t1, p, g in SUB:
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * hz(p) * tt) * env_ar(n, 1.2, 1.5) * g
    put(sub[:, 0], t0, x); put(sub[:, 1], t0, x)
for t0, t1, g in AIR:
    n = int((t1 - t0) * SR)
    for c in range(2): put(fx[:, c], t0, bp(rng.standard_normal(n), 5000, 11000) * g * (0.5 + dyn(t0 + np.arange(n) / SR)))

# ================================================================ RENDER + MIX
print("rendering orchestra stems …")
stems = {name: t.render() for name, t in T.items() if t.notes}
stems.update({"syn_pad": pad.astype(np.float32), "syn_shimmer": shim.astype(np.float32),
              "syn_fx": fx.astype(np.float32), "syn_sub": sub.astype(np.float32)})
MIX = {  # gain dB, reverb send
    "strings_low": (1, .55), "strings_high": (1, .60), "violins": (1, .60), "tremolo": (-4, .65),
    "cello_solo": (5, .55), "horn": (-2, .60), "choir": (0, .65), "oohs": (3, .70), "organ": (-6, .60),
    "piano": (0, .55), "celesta": (6, .70), "harp": (0, .60), "flute": (-2, .60), "halo_pad": (-4, .60),
    "syn_pad": (0, .50), "syn_shimmer": (0, .85), "syn_fx": (-2, .70), "syn_sub": (-4, 0.0)}

# large, soft hall (~5.5 s), darker tail, gentle pre-delay
L = int(7.0 * SR); tt = np.arange(L) / SR
ir = np.zeros((L, 2))
for c in range(2):
    nz = rng.standard_normal(L)
    ir[:, c] = lp(nz, 6000) * np.exp(-tt * 6.9 / 5.5) * 0.55 + lp(nz, 1500) * np.exp(-tt * 6.9 / 4.0) * 0.45
ir *= np.minimum(1, tt / 0.08)[:, None]                         # soft onset = diffuse, dreamy
pre = int(0.035 * SR); ir = np.vstack([np.zeros((pre, 2)), ir])[:L]
ir /= np.sqrt((ir ** 2).sum(0, keepdims=True)) * 2.6

dry = np.zeros((N, 2)); send = np.zeros((N, 2))
for k, x in stems.items():
    g, r = MIX.get(k, (0, .5)); x = x * 10 ** (g / 20)
    dry += x; send += x * r
wet = np.stack([fftconvolve(send[:, c], ir[:, c])[:N] for c in range(2)], 1)
mus = hp(dry * 0.8 + wet, 30)
env = np.sqrt(lp(np.mean(mus ** 2, 1), 2.0, 1).clip(1e-12))           # gentle glue
thr = 10 ** (-16 / 20); gr = np.where(env > thr, (thr / env) ** (1 - 1 / 1.6), 1.0)
mus *= gr[:, None]
mus /= np.abs(mus).max() + 1e-9
mus = np.tanh(mus * 1.05) / np.tanh(1.05) * 0.89
sf.write(f"{OUT}/score_music_only.wav", mus.astype(np.float32), SR, subtype="PCM_24")
print("music written")

# ================================================================ VO-AWARE MIX
if len(sys.argv) > 1:
    vid = sys.argv[1]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vid, "-vn", "-ac", "2", "-ar", str(SR), f"{OUT}/vo.wav"], check=True)
    vo, _ = sf.read(f"{OUT}/vo.wav"); vo = np.vstack([vo, np.zeros((max(0, N - len(vo)), 2))])[:N]
    FADER = [(0, 0), (15.0, 0), (15.8, 3), (22.0, 3), (22.6, 1), (52.4, 1), (52.7, 4), (54.9, 4), (55.2, 0),
             (128.3, 0), (128.6, 3), (134.5, 3), (135.0, 0), (147.4, 0), (148.4, 4), (162, 4)]
    ft, fv = zip(*FADER)
    mus = mus * (10 ** (np.interp(np.arange(N) / SR, ft, fv) / 20))[:, None]
    # adaptive ducking: music stays >= GAP dB under the voice while it speaks, opens in the gaps
    GAP, hop = 13.0, int(0.01 * SR)
    def frames_db(x, win):
        e = np.add.reduceat(x ** 2, np.arange(0, N, hop)) / hop
        k = max(1, int(win / 0.01)); e = np.convolve(e, np.ones(k) / k, "same")
        return 10 * np.log10(e + 1e-12)
    act = np.clip((frames_db(bp(vo.mean(1), 200, 4000), 0.02) + 44) / 12, 0, 1)
    act = np.maximum.reduce([np.roll(act, -i) for i in range(0, 12)])
    vo_db = frames_db(vo.mean(1), 1.2); mu_db = frames_db(mus.mean(1), 0.4)
    need = np.clip(mu_db - (vo_db - GAP), 0, 24) * act + 1.0 * act
    sm = np.zeros_like(need); y = 0.0
    for i, x in enumerate(need):
        y += (x - y) * (0.25 if x > y else 0.015); sm[i] = y
    red = np.interp(np.arange(N) / hop, np.arange(len(sm)), sm)
    g_all = 10 ** (-red / 20); g_mid = 10 ** (-2.5 * np.interp(np.arange(N) / hop, np.arange(len(act)), act) / 20)
    lo_b = lp(mus, 250); hi_b = hp(mus, 4000); mid_b = mus - lo_b - hi_b
    ducked = (lo_b + hi_b + mid_b * g_mid[:, None]) * g_all[:, None]
    final = vo + ducked
    from scipy.ndimage import maximum_filter1d                         # look-ahead peak limiter
    blk = 44; pk = np.abs(final).max(1); nb = len(pk) // blk + 1
    pkb = maximum_filter1d(np.array([pk[i * blk:(i + 1) * blk].max() if i * blk < len(pk) else 0 for i in range(nb)]), 7)
    tgt = np.minimum(1.0, 0.94 / (pkb + 1e-9)); gs = np.empty_like(tgt); y = 1.0
    for i, x in enumerate(tgt):
        y = x if x < y else y + (x - y) * 0.01; gs[i] = y
    final *= np.repeat(gs, blk)[:len(final), None]
    sf.write(f"{OUT}/final_mix.wav", final.astype(np.float32), SR, subtype="PCM_24")
    sf.write(f"{OUT}/score_ducked.wav", ducked.astype(np.float32), SR, subtype="PCM_24")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vid, "-i", f"{OUT}/final_mix.wav", "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", f"{OUT}/the_climb_scored.mp4"], check=True)
    print("video written")

    # ------------------------------------------------------------ deliverables
    subprocess.run(["rm", "-rf", f"{HERE}/midi"]); os.makedirs(f"{HERE}/midi", exist_ok=True)
    for name in T:
        if os.path.exists(f"{OUT}/{name}.mid") and T[name].notes:
            subprocess.run(["cp", f"{OUT}/{name}.mid", f"{HERE}/midi/{name}.mid"], check=True)
    subprocess.run(["cp", f"{OUT}/the_climb_scored.mp4", f"{HERE}/the_climb_scored.mp4"], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{OUT}/score_music_only.wav", "-t", "161.5",
                    "-sample_fmt", "s16", f"{HERE}/the_climb_score.flac"], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{OUT}/score_ducked.wav", "-t", "161.5",
                    "-c:a", "aac", "-b:a", "320k", f"{HERE}/the_climb_score_film_stem.m4a"], check=True)
    print("deliverables written")
