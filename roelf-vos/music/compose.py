#!/usr/bin/env python3
"""
Original score for "The Story of Roelf Vos" — synthesised from scratch with numpy/scipy.

No samples, no loops: every sound (piano, celesta, strings, flute, accordion, clarinet,
horn, harp, pizzicato, timpani, drums, choir, wind) is built here from sine partials,
filtered noise and envelopes, then mixed through a synthetic stereo hall reverb.

The piece runs at 100 BPM in 4/4, so one bar is exactly 2.4 s. The animation in
../js uses the same bar grid (see js/timing.js), which keeps every scene change,
pop and sparkle on the music.

Usage:  python3 compose.py            -> ../assets/audio/score.wav + score.m4a
"""
import os
import subprocess
import sys
import wave

import numpy as np
from scipy import signal

SR = 44100
BPM = 100
BEAT = 60.0 / BPM  # 0.6 s
BAR = 4 * BEAT     # 2.4 s
TOTAL = 118.0
N = int(TOTAL * SR)
RNG = np.random.default_rng(1921)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "..", "assets", "audio")


def b(bar, beat=0.0):
    """Time in seconds of a bar/beat position."""
    return (bar * 4 + beat) * BEAT


_NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def midi(name):
    if isinstance(name, (int, float)):
        return name
    letter, rest = name[0], name[1:]
    acc = 0
    while rest and rest[0] in "#b":
        acc += 1 if rest[0] == "#" else -1
        rest = rest[1:]
    return 12 * (int(rest) + 1) + _NOTE[letter] + acc


def down(n, octaves=1):
    return midi(n) - 12 * octaves


def hz(n):
    return 440.0 * 2 ** ((midi(n) - 69) / 12.0)


def tvec(n):
    return np.arange(n) / SR


def butter(kind, freq, order=2):
    if kind == "band":
        return signal.butter(order, [f / (SR / 2) for f in freq], btype="band", output="sos")
    return signal.butter(order, freq / (SR / 2), btype=kind, output="sos")


def filt(x, kind, freq, order=2):
    return signal.sosfilt(butter(kind, freq, order), x)


def smooth_attack(t, a):
    """Raised-cosine attack: 0 -> 1 over a seconds."""
    if a <= 0:
        return np.ones_like(t)
    x = np.clip(t / a, 0, 1)
    return 0.5 - 0.5 * np.cos(np.pi * x)


def release_env(t, start, r):
    """1 until `start`, then exponential-ish release to 0 by start + r."""
    e = np.ones_like(t)
    m = t > start
    x = (t[m] - start) / r
    e[m] = np.clip(np.exp(-4.0 * x) * (1 - x), 0, 1)
    return e


def end_fade(sig, ms=6):
    k = min(len(sig), int(SR * ms / 1000))
    if k > 1:
        sig[-k:] *= np.linspace(1, 0, k)
    return sig


# --------------------------------------------------------------------------- instruments

def piano(f, dur, vel=0.7):
    T0 = float(np.clip(3.6 * (220.0 / f) ** 0.5, 0.5, 8.0))
    length = min(dur, T0 * 2.2) + 0.35
    n = int(length * SR)
    t = tvec(n)
    out = np.zeros(n)
    B = 0.00032
    for k in range(1, 16):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 11000:
            break
        amp = (1.0 / k ** 1.25) * np.exp(-(k - 1) * (0.55 - 0.4 * vel))
        Tk = T0 / (1 + 0.32 * (k - 1))
        env = 0.62 * np.exp(-t / (Tk * 0.22)) + 0.38 * np.exp(-t / Tk)
        ph = RNG.uniform(0, 2 * np.pi)
        out += amp * env * 0.5 * (np.sin(2 * np.pi * fk * 1.00035 * t + ph) + np.sin(2 * np.pi * fk * 0.99965 * t + ph * 1.3))
    hammer = filt(RNG.standard_normal(n), "band", (1500, 5000)) * np.exp(-t / 0.012) * 0.05 * vel
    out = (out + hammer) * smooth_attack(t, 0.003) * release_env(t, min(dur, length - 0.35), 0.3)
    return end_fade(out * vel)


def celesta(f, dur, vel=0.6):
    length = max(dur, 0.25) + 2.2
    n = int(length * SR)
    t = tvec(n)
    sc = (523.0 / f) ** 0.3
    parts = [(1, 1.0, 1.9), (2.0, 0.28, 0.9), (3.0, 0.1, 0.55), (4.17, 0.09, 0.32), (5.43, 0.04, 0.2), (7.9, 0.015, 0.1)]
    out = np.zeros(n)
    for r, a, T in parts:
        if f * r > 15000:
            continue
        out += a * np.exp(-t / (T * sc)) * np.sin(2 * np.pi * f * r * t + RNG.uniform(0, 6.28))
    out *= smooth_attack(t, 0.0025) * release_env(t, dur + 1.2, 1.0)
    return end_fade(out * vel)


def glock(f, dur, vel=0.6):
    n = int(2.4 * SR)
    t = tvec(n)
    out = np.zeros(n)
    for r, a, T in [(1, 1, 1.8), (2.76, 0.42, 0.6), (5.40, 0.2, 0.3), (8.93, 0.08, 0.15)]:
        if f * r < 16000:
            out += a * np.exp(-t / T) * np.sin(2 * np.pi * f * r * t)
    return end_fade(out * smooth_attack(t, 0.001) * vel)


def strings(f, dur, vel=0.5, att=0.35, rel=0.8, voices=3, bright=1.0, trem=0.0, vib=0.11, cents=7.0):
    n = int((dur + rel) * SR)
    t = tvec(n)
    out = np.zeros(n)
    vib_on = smooth_attack(t, 0.5) * np.clip((t - 0.15) / 0.4, 0, 1)
    nh = int(min(28, 7500 / f))
    fc = 1500 * bright + 1.5 * f
    for v in range(voices):
        det = (v - (voices - 1) / 2) * cents
        rate = 4.9 + 0.37 * v
        fi = f * 2 ** (det / 1200) * 2 ** (vib * vib_on * np.sin(2 * np.pi * rate * t + v * 1.7) / 12)
        phase = 2 * np.pi * np.cumsum(fi) / SR + RNG.uniform(0, 6.28)
        for k in range(1, nh + 1):
            a = (1.0 / k) / (1 + (k * f / fc) ** 2)
            out += a * np.sin(k * phase)
    env = smooth_attack(t, att) * release_env(t, dur, rel)
    if trem:
        out *= 1 - trem * 0.5 * (1 + np.sin(2 * np.pi * 11.5 * t))
    return end_fade(out * env * vel / voices)


def flute(f, dur, vel=0.5):
    rel = 0.16
    n = int((dur + rel) * SR)
    t = tvec(n)
    vib = 1 + 0.0035 * np.clip((t - 0.2) / 0.3, 0, 1) * np.sin(2 * np.pi * 5.1 * t)
    phase = 2 * np.pi * np.cumsum(f * vib) / SR
    out = np.sin(phase) + 0.3 * np.sin(2 * phase) + 0.11 * np.sin(3 * phase) + 0.04 * np.sin(4 * phase)
    breath = filt(RNG.standard_normal(n), "band", (min(f * 1.5, 9000), min(f * 4.5, 15000))) * 0.07
    chiff = filt(RNG.standard_normal(n), "band", (2000, 7000)) * np.exp(-t / 0.02) * 0.08
    env = smooth_attack(t, 0.06) * release_env(t, dur, rel)
    return end_fade((out + breath + chiff) * env * vel)


def clarinet(f, dur, vel=0.5):
    rel = 0.12
    n = int((dur + rel) * SR)
    t = tvec(n)
    vib = 1 + 0.002 * np.clip((t - 0.25) / 0.3, 0, 1) * np.sin(2 * np.pi * 5.4 * t)
    phase = 2 * np.pi * np.cumsum(f * vib) / SR
    out = np.zeros(n)
    for k, a in [(1, 1), (2, 0.06), (3, 0.42), (4, 0.04), (5, 0.22), (6, 0.03), (7, 0.11), (9, 0.05)]:
        if f * k < 9000:
            out += a * np.sin(k * phase)
    env = smooth_attack(t, 0.04) * release_env(t, dur, rel)
    return end_fade(filt(out * env * vel, "low", 4500))


def accordion(f, dur, vel=0.4):
    rel = 0.07
    n = int((dur + rel) * SR)
    t = tvec(n)
    out = np.zeros(n)
    nh = int(min(24, 5000 / f))
    for det in (-9.0, 0.0, 9.0):
        ff = f * 2 ** (det / 1200)
        ph = RNG.uniform(0, 6.28)
        for k in range(1, nh + 1):
            out += (1.0 / k ** 0.95) * np.sin(2 * np.pi * ff * k * t + ph * k)
    env = smooth_attack(t, 0.025) * release_env(t, dur, rel)
    return end_fade(filt(out * env * vel / 3, "low", 3200))


def horn(f, dur, vel=0.5, att=0.12, rel=0.35):
    n = int((dur + rel) * SR)
    t = tvec(n)
    env = smooth_attack(t, att) * release_env(t, dur, rel)
    vib = 1 + 0.0025 * np.clip((t - 0.3) / 0.4, 0, 1) * np.sin(2 * np.pi * 4.8 * t)
    phase = 2 * np.pi * np.cumsum(f * vib) / SR
    out = np.zeros(n)
    for k in range(1, int(min(16, 4500 / f)) + 1):
        out += (1.0 / k ** 1.7) * env ** (1 + 0.45 * (k - 1) * (1.1 - vel)) * np.sin(k * phase)
    return end_fade(filt(out * vel, "low", 3000))


def pluck(f, dur, vel=0.6, T0=None, pos=0.18, roll=1.6, cutoff=9000):
    if T0 is None:
        T0 = float(np.clip(0.55 * (220.0 / f) ** 0.5, 0.12, 1.4))
    length = min(dur + 0.25, T0 * 5 + 0.05)
    n = int(length * SR)
    t = tvec(n)
    out = np.zeros(n)
    for k in range(1, 22):
        fk = f * k * (1 + 0.0004 * k * k)
        if fk > cutoff:
            break
        a = abs(np.sin(k * np.pi * pos)) / k ** roll
        out += a * np.exp(-t / (T0 / k ** 0.6)) * np.sin(2 * np.pi * fk * t)
    out *= smooth_attack(t, 0.002) * release_env(t, length - 0.06, 0.06)
    return end_fade(out * vel)


def pizz(f, dur, vel=0.6):
    return pluck(f, min(dur, 0.6), vel, pos=0.22, roll=1.7)


def harp(f, dur, vel=0.5):
    return pluck(f, dur + 1.5, vel, T0=float(np.clip(1.5 * (220.0 / f) ** 0.4, 0.4, 3)), pos=0.3, roll=1.9)


def upright(f, dur, vel=0.7):
    return pluck(f, min(dur, 1.2), vel, T0=0.9, pos=0.25, roll=2.1, cutoff=3000)


def timpani(f, dur, vel=0.7):
    n = int(2.2 * SR)
    t = tvec(n)
    fi = f * (1 + 0.025 * np.exp(-t / 0.05))
    ph = 2 * np.pi * np.cumsum(fi) / SR
    out = np.zeros(n)
    for r, a, T in [(1, 1, 1.3), (1.5, 0.55, 0.8), (1.98, 0.3, 0.6), (2.44, 0.18, 0.45), (2.9, 0.08, 0.3)]:
        out += a * np.exp(-t / T) * np.sin(r * ph)
    out += filt(RNG.standard_normal(n), "low", 1200) * np.exp(-t / 0.03) * 0.6
    return end_fade(out * smooth_attack(t, 0.002) * vel)


def kick(f=None, dur=0.4, vel=0.8):
    n = int(0.5 * SR)
    t = tvec(n)
    fi = 48 + 75 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(fi) / SR
    out = np.sin(ph) * np.exp(-t / 0.22) + filt(RNG.standard_normal(n), "band", (1500, 5000)) * np.exp(-t / 0.004) * 0.15
    return end_fade(out * smooth_attack(t, 0.001) * vel)


def brush(f=None, dur=0.2, vel=0.5):
    n = int(0.35 * SR)
    t = tvec(n)
    noise = filt(RNG.standard_normal(n), "band", (900, 7000))
    out = noise * np.exp(-t / 0.085) * smooth_attack(t, 0.006) + 0.35 * np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.04)
    return end_fade(out * vel)


def shaker(f=None, dur=0.1, vel=0.3):
    n = int(0.12 * SR)
    t = tvec(n)
    out = filt(RNG.standard_normal(n), "high", 5500) * smooth_attack(t, 0.012) * np.exp(-t / 0.035)
    return end_fade(out * vel)


def tamb(f=None, dur=0.2, vel=0.3):
    n = int(0.35 * SR)
    t = tvec(n)
    out = filt(RNG.standard_normal(n), "high", 7000) * np.exp(-t / 0.07)
    for fr in (5200, 7100, 9050):
        out += 0.12 * np.sin(2 * np.pi * fr * t) * np.exp(-t / 0.11)
    return end_fade(out * smooth_attack(t, 0.002) * vel)


def woodblock(f=900, dur=0.1, vel=0.5):
    n = int(0.15 * SR)
    t = tvec(n)
    out = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.03) + 0.4 * np.sin(2 * np.pi * f * 1.52 * t) * np.exp(-t / 0.015)
    return end_fade(out * smooth_attack(t, 0.0008) * vel)


def crash(f=None, dur=2.5, vel=0.4):
    n = int(3.0 * SR)
    t = tvec(n)
    out = filt(RNG.standard_normal(n), "high", 3200) * np.exp(-t / 1.1)
    for fr in (3150, 4420, 5870, 7330):
        out += 0.05 * np.sin(2 * np.pi * fr * t + RNG.uniform(0, 6)) * np.exp(-t / 0.9)
    return end_fade(out * smooth_attack(t, 0.002) * vel)


def swell(f=None, dur=2.0, vel=0.3):
    """Reverse-cymbal style swell that peaks at `dur`."""
    n = int((dur + 0.15) * SR)
    t = tvec(n)
    noise = filt(RNG.standard_normal(n), "high", 2500)
    env = np.clip(t / dur, 0, 1) ** 2.6 * release_env(t, dur, 0.15)
    return end_fade(noise * env * vel)


def triangle(f=None, dur=1.0, vel=0.3):
    n = int(1.8 * SR)
    t = tvec(n)
    out = sum(a * np.sin(2 * np.pi * fr * t) * np.exp(-t / T) for fr, a, T in [(1760, 1, 1.2), (4750, 0.5, 0.8), (8980, 0.25, 0.5)])
    return end_fade(out * smooth_attack(t, 0.001) * vel)


def choir(f, dur, vel=0.4, att=0.8, rel=1.2):
    n = int((dur + rel) * SR)
    t = tvec(n)
    out = np.zeros(n)
    formants = [(730, 110, 1.0), (1090, 140, 0.55), (2440, 220, 0.25), (3400, 300, 0.1)]
    for v in range(4):
        det = (v - 1.5) * 6
        fi = f * 2 ** (det / 1200) * (1 + 0.004 * np.sin(2 * np.pi * (5.3 + 0.3 * v) * t + v))
        ph = 2 * np.pi * np.cumsum(fi) / SR + RNG.uniform(0, 6)
        for k in range(1, int(4000 / f) + 1):
            fk = k * f
            w = 0.08 / k + sum(g * np.exp(-(((fk - F) / bw) ** 2)) for F, bw, g in formants)
            out += w * np.sin(k * ph)
    env = smooth_attack(t, att) * release_env(t, dur, rel)
    breath = filt(RNG.standard_normal(n), "band", (600, 3000)) * 0.015
    return end_fade((out / 4 + breath) * env * vel)


def boom(f=None, dur=2.0, vel=0.6):
    n = int(2.6 * SR)
    t = tvec(n)
    out = filt(RNG.standard_normal(n), "low", 160, 4) * np.exp(-t / 0.7) * 3 + np.sin(2 * np.pi * 36 * t) * np.exp(-t / 0.5)
    return end_fade(out * smooth_attack(t, 0.01) * vel)


def shutter(f=None, dur=0.1, vel=0.5):
    """Camera shutter: two tiny mechanical clicks."""
    n = int(0.18 * SR)
    t = tvec(n)
    out = np.zeros(n)
    for off, g in ((0.0, 1.0), (0.055, 0.7)):
        k = int(off * SR)
        burst = filt(RNG.standard_normal(n - k), "band", (1800, 7000)) * np.exp(-tvec(n - k) / 0.006)
        out[k:] += burst * g
    return end_fade(out * vel)


def ship_horn(f=None, dur=1.6, vel=0.5):
    """A distant steamer horn on D, with a slow swell and a breathy edge."""
    n = int((dur + 0.6) * SR)
    t = tvec(n)
    out = np.zeros(n)
    for base in (hz("D2"), hz("A2")):
        ph = 2 * np.pi * base * t * (1 + 0.002 * np.sin(2 * np.pi * 3 * t))
        for k in range(1, 9):
            out += (1.0 / k ** 1.3) * np.sin(k * ph)
    out = filt(out, "low", 1200) + filt(RNG.standard_normal(n), "band", (200, 900)) * 0.05
    env = smooth_attack(t, 0.25) * release_env(t, dur, 0.6)
    return end_fade(out * env * vel)


def thud(f=None, dur=0.5, vel=0.7):
    n = int(0.6 * SR)
    t = tvec(n)
    fi = 70 + 90 * np.exp(-t / 0.02)
    out = np.sin(2 * np.pi * np.cumsum(fi) / SR) * np.exp(-t / 0.12) + filt(RNG.standard_normal(n), "low", 900) * np.exp(-t / 0.03) * 0.8
    return end_fade(out * smooth_attack(t, 0.001) * vel)


# --------------------------------------------------------------------------- tracks & mixing

class Track:
    def __init__(self, name, gain=1.0, pan=0.0, rev=0.25, delay=0.0, lp=None, hp=None):
        self.name, self.gain, self.pan, self.rev, self.delay = name, gain, pan, rev, delay
        self.lp, self.hp = lp, hp
        self.buf = np.zeros((2, N + SR * 4))

    def put(self, start, sig, pan=None, gain=1.0):
        p = self.pan if pan is None else pan
        i = int(round(start * SR))
        if i < 0:
            sig = sig[-i:]
            i = 0
        j = min(i + len(sig), self.buf.shape[1])
        sig = sig[: j - i]
        th = (p + 1) * np.pi / 4
        self.buf[0, i:j] += sig * np.cos(th) * gain
        self.buf[1, i:j] += sig * np.sin(th) * gain


TRACKS = {}


def track(name, **kw):
    TRACKS[name] = Track(name, **kw)
    return TRACKS[name]


def play(tr, inst, start, notes, dur, vel=0.6, pan=None, **kw):
    """Play one note or a list of notes (a chord)."""
    if not isinstance(notes, (list, tuple)):
        notes = [notes]
    for nn in notes:
        f = hz(nn) if nn is not None else None
        TRACKS[tr].put(start, inst(f, dur, vel, **kw) if kw else inst(f, dur, vel), pan=pan)


def seq(tr, inst, bar, events, vel=0.6, pan=None, **kw):
    """events: list of (beat_offset, note_or_chord, dur_beats[, vel])."""
    for ev in events:
        beat, nn, d = ev[0], ev[1], ev[2]
        v = ev[3] if len(ev) > 3 else vel
        if nn is None:
            continue
        play(tr, inst, b(bar, beat), nn, d * BEAT, v, pan=pan, **kw)


def melody(tr, inst, bar, line, vel=0.6, pan=None, legato=1.0, **kw):
    """line: list of (note, dur_beats); notes None are rests. Starts at bar beat 0."""
    beat = 0.0
    for item in line:
        nn, d = item[0], item[1]
        v = item[2] if len(item) > 2 else vel
        if nn is not None:
            play(tr, inst, b(bar, beat), nn, d * BEAT * legato, v, pan=pan, **kw)
        beat += d


# Voicings used by the pads
V = {
    "D": ["D3", "A3", "D4", "F#4"], "Dadd9": ["D3", "A3", "E4", "F#4"], "D/F#": ["F#3", "A3", "D4"],
    "D7": ["D3", "A3", "C4", "F#4"], "Bm": ["B2", "F#3", "B3", "D4"], "Bm7": ["B2", "F#3", "A3", "D4"],
    "Bmadd9": ["B2", "F#3", "C#4", "D4"], "G": ["G2", "D3", "G3", "B3"], "Gmaj7": ["G2", "D3", "F#3", "B3"],
    "A": ["A2", "E3", "A3", "C#4"], "Asus4": ["A2", "E3", "A3", "D4"], "A7": ["A2", "E3", "G3", "C#4"],
    "A/C#": ["C#3", "E3", "A3", "E4"], "Em": ["E3", "G3", "B3", "E4"], "Em7": ["E3", "G3", "B3", "D4"],
    "F#": ["F#2", "C#3", "F#3", "A#3"], "F#sus4": ["F#2", "C#3", "F#3", "B3"], "C": ["C3", "G3", "C4", "E4"],
    "Bb": ["Bb2", "F3", "Bb3", "D4"], "A7sus4": ["A2", "E3", "G3", "D4"],
}
ROOT = {k: k.split("/")[1] if "/" in k else k[:2] if len(k) > 1 and k[1] in "#b" else k[0] for k in V}


def bass_note(ch, octave=2):
    r = ROOT[ch]
    return f"{r}{octave}"


def pad(bar, chords, vel=0.35, tr="pad", att=0.6, bright=0.8, beats_per=4):
    """chords: list of chord names, each lasting beats_per beats, starting at bar."""
    for i, ch in enumerate(chords):
        if ch is None:
            continue
        start = b(bar, i * beats_per)
        play(tr, strings, start, V[ch], beats_per * BEAT + 0.05, vel, att=att, rel=0.9, bright=bright)


def arp(tr, inst, bar, chord_notes, beats, step=0.5, vel=0.4, pattern=None, start_beat=0.0, dur=None, pan=None):
    pattern = pattern or list(range(len(chord_notes)))
    k = 0
    beat = start_beat
    while beat < start_beat + beats - 1e-6:
        nn = chord_notes[pattern[k % len(pattern)]]
        play(tr, inst, b(bar, beat), nn, (dur or step) * BEAT, vel, pan=pan)
        beat += step
        k += 1


# --------------------------------------------------------------------------- the score

def compose():
    track("pad", gain=0.55, pan=0.0, rev=0.45)
    track("vln", gain=0.7, pan=-0.2, rev=0.4)
    track("cello", gain=0.75, pan=0.25, rev=0.4)
    track("lowstr", gain=0.48, pan=0.1, rev=0.35)
    track("piano", gain=0.75, pan=0.1, rev=0.35)
    track("celesta", gain=0.5, pan=-0.15, rev=0.5, delay=0.28)
    track("glock", gain=0.35, pan=0.3, rev=0.45, delay=0.15)
    track("flute", gain=0.42, pan=-0.3, rev=0.42)
    track("clar", gain=0.42, pan=-0.25, rev=0.35)
    track("accord", gain=0.32, pan=0.35, rev=0.25)
    track("horn", gain=0.55, pan=-0.1, rev=0.5)
    track("harp", gain=0.42, pan=0.4, rev=0.45)
    track("pizz", gain=0.5, pan=0.3, rev=0.3)
    track("bass", gain=0.72, pan=0.0, rev=0.15)
    track("timp", gain=0.45, pan=0.0, rev=0.4)
    track("drums", gain=0.5, pan=0.0, rev=0.18)
    track("perc", gain=0.42, pan=0.25, rev=0.25)
    track("cym", gain=0.3, pan=0.0, rev=0.4)
    track("choir", gain=0.4, pan=0.0, rev=0.6)
    track("fx", gain=0.36, pan=0.0, rev=0.5)
    track("sparkle", gain=0.26, pan=0.0, rev=0.6, delay=0.35)

    theme_a = [("A5", 1.5), ("F#5", 0.5), ("A5", 1), ("D6", 1), ("C#6", 3), ("B5", 0.5), ("A5", 0.5)]
    theme_b = [("B5", 1.5), ("G5", 0.5), ("B5", 1), ("E6", 1), ("D6", 2), ("C#6", 2)]

    # ---- 1. Title (bars 0-2): a music-box statement of the theme ------------------------
    play("piano", piano, b(0), ["D2", "D3"], 4 * BAR, 0.45)
    pad(0, ["Dadd9", "Bm7", "Gmaj7"], vel=0.28, att=1.4, bright=0.6)
    melody("celesta", celesta, 0, [(None, 0.5)] + [(n, d * 0.9) for n, d in theme_a[:4]] + [("C#6", 2.5), ("B5", 0.5), ("A5", 0.5)], vel=0.55)
    melody("celesta", celesta, 2, [("B5", 1.5), ("G5", 0.5), ("B5", 1), ("E6", 1)], vel=0.5)
    arp("harp", harp, 0, ["D3", "A3", "E4", "F#4", "A4", "F#4", "E4", "A3"], 4, step=0.5, vel=0.22)
    arp("harp", harp, 1, ["B2", "F#3", "D4", "A4", "D5", "A4", "D4", "F#3"], 4, step=0.5, vel=0.22)
    gl = ["G3", "B3", "D4", "F#4", "G4", "B4", "D5", "F#5", "G5", "A5", "B5", "D6"]
    for i, nn in enumerate(gl):  # harp glissando into Holland
        play("harp", harp, b(2, 2.0) + i * 0.1, nn, 0.4, 0.2 + 0.02 * i)
    play("cym", swell, b(2, 1), None, 3 * BEAT, 0.28)

    # ---- 2. Holland 1921 (bars 3-5): pastoral flute over harp and pizzicato -------------
    pad(3, ["D", "G", "A"], vel=0.24, att=0.8, bright=0.7)
    play("celesta", celesta, b(3), "D6", 2 * BEAT, 0.5)
    melody("flute", flute, 3, [("D5", 1.5), ("E5", 0.5), ("F#5", 1), ("A5", 1), ("B5", 1.5), ("A5", 0.5), ("G5", 1), ("B5", 1),
                               ("A5", 2), ("G5", 0.5), ("F#5", 0.5), ("E5", 1)], vel=0.5, legato=0.95)
    for i, (ch, notes) in enumerate([("D", ["D3", "A3", "D4", "F#4", "A4", "F#4", "D4", "A3"]),
                                     ("G", ["G3", "B3", "D4", "G4", "B4", "G4", "D4", "B3"]),
                                     ("A", ["A3", "C#4", "E4", "A4", "C#5", "A4", "G4", "E4"])]):
        arp("harp", harp, 3 + i, notes, 4, step=0.5, vel=0.24)
        seq("bass", upright, 3 + i, [(0, bass_note(ch, 2), 1.5, 0.55), (2, bass_note(ch, 2), 1.5, 0.45)])
        for k in range(8):
            play("perc", shaker, b(3 + i, k * 0.5), None, 0.1, 0.12 if k % 2 else 0.2)

    # ---- 3. War & resistance (bars 6-9): B minor, low strings, timpani heartbeat --------
    war = ["Bm", "G", "Em", "F#sus4"]
    lows = {"Bm": ["B1", "F#2", "B2", "D3"], "G": ["G1", "D2", "G2", "B2"], "Em": ["E2", "B2", "E3", "G3"], "F#sus4": ["F#1", "C#2", "F#2", "B2"]}
    for i, ch in enumerate(war):
        play("lowstr", strings, b(6 + i), lows[ch], BAR + 0.1, 0.5 + 0.08 * i, att=0.4, rel=0.6, bright=0.5, trem=0.55, vib=0.05)
        seq("timp", timpani, 6 + i, [(0, bass_note(ch, 2), 1, 0.6 + 0.06 * i), (2.5, bass_note(ch, 2), 0.5, 0.3), (3.5, bass_note(ch, 2), 0.5, 0.35)])
    play("lowstr", strings, b(9, 2), ["F#1", "C#2", "F#2", "A#2"], 2 * BEAT + 0.1, 0.75, att=0.2, rel=0.5, bright=0.55, trem=0.55, vib=0.05)
    pad(6, ["Bm", "G", "Em", "F#"], vel=0.22, att=0.8, bright=0.45)
    melody("cello", strings, 6, [("F#3", 2), ("D3", 1), ("F#3", 1), ("B3", 3), ("A3", 1), ("G3", 1.5), ("F#3", 0.5), ("E3", 1), ("G3", 1), ("F#3", 4)],
           vel=0.6, att=0.18, rel=0.5, voices=2, bright=0.9, vib=0.16, cents=4)
    for i in range(4):
        ost = ["B3", "F#3", "D4", "F#3"] if i in (0, 1) else ["B3", "G3", "E4", "G3"] if i == 2 else ["A#3", "F#3", "C#4", "F#3"]
        arp("pizz", pizz, 6 + i, ost, 4, step=0.5, vel=0.28)
    for k in range(16):  # distant military snare, growing
        play("drums", brush, b(8, k * 0.25 + 0), None, 0.1, 0.05 + 0.012 * k)
    for k in range(32):  # timpani roll into the voyage
        play("timp", timpani, b(9, 2) + k * (2 * BEAT / 32), "F#2", 0.1, 0.06 + 0.012 * k)
    play("fx", boom, b(7, 1.5), None, 2, 0.55)
    play("fx", boom, b(8, 3.0), None, 2, 0.45)
    wind = filt(RNG.standard_normal(int(4 * BAR * SR)), "band", (180, 900)) * 0.12
    tw = tvec(len(wind))
    wind *= (0.6 + 0.4 * np.sin(2 * np.pi * 0.21 * tw)) * smooth_attack(tw, 1.5) * release_env(tw, 4 * BAR - 1.2, 1.2)
    TRACKS["fx"].put(b(6), wind)
    play("cym", swell, b(9, 1), None, 3 * BEAT, 0.3)

    # ---- 4. Voyage 1951 (bars 10-13): hope; horn sings the theme ------------------------
    voy = ["G", "D/F#", "Em7", "Asus4"]
    pad(10, voy[:3], vel=0.3, att=0.5, bright=0.8)
    pad(13, ["Asus4", "A"], vel=0.3, att=0.3, bright=0.8, beats_per=2)
    play("cym", crash, b(10), None, 2, 0.28)
    play("timp", timpani, b(10), "G2", 1, 0.7)
    melody("horn", horn, 10, [("A4", 1.5), ("F#4", 0.5), ("A4", 1), ("D5", 1), ("C#5", 3), ("B4", 0.5), ("A4", 0.5),
                              ("B4", 1.5), ("G4", 0.5), ("B4", 1), ("E5", 1), ("D5", 2), ("C#5", 2)], vel=0.6, legato=0.97)
    piano_arps = [["G2", "D3", "G3", "B3", "D4", "B3", "G3", "D3"], ["F#2", "D3", "F#3", "A3", "D4", "A3", "F#3", "D3"],
                  ["E2", "B2", "E3", "G3", "D4", "G3", "E3", "B2"], ["A2", "E3", "A3", "D4", "E4", "C#4", "A3", "E3"]]
    for i, pa in enumerate(piano_arps):
        arp("piano", piano, 10 + i, pa, 4, step=0.5, vel=0.42, dur=1.0)
        seq("bass", upright, 10 + i, [(0, pa[0], 1.5, 0.6), (2, pa[0], 1, 0.45), (3.5, pa[1], 0.5, 0.4)])
        seq("drums", kick, 10 + i, [(0, "C1", 0.5, 0.45), (2.5, "C1", 0.5, 0.3)])
        for k in range(8):
            play("perc", shaker, b(10 + i, k * 0.5), None, 0.1, 0.16 if k % 2 else 0.24)
    play("lowstr", strings, b(13, 2), ["A2", "E3", "A3", "C#4"], 2 * BEAT, 0.3, att=0.3, rel=0.6)
    for i, nn in enumerate(["A3", "C#4", "E4", "A4", "C#5", "E5", "A5", "C#6"]):
        play("harp", harp, b(13, 2.5) + i * 0.11, nn, 0.4, 0.22)
    play("cym", swell, b(13, 1), None, 3 * BEAT, 0.25)

    # ---- 5. Arrival, odd jobs, the grocery store (bars 14-17) ---------------------------
    play("piano", piano, b(14), ["D2", "A2"], 2 * BAR, 0.4)
    melody("piano", piano, 14, [("D4", 1, 0.35), ("A4", 1, 0.32), ("F#5", 1.5, 0.45), ("E5", 0.5, 0.38),
                                ("D5", 2, 0.42), ("B4", 0.5, 0.33), ("C#5", 0.5, 0.33), ("D5", 1, 0.4)], vel=0.4)
    play("piano", piano, b(15), ["B2", "F#3"], BAR, 0.35)
    play("piano", piano, b(15, 0.5), ["D4", "F#4"], 1.4, 0.3)
    pad(14, ["D", "Bm"], vel=0.18, att=1.0, bright=0.6)
    play("fx", ship_horn, b(14, 1), None, 1.8, 0.3)
    # jobs: busy, ticking
    pad(16, ["G", "A"], vel=0.22, att=0.2, bright=0.8, beats_per=2)
    arp("pizz", pizz, 16, ["G3", "B3", "D4", "B3"], 2, step=0.25, vel=0.34)
    arp("pizz", pizz, 16, ["A3", "C#4", "E4", "C#4"], 2, step=0.25, vel=0.34, start_beat=2)
    for k in range(8):
        play("perc", woodblock, b(16, k * 0.5 + 0.25), 1000 if k % 2 else 820, 0.1, 0.22)
        play("perc", shaker, b(16, k * 0.5), None, 0.1, 0.2)
    seq("bass", upright, 16, [(0, "G2", 1, 0.6), (1, "D2", 1, 0.45), (2, "A2", 1, 0.6), (3, "E2", 1, 0.45)])
    seq("piano", piano, 16, [(0, ["G3", "B3", "D4"], 0.4, 0.4), (1, ["G3", "B3", "D4"], 0.4, 0.3), (2, ["A3", "C#4", "E4"], 0.4, 0.4), (3, ["A3", "C#4", "E4"], 0.4, 0.3)])
    seq("drums", kick, 16, [(0, "C1", 0.5, 0.4), (2, "C1", 0.5, 0.4)])
    # grocery store: the shop bell rings
    play("glock", glock, b(17), "D6", 1, 0.55)
    play("glock", glock, b(17, 0.18), "A6", 1, 0.4)
    play("perc", triangle, b(17), None, 1, 0.25)
    pad(17, ["D"], vel=0.3, att=0.15, bright=0.9)
    melody("flute", flute, 17, [("D5", 0.5), ("F#5", 0.5), ("A5", 1), ("B5", 0.5), ("A5", 0.5), ("F#5", 0.5), ("A5", 0.5)], vel=0.5, legato=0.85)
    seq("bass", upright, 17, [(0, "D2", 1, 0.6), (1, "A2", 1, 0.45), (2, "D2", 1, 0.55), (3, "A1", 1, 0.45)])
    seq("drums", kick, 17, [(0, "C1", 0.5, 0.5), (2, "C1", 0.5, 0.45)])
    for k in range(8):
        play("perc", shaker, b(17, k * 0.5), None, 0.1, 0.16 if k % 2 else 0.24)
    play("drums", brush, b(17, 1), None, 0.2, 0.3)
    play("drums", brush, b(17, 3), None, 0.2, 0.3)

    # ---- 6. Thirteen supermarkets (bars 18-20): 13 pops on the 8ths ---------------------
    pops = ["D4", "E4", "F#4", "G4", "A4", "B4", "C#5", "D5", "E5", "F#5", "G5", "A5"]
    for k, nn in enumerate(pops):
        t0 = b(18, k * 0.5)
        play("glock", glock, t0, nn.replace("4", "5").replace("5", "6") if k >= 7 else nn.replace("4", "5"), 0.5, 0.42)
        play("pizz", pizz, t0, nn, 0.4, 0.42)
    play("glock", glock, b(20), "D6", 1, 0.6)
    play("glock", glock, b(20), "A6", 1, 0.45)
    play("cym", crash, b(20), None, 2, 0.35)
    for k in range(8):
        play("drums", brush, b(19, 2 + k * 0.25), None, 0.1, 0.12 + 0.03 * k)
    pad(18, ["D", "G", "D7"], vel=0.28, att=0.3, bright=0.9)
    for i, ch in enumerate(["D", "G", "D7"]):
        r = bass_note(ch, 2)
        fifth = {"D": "A2", "G": "D3", "D7": "A2"}[ch]
        seq("bass", upright, 18 + i, [(0, r, 0.9, 0.62), (1, fifth, 0.9, 0.48), (2, r, 0.9, 0.58), (3, fifth, 0.9, 0.48)])
        seq("drums", kick, 18 + i, [(0, "C1", 0.5, 0.55), (2, "C1", 0.5, 0.5)])
        if i != 1:
            seq("drums", brush, 18 + i, [(1, None, 0.5, 0.32), (3, None, 0.5, 0.32)])
        for k in range(8):
            play("perc", shaker, b(18 + i, k * 0.5), None, 0.1, 0.16 if k % 2 else 0.26)
        for k in range(4):
            play("piano", piano, b(18 + i, k + 0.5), V[ch][1:], 0.35, 0.3)
    melody("vln", strings, 20, [("F#5", 1), ("A5", 1), ("D6", 2)], vel=0.4, att=0.08, rel=0.5, bright=1.1)

    # ---- 7. Switzerland (bars 21-24): ländler — tuba, accordion after-beats, clarinet ----
    swiss = ["G", "D7", "G", "C"]
    for i, ch in enumerate(swiss):
        r = {"G": "G2", "D7": "D2", "C": "C3"}[ch]
        fifth = {"G": "D2", "D7": "A1", "C": "G2"}[ch]
        seq("bass", horn, 21 + i, [(0, r, 0.8, 0.55), (2, fifth, 0.8, 0.5)], att=0.03, rel=0.15)
        chord = {"G": ["G4", "B4", "D5"], "D7": ["F#4", "A4", "C5"], "C": ["G4", "C5", "E5"]}[ch]
        seq("accord", accordion, 21 + i, [(1, chord, 0.45, 0.42), (3, chord, 0.45, 0.42)] + ([(3.5, chord, 0.3, 0.3)] if i == 3 else []))
        for k in range(4):
            play("perc", shaker, b(21 + i, k + 0.5), None, 0.1, 0.18)
    play("accord", accordion, b(24, 2), ["F#4", "A4", "C5", "D5"], 2 * BEAT, 0.4)
    play("perc", shutter, b(22), None, 0.1, 0.55)  # holiday snapshots
    play("perc", shutter, b(22, 2), None, 0.1, 0.55)
    melody("clar", clarinet, 21, [("D5", 0.5), ("G5", 0.5), ("B5", 1), ("A5", 0.5), ("G5", 0.5), ("D5", 1),
                                  ("C5", 0.5), ("F#5", 0.5), ("A5", 1), ("G5", 0.5), ("F#5", 0.5), ("D5", 1),
                                  ("B4", 0.5), ("D5", 0.5), ("G5", 1), ("B5", 1.5), ("A5", 0.5),
                                  ("G5", 1), ("E5", 1), ("F#5", 1), ("A5", 1)], vel=0.5, legato=0.9)
    play("glock", glock, b(21), "B5", 1, 0.35)
    play("glock", glock, b(22), "A5", 1, 0.3)
    pad(21, ["G", "D7", "G"], vel=0.16, att=0.6, bright=0.7)
    pad(24, ["C", "D7"], vel=0.16, att=0.4, bright=0.7, beats_per=2)
    # the idea: a sparkle rising at bar 23
    for i, nn in enumerate(["D5", "G5", "B5", "D6", "G6", "B6"]):
        play("celesta", celesta, b(23) + i * 0.07, nn, 0.4, 0.3 + 0.03 * i)
    play("perc", triangle, b(23), None, 1, 0.3)

    # ---- 8. Building his own Switzerland (bars 25-28): full theme ----------------------
    build = ["D", "A/C#", "Bm", "G"]
    play("cym", crash, b(25), None, 2, 0.35)
    play("timp", timpani, b(25), "D2", 1, 0.7)
    melody("vln", strings, 25, theme_a + theme_b[:4] + [("D6", 2), ("C#6", 2)], vel=0.5, att=0.06, rel=0.6, bright=1.1, voices=3)
    melody("horn", horn, 25, [(down(n), d) for n, d in theme_a + theme_b[:4] + [("D6", 2), ("C#6", 2)]], vel=0.42)
    pad(25, build[:3], vel=0.24, att=0.25, bright=0.9)
    pad(28, ["G", "A"], vel=0.24, att=0.2, bright=0.9, beats_per=2)
    for i, ch in enumerate(build):
        notes = V[ch][1:]
        for k in range(8):
            play("piano", piano, b(25 + i, k * 0.5), notes, 0.28, 0.32 if k % 2 else 0.42)
        r = {"D": "D2", "A/C#": "C#2", "Bm": "B1", "G": "G1"}[ch]
        seq("bass", upright, 25 + i, [(k * 0.5, r if k % 4 != 2 else midi(r) + 12, 0.45, 0.55 if k % 2 == 0 else 0.4) for k in range(8)])
        seq("drums", kick, 25 + i, [(0, "C1", 0.5, 0.6), (1.5, "C1", 0.5, 0.4), (2, "C1", 0.5, 0.55)])
        seq("drums", brush, 25 + i, [(1, None, 0.5, 0.4), (3, None, 0.5, 0.4)])
        for k in range(16):
            play("perc", shaker, b(25 + i, k * 0.25), None, 0.1, 0.1 if k % 2 else 0.18)
        play("perc", tamb, b(25 + i, 1), None, 0.2, 0.18)
        play("perc", tamb, b(25 + i, 3), None, 0.2, 0.18)
    play("lowstr", strings, b(28, 2), ["A2", "E3", "A3", "C#4"], 2 * BEAT, 0.35, att=0.1, rel=0.4)

    # ---- 9. The money (bars 29-31) -----------------------------------------------------
    seq("pizz", pizz, 29, [(0, "E3", 0.5, 0.5), (0.5, "G3", 0.5, 0.5), (1, "B3", 0.5, 0.55)])
    play("clar", clarinet, b(29, 1.5), "D5", 1.0 * BEAT, 0.38)
    play("clar", clarinet, b(29, 2.5), "E5", 0.8 * BEAT, 0.42)
    pad(29, ["Em7", "A7sus4"], vel=0.18, att=0.3, beats_per=2)
    play("glock", glock, b(29, 3.5), "D6", 1, 0.5)
    play("glock", glock, b(29, 3.62), "F#6", 1, 0.42)
    play("glock", glock, b(29, 3.74), "A6", 1, 0.38)
    play("perc", triangle, b(29, 3.5), None, 1, 0.25)
    pad(30, ["D"], vel=0.24, att=0.2, bright=0.9)
    pad(31, ["G", "A7"], vel=0.24, att=0.2, bright=0.9, beats_per=2)
    for i, ch in enumerate(["D", "G"]):
        r = bass_note(ch, 2)
        seq("bass", upright, 30 + i, [(0, r, 0.9, 0.6), (1, r, 0.45, 0.4), (1.5, r, 0.45, 0.4), (2, r, 0.9, 0.55), (3, r, 0.9, 0.45)])
        seq("drums", kick, 30 + i, [(0, "C1", 0.5, 0.55), (2, "C1", 0.5, 0.5)])
        seq("drums", brush, 30 + i, [(1, None, 0.5, 0.32), (3, None, 0.5, 0.32)])
        for k in range(8):
            play("perc", shaker, b(30 + i, k * 0.5), None, 0.1, 0.16 if k % 2 else 0.24)
        for k in range(4):
            play("piano", piano, b(30 + i, k + 0.5), V[ch][1:], 0.35, 0.32)
    play("drums", thud, b(30, 2), None, 0.4, 0.75)  # the SOLD stamp
    coins = ["D6", "F#6", "A6", "D7", "A6", "F#6", "D6", "A5"]
    for k, nn in enumerate(coins):
        play("glock", glock, b(30) + k * 0.075, nn, 0.3, 0.24)
        play("glock", glock, b(31) + k * 0.075, nn, 0.3, 0.2)
    melody("vln", strings, 30, [("F#5", 1.5), ("E5", 0.5), ("D5", 1), ("A5", 1), ("B5", 1.5), ("A5", 0.5), ("G5", 1), ("E5", 0.5), ("C#5", 0.5)],
           vel=0.38, att=0.08, rel=0.4, bright=1.0)

    # ---- 10. The building rules (bars 32-34): staccato and a comic veto ----------------
    seq("pizz", pizz, 32, [(k * 0.5, n, 0.4, 0.42) for k, n in enumerate(["D3", "F#3", "A3", "F#3"])])
    for k in range(8):
        play("perc", woodblock, b(32, k * 0.5), 1050 if k % 2 else 880, 0.1, 0.2)
    play("lowstr", strings, b(32, 2), ["Bb2", "F3", "Bb3", "D4"], 1.9 * BEAT, 0.35, att=0.03, rel=0.3, bright=0.7)
    # wah-wah veto: horn bends down
    for i, (nn, d) in enumerate([("D4", 0.5), ("C#4", 0.5), ("C4", 1.0)]):
        play("horn", horn, b(32, 2 + i * 0.5), nn, d * BEAT, 0.5, att=0.03, rel=0.2)
    play("bass", upright, b(32, 2), "Bb1", 2 * BEAT, 0.6)
    seq("pizz", pizz, 33, [(k * 0.5, n, 0.4, 0.42) for k, n in enumerate(["G3", "B3", "D4", "B3"])])
    for k in range(4):
        play("perc", woodblock, b(33, k * 0.5), 1050 if k % 2 else 880, 0.1, 0.2)
    # approval: bright chord + harp sweep
    for nn in ["D6", "F#6", "A6"]:
        play("glock", glock, b(33, 2), nn, 1, 0.42)
    for i, nn in enumerate(["A3", "C#4", "E4", "A4", "C#5", "E5", "A5"]):
        play("harp", harp, b(33, 2) + i * 0.06, nn, 0.4, 0.26)
    pad(33, ["G", "A"], vel=0.24, att=0.15, beats_per=2)
    play("cym", crash, b(33, 2), None, 1.5, 0.22)
    pad(34, ["D"], vel=0.22, att=0.2)
    melody("flute", flute, 34, [("D5", 0.5), ("A5", 0.5), ("F#5", 0.5), ("D6", 1.5), ("C#6", 0.5), ("A5", 0.5)], vel=0.48, legato=0.88)
    seq("bass", upright, 32, [(0, "D2", 1, 0.55), (1, "A2", 1, 0.45)])
    seq("bass", upright, 33, [(0, "G2", 1, 0.55), (1, "D2", 1, 0.45), (2, "A2", 1, 0.55), (3, "E2", 1, 0.45)])
    seq("bass", upright, 34, [(0, "D2", 1, 0.55), (1, "A2", 1, 0.45), (2, "D2", 1, 0.5), (3, "A1", 1, 0.45)])
    for k in range(8):
        play("perc", shaker, b(34, k * 0.5), None, 0.1, 0.14 if k % 2 else 0.2)
    play("cym", swell, b(34, 1), None, 3 * BEAT, 0.3)
    for k in range(24):
        play("timp", timpani, b(34, 2) + k * (2 * BEAT / 24), "A2", 0.1, 0.05 + 0.012 * k)

    # ---- 11. The village is complete, 1989 (bars 35-37): the big statement --------------
    play("cym", crash, b(35), None, 2.5, 0.42)
    play("timp", timpani, b(35), "D2", 1, 0.8)
    grand = ["D", "G", "Em7"]
    pad(35, grand, vel=0.32, att=0.2, bright=1.0)
    for i, ch in enumerate(grand):
        play("lowstr", strings, b(35 + i), {"D": ["D2", "A2", "D3"], "G": ["G1", "D2", "G2"], "Em7": ["E2", "B2", "E3"]}[ch], BAR, 0.45, att=0.15, rel=0.8)
        roll = {"D": ["D3", "A3", "D4", "F#4", "A4", "D5", "F#5"], "G": ["G2", "D3", "G3", "B3", "D4", "G4", "B4"], "Em7": ["E3", "B3", "D4", "G4", "B4", "D5", "E5"]}[ch]
        for k, nn in enumerate(roll):
            play("piano", piano, b(35 + i) + k * 0.05, nn, BAR, 0.4)
            play("harp", harp, b(35 + i, 2) + k * 0.08, nn, 1.0, 0.18)
        seq("timp", timpani, 35 + i, [(2, bass_note(ch, 2), 1, 0.35)])
    line = [("F#5", 1.5), ("G5", 0.5), ("A5", 2), ("B5", 1.5), ("A5", 0.5), ("G5", 1), ("D6", 1), ("B5", 2), ("A5", 2)]
    melody("vln", strings, 35, line, vel=0.55, att=0.1, rel=0.9, bright=1.15, voices=3)
    melody("horn", horn, 35, [(down(n), d) for n, d in line], vel=0.48)
    melody("cello", strings, 35, [("D3", 4), ("B2", 4), ("E3", 2), ("A2", 2)], vel=0.4, att=0.2, rel=0.8, voices=2)
    play("choir", choir, b(35), ["D4", "A4", "F#5"], BAR, 0.28, att=0.4, rel=0.6)
    play("choir", choir, b(36), ["D4", "G4", "B4"], BAR, 0.26, att=0.3, rel=1.0)

    # ---- 12. Snow is rare here (bars 38-40): solo piano, sparkles only on the Swiss side --
    pad(38, ["Bm", "G", "Em7"], vel=0.14, att=1.2, bright=0.5)
    play("piano", piano, b(38), ["B1", "F#2", "B2"], BAR, 0.38)
    play("piano", piano, b(39), ["G1", "D2", "G2"], BAR, 0.36)
    play("piano", piano, b(40), ["E2", "B2", "E3"], 2 * BEAT, 0.34)
    play("piano", piano, b(40, 2), ["A1", "E2", "A2"], 2 * BEAT, 0.34)
    melody("piano", piano, 38, [("F#5", 1.5, 0.42), ("E5", 0.5, 0.34), ("D5", 1, 0.38), ("C#5", 1, 0.34),
                                ("D5", 1.5, 0.4), ("B4", 0.5, 0.32), ("G4", 2, 0.34),
                                ("E5", 1.5, 0.38), ("D5", 0.5, 0.32), ("C#5", 2, 0.34)], vel=0.38)
    for k, nn in enumerate(["F#6", "A6", "D7", "B6", "E7", "A6", "F#6", "D7", "B6"]):
        play("sparkle", celesta, b(38) + 0.2 + k * 0.42, nn, 0.2, 0.22, pan=-0.75)

    # ---- 13. It snowed (bars 41-44) ----------------------------------------------------
    play("piano", piano, b(41), ["B1", "F#2", "C#3", "D3"], BAR, 0.3)
    melody("piano", piano, 41, [("F#5", 2, 0.36), ("E5", 1, 0.3), ("D5", 1, 0.3)], vel=0.32)
    pad(41, ["Bmadd9"], vel=0.12, att=1.5, bright=0.4)
    wind = filt(RNG.standard_normal(int(7.2 * BAR * SR)), "band", (250, 1400)) * 0.05
    tw = tvec(len(wind))
    wind *= (0.65 + 0.35 * np.sin(2 * np.pi * 0.13 * tw)) * smooth_attack(tw, 2.5) * release_env(tw, 7.2 * BAR - 3, 3)
    TRACKS["fx"].put(b(40), wind)
    # the first snowflake at bar 42
    for i, nn in enumerate(["D7", "A6", "F#6", "D6", "A5"]):
        play("celesta", celesta, b(42) + i * 0.16, nn, 0.5, 0.4 - 0.04 * i)
    play("perc", triangle, b(42), None, 1, 0.22)
    play("cym", swell, b(41, 1), None, 3 * BEAT, 0.22)
    snow = ["G", "D/F#", "D", "Bm7"]
    for i, ch in enumerate(snow[:2]):
        play("pad", strings, b(42, i * 2), [midi(n) + 12 for n in V[ch]], 2 * BEAT + 0.3, 0.2, att=0.6, rel=1.0, bright=0.6)
    play("choir", choir, b(42), ["G4", "B4", "D5"], 2 * BEAT, 0.26)
    play("choir", choir, b(42, 2), ["F#4", "A4", "D5"], 2 * BEAT, 0.26)
    play("bass", upright, b(42), "G1", 2 * BEAT, 0.4)
    play("bass", upright, b(42, 2), "F#1", 2 * BEAT, 0.4)
    play("piano", piano, b(42), ["G2", "D3", "B3"], 2 * BEAT, 0.3)
    play("piano", piano, b(42, 2), ["F#2", "D3", "A3"], 2 * BEAT, 0.3)
    # theme on celesta, strings and choir swelling
    melody("celesta", celesta, 43, theme_a, vel=0.55)
    melody("vln", strings, 43, [(down(n), d) for n, d in theme_a], vel=0.3, att=0.3, rel=0.9, bright=0.8)
    pad(43, ["D", "Bm7"], vel=0.26, att=0.7, bright=0.75)
    play("choir", choir, b(43), ["D4", "A4", "F#5"], BAR, 0.3)
    play("choir", choir, b(44), ["D4", "A4", "F#5"], BAR, 0.26)
    seq("bass", upright, 43, [(0, "D2", 2, 0.45), (2, "A1", 2, 0.4)])
    seq("bass", upright, 44, [(0, "B1", 2, 0.45), (2, "A1", 2, 0.42)])
    for k, nn in enumerate(["D3", "A3", "F#4", "A4"]):
        play("harp", harp, b(43) + k * 0.12, nn, 1, 0.2)
    for k, nn in enumerate(["B2", "F#3", "D4", "A4"]):
        play("harp", harp, b(44) + k * 0.12, nn, 1, 0.2)
    # falling-snow shimmer from bar 42 to the end
    pent = ["D6", "E6", "F#6", "A6", "B6", "D7", "E7"]
    tt = b(42) + 0.6
    while tt < 114.5:
        nn = pent[int(RNG.integers(0, len(pent)))]
        play("sparkle", celesta, tt, nn, 0.2, float(RNG.uniform(0.1, 0.2)), pan=float(RNG.uniform(-0.8, 0.8)))
        tt += float(RNG.uniform(0.35, 0.8))

    # ---- 14. Ending (bars 45-47 + tail) -----------------------------------------------
    melody("celesta", celesta, 45, [("B5", 1.5), ("G5", 0.5), ("B5", 1), ("E6", 1), ("D6", 2), ("C#6", 2), ("D6", 4)], vel=0.55)
    melody("vln", strings, 45, [("B4", 1.5), ("G4", 0.5), ("B4", 1), ("E5", 1), ("D5", 2), ("C#5", 2), ("D5", 6)], vel=0.34, att=0.3, rel=2.2, bright=0.8)
    melody("cello", strings, 45, [("G2", 4), ("A2", 4), ("D2", 6)], vel=0.4, att=0.4, rel=2.2, voices=2, bright=0.7)
    pad(45, ["Gmaj7"], vel=0.26, att=0.6, bright=0.75)
    pad(46, ["Asus4", "A"], vel=0.26, att=0.4, bright=0.75, beats_per=2)
    play("pad", strings, b(47), ["D3", "A3", "D4", "F#4", "A4"], 2.4 * BEAT + BAR, 0.26, att=0.5, rel=3.0, bright=0.7)
    play("choir", choir, b(45), ["G4", "B4", "D5"], BAR, 0.24)
    play("choir", choir, b(46), ["A4", "D5", "E5"], 2 * BEAT, 0.24, att=0.4, rel=0.4)
    play("choir", choir, b(46, 2), ["A4", "C#5", "E5"], 2 * BEAT, 0.24, att=0.3, rel=0.8)
    play("choir", choir, b(47), ["A4", "D5", "F#5"], 1.6 * BAR, 0.24, att=0.6, rel=3.0)
    seq("bass", upright, 45, [(0, "G1", 4, 0.42)])
    seq("bass", upright, 46, [(0, "A1", 4, 0.42)])
    play("piano", piano, b(47), ["D1", "D2"], 4 * BEAT + 2, 0.42)
    for k, nn in enumerate(["D3", "A3", "D4", "F#4", "A4", "D5", "F#5", "A5"]):
        play("piano", piano, b(47) + k * 0.09, nn, 3.5, 0.3)
    play("cym", swell, b(46, 1), None, 3 * BEAT, 0.18)
    for i, nn in enumerate(["A6", "F#6", "D6", "A5", "F#5", "D5"]):
        play("celesta", celesta, b(47, 2) + i * 0.22, nn, 0.4, 0.3 - 0.03 * i)
    play("timp", timpani, b(47), "D2", 1, 0.4)


# --------------------------------------------------------------------------- effects & master

def make_ir(rt60=2.3, length=3.4, predelay=0.024):
    n = int(length * SR)
    t = tvec(n)
    irs = []
    for ch in range(2):
        noise = RNG.standard_normal(n)
        lo = filt(noise, "low", 600) * np.exp(-6.9 * t / rt60)
        mid = filt(noise, "band", (600, 3500)) * np.exp(-6.9 * t / (rt60 * 0.78))
        hi = filt(noise, "high", 3500) * np.exp(-6.9 * t / (rt60 * 0.42))
        ir = (lo + mid * 0.9 + hi * 0.5) * (1 - np.exp(-t / 0.008))
        for d, g in [(0.011, 0.5), (0.019, 0.35), (0.027, 0.3), (0.041, 0.22), (0.053, 0.18)]:
            k = int((d + 0.003 * ch) * SR)
            ir[k] += g * (1 if (k + ch) % 2 else -1) * 3
        ir = np.concatenate([np.zeros(int(predelay * SR)), ir])
        irs.append(ir / np.sqrt(np.sum(ir ** 2)))
    return irs


def pingpong(x, delay_s=0.45, fb=0.38, taps=6):
    d = int(delay_s * SR)
    y = np.zeros_like(x)
    src = x.copy()
    for k in range(1, taps + 1):
        src = np.stack([filt(src[1], "low", 5000), filt(src[0], "low", 5000)]) * fb  # swap sides each tap
        y[:, k * d:] += src[:, : y.shape[1] - k * d]
    return y


def biquad(kind, f0, gain_db=0.0, q=0.707):
    """RBJ-cookbook shelf / peaking filter as an sos section."""
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    cw, sw = np.cos(w0), np.sin(w0)
    alpha = sw / (2 * q)
    if kind == "peak":
        bb = [1 + alpha * A, -2 * cw, 1 - alpha * A]
        aa = [1 + alpha / A, -2 * cw, 1 - alpha / A]
    else:
        sq = 2 * np.sqrt(A) * alpha
        if kind == "lowshelf":
            bb = [A * ((A + 1) - (A - 1) * cw + sq), 2 * A * ((A - 1) - (A + 1) * cw), A * ((A + 1) - (A - 1) * cw - sq)]
            aa = [(A + 1) + (A - 1) * cw + sq, -2 * ((A - 1) + (A + 1) * cw), (A + 1) + (A - 1) * cw - sq]
        else:
            bb = [A * ((A + 1) + (A - 1) * cw + sq), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - sq)]
            aa = [(A + 1) - (A - 1) * cw + sq, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - sq]
    return np.array([bb + aa]) / aa[0]


def master(mix):
    mix = signal.sosfilt(butter("high", 38, 2), mix, axis=1)
    for sos in (biquad("lowshelf", 90, -4.5), biquad("peak", 1400, -2.5, 0.9), biquad("highshelf", 5200, 6.0), biquad("peak", 280, -1.5, 1.0)):
        mix = signal.sosfilt(sos, mix, axis=1)
    # gentle bus compression (RMS, 2:1 above threshold)
    mono = np.sqrt(0.5 * (mix[0] ** 2 + mix[1] ** 2))
    win = int(0.06 * SR)
    rms = np.sqrt(np.convolve(mono ** 2, np.ones(win) / win, mode="same") + 1e-12)
    thr = np.percentile(rms[rms > 1e-5], 90) * 0.9
    gain = np.where(rms > thr, (thr / rms) ** 0.5, 1.0)
    gain = signal.sosfiltfilt(butter("low", 3.0, 1), gain)
    mix = mix * gain
    # normalise towards a comfortable loudness, then a smooth peak limiter
    active = mono[mono > 1e-4]
    target_rms = 10 ** (-17.5 / 20)
    cur = np.sqrt(np.mean((mix[:, : len(mono)] ** 2))) + 1e-12
    mix *= target_rms / cur * 1.0
    peak = np.max(np.abs(mix), axis=0)
    from scipy.ndimage import maximum_filter1d
    pk = maximum_filter1d(peak, size=int(0.008 * SR))
    ceiling = 10 ** (-1.0 / 20)
    g = np.minimum(1.0, ceiling / (pk + 1e-12))
    g = np.minimum(g, signal.sosfiltfilt(butter("low", 12, 1), g))
    mix = mix * g
    mix = np.clip(mix, -ceiling, ceiling)
    return mix, len(active)


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    pcm = (x.T * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    compose()
    L = N + SR * 4
    dry = np.zeros((2, L))
    rev_send = np.zeros((2, L))
    dly_send = np.zeros((2, L))
    for tr in TRACKS.values():
        x = tr.buf * tr.gain
        dry += x
        rev_send += x * tr.rev
        if tr.delay:
            dly_send += x * tr.delay
    delayed = pingpong(dly_send)
    dry += delayed
    rev_send += delayed * 0.5
    irs = make_ir()
    wet = np.stack([signal.fftconvolve(rev_send[c], irs[c])[:L] for c in range(2)])
    mix = dry + wet * 0.85
    mix = mix[:, :N]
    t = tvec(N)
    mix *= smooth_attack(t, 0.02)
    fade_start = TOTAL - 3.0
    mix *= np.where(t > fade_start, np.cos(np.clip((t - fade_start) / 3.0, 0, 1) * np.pi / 2) ** 2, 1.0)
    out, _ = master(mix)
    os.makedirs(OUT_DIR, exist_ok=True)
    wav = os.path.join(OUT_DIR, "score.wav")
    write_wav(wav, out)
    m4a = os.path.join(OUT_DIR, "score.m4a")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "aac", "-b:a", "256k", m4a], check=True)
    peak = 20 * np.log10(np.max(np.abs(out)) + 1e-12)
    rms = 20 * np.log10(np.sqrt(np.mean(out ** 2)) + 1e-12)
    print(f"wrote {wav} and {m4a}: {TOTAL:.1f}s, peak {peak:.1f} dBFS, rms {rms:.1f} dBFS")


if __name__ == "__main__":
    sys.exit(main())
