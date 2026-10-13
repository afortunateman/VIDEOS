#!/usr/bin/env python3
"""
WORLD.EXE: original 8-second score and synchronised sound design.

Everything is synthesised from scratch with numpy/scipy: there are no samples. The cue times come
from ../timeline.json, the same cue sheet the canvas animation reads, so every drawn action lands
on its sound.

Music: 120 bpm, so every 2-second scene is exactly one bar of 4/4, in D major with Lydian colour.
  Bar 1  Dadd9 -> Gmaj7(#11)/D   harp and celesta draw the world in; the flute states the theme
  Bar 2  Bm7 -> Gmaj9 -> F#m7    pizzicato journey groove, the houses pop on a pentatonic run
  Bar 3  Em9 -> A7sus4 -> A7     strings and horns swell as the globe forms; a run up into the spin
  Bar 4  D                       the theme in horns and violins, letters land on a celesta
                                 sparkle, and the signature chime arrives
The theme is a four-note call, A-D-E-F#, heard three times: flute (bar 1), violins a step higher
(bar 3), then full horns and strings under the title.

Output: audio/world_exe_score.wav (48 kHz, 24-bit stereo, exactly 8.000 s)
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
TL = json.loads((ROOT / "timeline.json").read_text())
DUR = float(TL["duration"])
Q = TL["cues"]

TAIL = 3.0  # render past the end so reverbs settle naturally, then fade
NTOT = int((DUR + TAIL) * SR)
rng = np.random.default_rng(20261013)


# --------------------------------------------------------------------------- utilities
def note(name):
    """'F#4' -> Hz"""
    names = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    pc = names[name[0]]
    i = 1
    while i < len(name) and name[i] in "#b":
        pc += 1 if name[i] == "#" else -1
        i += 1
    octave = int(name[i:])
    midi = 12 * (octave + 1) + pc
    return 440.0 * 2 ** ((midi - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def smoothstep(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def sos_filter(x, kind, f, order=2):
    if kind == "band":
        f = [max(20, f[0]), min(SR / 2 - 100, f[1])]
    else:
        f = min(max(20, f), SR / 2 - 100)
    sos = signal.butter(order, f, btype=kind, fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def env_ar(n, attack, release_start, release, curve=2.0):
    """attack ramp, sustain, cosine release starting at release_start (seconds)"""
    t = tt(n)
    a = np.clip(t / max(attack, 1e-4), 0, 1) ** (1 / curve)
    r = np.clip((t - release_start) / max(release, 1e-4), 0, 1)
    r = 0.5 + 0.5 * np.cos(np.pi * r)
    return a * r


def pan_gains(p):
    p = np.clip(p, -1, 1)
    a = (p + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


class Bus:
    """stereo bus with a reverb send"""

    def __init__(self, name, wet=0.3):
        self.name = name
        self.wet = wet
        self.buf = np.zeros((2, NTOT))

    def add(self, x, t0, pan=0.0, gain=1.0):
        """place mono (n,) or stereo (2, n) audio at time t0"""
        i0 = int(round(t0 * SR))
        if x.ndim == 1:
            gl, gr = pan_gains(pan)
            x = np.vstack([x * gl, x * gr])
        if i0 < 0:
            x = x[:, -i0:]
            i0 = 0
        n = min(x.shape[1], NTOT - i0)
        if n <= 0:
            return
        self.buf[:, i0:i0 + n] += x[:, :n] * gain


# --------------------------------------------------------------------------- oscillators
def polyblep_saw(freq_curve):
    """band-limited sawtooth from a per-sample frequency curve"""
    dt = freq_curve / SR
    ph = np.cumsum(dt) + rng.random()
    t = ph % 1.0
    y = 2 * t - 1
    m1 = t < dt
    x = t[m1] / dt[m1]
    y[m1] -= x + x - x * x - 1
    m2 = t > 1 - dt
    x = (t[m2] - 1) / dt[m2]
    y[m2] -= x * x + x + x + 1
    return y


def vibrato(n, rate=5.2, depth_cents=9, delay=0.18, ramp=0.35):
    t = tt(n)
    d = smoothstep((t - delay) / ramp)
    return 2 ** ((depth_cents * d * np.sin(2 * np.pi * rate * t + rng.random() * 6.28)) / 1200)


# --------------------------------------------------------------------------- instruments
def strings(freq, dur, vel=0.4, attack=0.25, release=0.4, voices=6, bright=0.5, width=0.7):
    """bowed string section: detuned band-limited saws, bow noise, body filter, spread in stereo"""
    n = int((dur + release) * SR)
    out = np.zeros((2, n))
    for v in range(voices):
        cents = (v - (voices - 1) / 2) * 3.2 + rng.normal(0, 1.2)
        f = freq * 2 ** (cents / 1200) * vibrato(n, rate=4.8 + rng.random() * 1.0, depth_cents=7 + rng.random() * 5)
        x = polyblep_saw(f)
        p = (v / (voices - 1) * 2 - 1) * width if voices > 1 else 0
        gl, gr = pan_gains(p)
        out[0] += x * gl
        out[1] += x * gr
    cutoff = 900 + 2600 * bright * (0.4 + vel) + freq * 1.5
    for c in range(2):
        out[c] = sos_filter(out[c], "low", cutoff, 2)
        out[c] = sos_filter(out[c], "high", max(40, freq * 0.6), 1)
    bow = sos_filter(rng.normal(0, 1, n), "band", (1500, 5000)) * 0.04
    e = env_ar(n, attack, dur, release, curve=1.6)
    out = (out + bow) * e * vel / np.sqrt(voices)
    return out


def horn(freq, dur, vel=0.5, attack=0.09, release=0.35):
    """warm french horn: saw through a filter that opens with the swell, a gentle pitch scoop"""
    n = int((dur + release) * SR)
    t = tt(n)
    scoop = 1 - 0.006 * np.exp(-t / 0.04)
    out = np.zeros((2, n))
    for k, cents in enumerate((-4, 4)):
        f = freq * scoop * 2 ** (cents / 1200) * vibrato(n, rate=4.6, depth_cents=6, delay=0.3)
        x = polyblep_saw(f)
        dark = sos_filter(x, "low", freq * 2.2, 2)
        brt = sos_filter(x, "low", freq * 5.5, 2)
        e = env_ar(n, attack, dur, release)
        mixv = np.clip(e * (0.35 + vel), 0, 1)
        y = dark * (1 - mixv) + brt * mixv
        gl, gr = pan_gains(-0.25 + 0.5 * k)
        out[0] += y * gl
        out[1] += y * gr
    e = env_ar(n, attack, dur, release)
    return out * e * vel * 0.6


def flute(freq, dur, vel=0.4, attack=0.06, release=0.2):
    n = int((dur + release) * SR)
    t = tt(n)
    f = freq * vibrato(n, rate=5.0, depth_cents=14, delay=0.15, ramp=0.3)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.22 * np.sin(2 * ph + 0.3) + 0.07 * np.sin(3 * ph + 1.1)
    breath = sos_filter(rng.normal(0, 1, n), "band", (freq * 1.5, freq * 4)) * 0.07
    chiff = sos_filter(rng.normal(0, 1, n), "band", (2000, 7000)) * 0.15 * np.exp(-t / 0.03)
    e = env_ar(n, attack, dur, release, curve=1.4)
    return (x + breath + chiff) * e * vel


def pluck(freq, vel=0.5, decay=1.2, bright=1.3, pos=0.18, inharm=0.0002, hmax=24, attack=0.002, body=None):
    """additive plucked string: higher partials die faster (harp, pizzicato)"""
    dur = decay * 4.5
    n = int(dur * SR)
    t = tt(n)
    x = np.zeros(n)
    H = int(min(hmax, 9000 / freq))
    for h in range(1, H + 1):
        a = abs(np.sin(np.pi * h * pos)) / h ** bright
        fh = freq * h * np.sqrt(1 + inharm * h * h)
        d = decay / (1 + 0.55 * (h - 1))
        x += a * np.sin(2 * np.pi * fh * t + rng.random() * 6.28) * np.exp(-t / d)
    x *= np.clip(t / attack, 0, 1)
    if body:
        x = sos_filter(x, "low", body, 2)
    return x * vel / 1.6


def harp(name, vel=0.4):
    f = note(name)
    return pluck(f, vel, decay=1.6 if f < 600 else 1.1, bright=1.25, pos=0.32, body=6000)


def pizz(name, vel=0.4):
    f = note(name)
    return pluck(f, vel, decay=0.32 if f > 200 else 0.45, bright=1.5, pos=0.2, body=3200)


def celesta(name, vel=0.3):
    f = note(name)
    n = int(2.4 * SR)
    t = tt(n)
    parts = [(1.0, 1.0, 1.5), (2.0, 0.12, 0.5), (4.0, 0.28, 0.22), (6.27, 0.05, 0.05)]
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in parts)
    click = sos_filter(rng.normal(0, 1, n), "band", (3000, 9000)) * np.exp(-t / 0.004) * 0.25
    return (x + click) * np.clip(t / 0.0015, 0, 1) * vel


def glock(name, vel=0.3):
    f = note(name)
    n = int(3.0 * SR)
    t = tt(n)
    parts = [(1.0, 1.0, 2.0), (2.76, 0.45, 0.7), (5.40, 0.2, 0.3), (8.93, 0.08, 0.12)]
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in parts)
    return x * np.clip(t / 0.001, 0, 1) * vel


def marimba(freq, vel=0.4):
    n = int(1.2 * SR)
    t = tt(n)
    parts = [(1.0, 1.0, 0.33), (3.93, 0.32, 0.07), (9.2, 0.1, 0.025)]
    x = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / d) for r, a, d in parts)
    return x * np.clip(t / 0.002, 0, 1) * vel


def bell(freq, vel=0.3):
    n = int(3.5 * SR)
    t = tt(n)
    parts = [(0.5, 0.3, 2.6), (1.0, 1.0, 2.0), (1.183, 0.45, 1.4), (1.506, 0.35, 1.1), (2.0, 0.35, 0.8), (2.514, 0.18, 0.55), (3.011, 0.1, 0.35)]
    x = sum(a * np.sin(2 * np.pi * freq * r * t + rng.random()) * np.exp(-t / d) for r, a, d in parts)
    return x * np.clip(t / 0.002, 0, 1) * vel / 2


def timpani(name, vel=0.5, decay=1.4):
    f = note(name)
    n = int(decay * 3 * SR)
    t = tt(n)
    glide = 1 + 0.03 * np.exp(-t / 0.05)
    ph = 2 * np.pi * np.cumsum(f * glide) / SR
    parts = [(1.0, 1.0, 1.0), (1.504, 0.55, 0.65), (1.742, 0.3, 0.5), (2.0, 0.3, 0.55), (2.245, 0.18, 0.35), (2.494, 0.12, 0.3)]
    x = sum(a * np.sin(r * ph) * np.exp(-t / (d * decay)) for r, a, d in parts)
    thump = sos_filter(rng.normal(0, 1, n), "low", 380) * np.exp(-t / 0.025) * 0.9
    return (x + thump) * vel


def timp_roll(name, t_len, v0=0.05, v1=0.4):
    """soft-mallet roll: many quick hits with a crescendo"""
    n = int((t_len + 3.0) * SR)
    out = np.zeros(n)
    k = 0.0
    while k < t_len:
        v = v0 + (v1 - v0) * (k / t_len) ** 1.6
        hit = timpani(name, vel=v * (0.8 + 0.4 * rng.random()), decay=0.9)
        i = int(k * SR)
        m = min(len(hit), n - i)
        out[i:i + m] += hit[:m]
        k += 0.052 + rng.random() * 0.012
    return out


def triangle(vel=0.15, f=1580):
    n = int(2.6 * SR)
    t = tt(n)
    parts = [(1.0, 1.0, 2.0), (2.73, 0.6, 1.6), (4.18, 0.4, 1.2), (5.31, 0.3, 0.9), (6.8, 0.2, 0.7)]
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in parts)
    return x * vel / 2


def cymbal_swell(length, vel=0.2, peak_at=None):
    """soft-mallet suspended cymbal: a breathy crescendo that blooms and fades"""
    peak_at = length if peak_at is None else peak_at
    n = int((length + 1.5) * SR)
    t = tt(n)
    x = sos_filter(rng.normal(0, 1, n), "band", (2500, 12000)) + 0.5 * sos_filter(rng.normal(0, 1, n), "band", (900, 3000))
    rise = np.clip(t / peak_at, 0, 1) ** 2.6
    fall = np.where(t > peak_at, np.exp(-(t - peak_at) / 0.55), 1)
    return x * rise * fall * vel


def shaker(vel=0.1):
    n = int(0.12 * SR)
    t = tt(n)
    x = sos_filter(rng.normal(0, 1, n), "band", (5500, 12000))
    e = np.clip(t / 0.008, 0, 1) * np.exp(-t / 0.035)
    return x * e * vel


# --------------------------------------------------------------------------- sound effects
def shaped_noise(dur, fc, bw_oct, env, color=0.0, seed_noise=None):
    """noise sculpted by a moving band: fc(t)->Hz, env(t)->amplitude (vectorised in t)"""
    n = int(dur * SR)
    x = rng.normal(0, 1, n) if seed_noise is None else seed_noise[:n]
    f, tseg, Z = signal.stft(x, fs=SR, nperseg=1024, noverlap=768)
    centers = np.maximum(30, fc(tseg))
    lf = np.log2(np.maximum(f[:, None], 1) / centers[None, :])
    g = np.exp(-0.5 * (lf / bw_oct) ** 2)
    if color:
        g *= (np.maximum(f[:, None], 20) / 1000) ** (-color)
    _, y = signal.istft(Z * g, fs=SR, nperseg=1024, noverlap=768)
    y = y[:n]
    y /= np.max(np.abs(y)) + 1e-9
    return y * env(tt(len(y)))


def whoosh(dur, f0, f1, vel=0.3, peak=0.6, bw=0.8):
    def fc(t):
        u = np.clip(t / dur, 0, 1)
        return f0 * (f1 / f0) ** u

    def env(t):
        u = np.clip(t / dur, 0, 1)
        return np.where(u < peak, (u / peak) ** 2, np.cos(np.pi / 2 * np.clip((u - peak) / (1 - peak), 0, 1)) ** 1.5) * vel

    return shaped_noise(dur, fc, bw, env)


def pop(freq, vel=0.4):
    """a playful wooden pop: an air 'bwop' that rises into a tuned marimba ring"""
    n = int(0.8 * SR)
    t = tt(n)
    f = freq * (0.55 + 0.45 * smoothstep(t / 0.05))
    bwop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.07) * np.clip(t / 0.003, 0, 1)
    click = sos_filter(rng.normal(0, 1, n), "high", 2500) * np.exp(-t / 0.0025) * 0.4
    ring = np.zeros(n)
    m = marimba(freq * 2, 0.6)
    ring[: min(n, len(m))] = m[:n]
    return (0.8 * bwop + click + 0.7 * ring) * vel


def droplet(freq, vel=0.15):
    """a little water 'plip': a quick upward chirp"""
    n = int(0.12 * SR)
    t = tt(n)
    f = freq * (1 + 1.2 * smoothstep(t / 0.03))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.025) * np.clip(t / 0.002, 0, 1) * vel


def rustle(dur, vel=0.2, density=260, band=(1800, 7500), shape=None):
    """granular leaf/paper rustle"""
    n = int(dur * SR)
    out = np.zeros(n)
    base = sos_filter(rng.normal(0, 1, n), "band", band)
    count = int(density * dur)
    for _ in range(count):
        c = rng.random() * dur
        if shape is not None and rng.random() > shape(c):
            continue
        L = int((0.004 + rng.random() * 0.014) * SR)
        i = int(c * SR)
        if i + L >= n:
            continue
        w = np.hanning(L) * (0.3 + rng.random())
        out[i:i + L] += base[i:i + L] * w
    return out * vel


def pencil(dur, vel=0.12):
    """graphite on paper: grainy, stroky scratching"""
    n = int(dur * SR)
    t = tt(n)
    x = sos_filter(rng.normal(0, 1, n), "band", (2200, 7000))
    strokes = 0.5 + 0.5 * np.sin(2 * np.pi * (14 + 6 * np.sin(t * 9)) * t) ** 2
    grain = sos_filter(np.abs(rng.normal(0, 1, n)), "low", 60)
    grain /= grain.max() + 1e-9
    e = np.clip(t / 0.02, 0, 1) * np.clip((dur - t) / 0.03, 0, 1)
    return x * strokes * (0.4 + grain) * e * vel


def sea_bed(dur, vel=0.12):
    n = int(dur * SR)
    t = tt(n)
    out = np.zeros((2, n))
    for c in range(2):
        x = sos_filter(np.cumsum(rng.normal(0, 1, n)) * 0.02 + rng.normal(0, 1, n), "band", (120, 1400))
        swell = 0.55 + 0.45 * np.sin(2 * np.pi * 0.45 * t + c * 1.3 + 1.0)
        out[c] = x / (np.abs(x).max() + 1e-9) * swell * vel
    return out


def babble(dur, vel=0.08):
    """a small river: lowpassed noise with fast random modulation"""
    n = int(dur * SR)
    x = sos_filter(rng.normal(0, 1, n), "band", (250, 2200))
    am = sos_filter(rng.normal(0, 1, n), "low", 18)
    am = 0.4 + np.abs(am) / (np.abs(am).max() + 1e-9)
    return x / (np.abs(x).max() + 1e-9) * am * vel


def thump(vel=0.3, f=120):
    n = int(0.3 * SR)
    t = tt(n)
    x = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.6 * np.exp(-t / 0.015))) / SR) * np.exp(-t / 0.07)
    felt = sos_filter(rng.normal(0, 1, n), "low", 900) * np.exp(-t / 0.01) * 0.3
    return (x + felt) * vel


def sub_bloom(freq, dur, vel=0.4):
    n = int(dur * SR)
    t = tt(n)
    x = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(4 * np.pi * freq * t)
    e = np.clip(t / 0.03, 0, 1) * np.exp(-t / (dur / 3))
    return x * e * vel


# --------------------------------------------------------------------------- reverb
def make_ir(rt60=2.0):
    n = int(rt60 * 1.3 * SR)
    t = tt(n)
    ir = np.zeros((2, n))
    for c in range(2):
        for lo, hi, k in ((None, 600, 1.05), (600, 3000, 0.85), (3000, None, 0.5)):
            x = rng.normal(0, 1, n)
            if lo is None:
                x = sos_filter(x, "low", hi)
            elif hi is None:
                x = sos_filter(x, "high", lo)
            else:
                x = sos_filter(x, "band", (lo, hi))
            ir[c] += x * np.exp(-6.9 * t / (rt60 * k))
        pre = int(0.019 * SR)
        ir[c] = np.concatenate([np.zeros(pre), ir[c][:-pre]])
        for d, g in ((0.011, 0.5), (0.017, 0.35), (0.023 + 0.004 * c, 0.3), (0.031, 0.22), (0.043 - 0.003 * c, 0.18)):
            ir[c][int(d * SR)] += g * 6
    ir /= np.sqrt(np.sum(ir ** 2) / 2)
    return ir


# =========================================================================== the score
def compose():
    music = Bus("music", wet=0.32)
    sfx = Bus("sfx", wet=0.18)

    # ---------------------------------------------------------------- BAR 1 (0-2): a world drawn into existence
    # low strings breathe in on a D pedal
    music.add(strings(note("D2"), 2.05, vel=0.34, attack=0.7, release=0.25, voices=4, bright=0.25, width=0.3), 0.0)
    music.add(strings(note("D3"), 2.05, vel=0.22, attack=0.9, release=0.25, voices=4, bright=0.3), 0.0)
    for nm in ("A3", "D4", "E4", "F#4"):
        music.add(strings(note(nm), 1.05, vel=0.13, attack=0.55, release=0.3, bright=0.35), 0.0)
    for nm in ("G3", "B3", "D4", "F#4"):
        music.add(strings(note(nm), 1.0, vel=0.15, attack=0.3, release=0.3, bright=0.4), 1.0)
    music.add(strings(note("C#5"), 1.0, vel=0.07, attack=0.4, release=0.3, bright=0.5), 1.0)  # the Lydian sparkle
    # harp draws the first shapes
    for i, nm in enumerate(("D3", "A3", "D4", "E4", "F#4", "A4", "D5")):
        music.add(harp(nm, 0.32 - i * 0.015), 0.0 + i * 0.105, pan=-0.4 + i * 0.12)
    for i, nm in enumerate(("G2", "D3", "G3", "B3", "C#4", "F#4")):
        music.add(harp(nm, 0.26), 1.0 + i * 0.09, pan=-0.3 + i * 0.12)
    music.add(glock("A6", 0.09), 0.0, pan=0.3)
    music.add(triangle(0.05), 0.02, pan=0.5)
    # the theme, first time: flute, softly, with celesta an octave above
    for nm, t0, d in (("A4", 0.5, 0.25), ("D5", 0.75, 0.25), ("E5", 1.0, 0.25), ("F#5", 1.25, 0.72)):
        music.add(flute(note(nm), d, vel=0.24), t0, pan=0.15)
        music.add(celesta(nm[:-1] + str(int(nm[-1]) + 1), 0.07), t0, pan=0.25)
    # the hopping clouds land on soft pizzicato
    for t0, nm in zip(Q["cloudBounces"], ("D3", "A2", "D3", "B2")):
        music.add(pizz(nm, 0.3), t0, pan=-0.2)
        music.add(pizz(nm[:-1] + str(int(nm[-1]) + 1), 0.14), t0, pan=0.2)
    # trees sprout on a sparkle of plucks
    for t0, nm in zip(Q["treePops"], ("D5", "E5", "F#5", "A5", "B5", "D6", "E6", "F#6")):
        p = rng.uniform(-0.7, 0.7)
        music.add(harp(nm, 0.11), t0, pan=p)
        music.add(celesta(nm, 0.05), t0, pan=p)

    # ---------------------------------------------------------------- BAR 2 (2-4): a journey through the world
    # the swoop: a harp glissando and a string swell up the mountain
    scale = ["D4", "E4", "F#4", "G4", "A4", "B4", "C#5", "D5", "E5", "F#5", "G5", "A5", "B5", "C#6", "D6", "E6", "F#6", "A6"]
    g0, g1 = Q["mountainSwoop"] - 0.04, Q["newLand"]
    for i, nm in enumerate(scale):
        u = i / (len(scale) - 1)
        music.add(harp(nm, 0.16 + 0.06 * u), g0 + (g1 - g0) * (u ** 0.8), pan=-0.5 + u)
    music.add(strings(note("B2"), 1.0, vel=0.3, attack=0.25, release=0.2, voices=4, bright=0.3, width=0.3), 2.0)
    for nm in ("B3", "D4", "F#4", "A4"):
        music.add(strings(note(nm), 1.0, vel=0.15, attack=0.35, release=0.25, bright=0.45), 2.0)
    music.add(strings(note("G2"), 0.5, vel=0.3, attack=0.12, release=0.15, voices=4, bright=0.3, width=0.3), 3.0)
    for nm in ("B3", "D4", "F#4", "A4"):
        music.add(strings(note(nm), 0.5, vel=0.16, attack=0.15, release=0.2, bright=0.45), 3.0)
    music.add(strings(note("F#2"), 0.55, vel=0.32, attack=0.12, release=0.2, voices=4, bright=0.3, width=0.3), 3.5)
    for nm in ("A3", "C#4", "E4", "F#4"):
        music.add(strings(note(nm), 0.55, vel=0.17, attack=0.2, release=0.25, bright=0.5), 3.5)
    # a light pizzicato walking groove for the road trip
    groove = [("B2", "F#3", "D4", "F#3")] * 2 + [("G2", "D3", "B3", "D3")] + [("F#2", "C#3", "A3", "C#3")]
    k = 0
    for bar in groove:
        for nm in bar:
            t0 = 2.5 + k * 0.125
            if t0 < 3.96:
                music.add(pizz(nm, 0.26 if k % 4 == 0 else 0.17), t0, pan=-0.15 + 0.1 * (k % 2))
            k += 1
    # shaker keeps the journey moving (eighths, a little swing)
    for i in range(12):
        t0 = 2.5 + i * 0.125 + (0.012 if i % 2 else 0)
        music.add(shaker(0.07 if i % 2 else 0.11), t0, pan=0.45)
    # each house pops on the next note of a pentatonic run
    for t0, nm in zip(Q["housePops"], ("B4", "D5", "E5", "F#5", "A5")):
        music.add(celesta(nm, 0.1), t0, pan=0.1)
    # the boat's little bell
    music.add(bell(note("A5"), 0.14), Q["boatSail"], pan=0.45)
    # pull-back: strings lift and a harp glissando climbs as the continents appear
    for i, nm in enumerate(["A3", "C#4", "E4", "F#4", "A4", "C#5", "E5", "F#5", "A5", "C#6", "E6"]):
        u = i / 10
        music.add(harp(nm, 0.12 + 0.05 * u), Q["zoomOut"] + 0.08 + 0.5 * u, pan=0.6 - 1.2 * u)
    music.add(cymbal_swell(0.62, 0.1), Q["zoomOut"], pan=0.0)

    # ---------------------------------------------------------------- BAR 3 (4-6): the Earth takes shape
    music.add(strings(note("E2"), 1.02, vel=0.4, attack=0.5, release=0.15, voices=5, bright=0.35, width=0.3), 4.0)
    music.add(strings(note("E3"), 1.02, vel=0.22, attack=0.6, release=0.15, voices=4, bright=0.4), 4.0)
    for nm, v in (("B3", 0.17), ("D4", 0.16), ("F#4", 0.16), ("G4", 0.15)):
        music.add(strings(note(nm), 1.02, vel=v, attack=0.85, release=0.15, bright=0.55), 4.0)
    for nm in ("G3", "B3", "E4"):
        music.add(horn(note(nm), 1.0, vel=0.2, attack=0.6, release=0.15), 4.0)
    # the theme, second time, in violins a step higher (over Em -> A)
    for nm, t0, d, v in (("B4", 4.25, 0.25, 0.18), ("E5", 4.5, 0.25, 0.2), ("F#5", 4.75, 0.25, 0.22), ("G5", 5.0, 0.98, 0.26)):
        music.add(strings(note(nm), d, vel=v, attack=0.05, release=0.12, voices=5, bright=0.7, width=0.5), t0)
    # timpani roll into the globe's arrival
    music.add(timp_roll("A1", 0.6, 0.03, 0.22), Q["globeFormed"] - 0.62, pan=-0.1)
    music.add(timpani("A1", 0.62, decay=1.6), Q["globeFormed"], pan=-0.1)
    music.add(cymbal_swell(0.9, 0.12, peak_at=0.9), Q["globeFormed"] - 0.9, pan=0.15)
    # A7sus4 -> A7
    music.add(strings(note("A1"), 1.0, vel=0.36, attack=0.03, release=0.15, voices=4, bright=0.3, width=0.3), 5.0)
    music.add(strings(note("A2"), 1.0, vel=0.32, attack=0.03, release=0.15, voices=4, bright=0.35, width=0.3), 5.0)
    for nm in ("E3", "A3", "D4"):
        music.add(strings(note(nm), 0.5, vel=0.2, attack=0.04, release=0.12, bright=0.55), 5.0)
    for nm in ("E3", "A3", "C#4"):
        music.add(strings(note(nm), 0.5, vel=0.22, attack=0.05, release=0.12, bright=0.6), 5.5)
    for nm in ("A3", "D4"):
        music.add(horn(note(nm), 0.5, vel=0.32, attack=0.05, release=0.1), 5.0)
    for nm in ("A3", "C#4"):
        music.add(horn(note(nm), 0.5, vel=0.34, attack=0.05, release=0.12), 5.5)
    # the spin: a sweeping run up the A mixolydian scale
    run = ["A4", "B4", "C#5", "D5", "E5", "F#5", "G5", "A5"]
    r0 = Q["spinGo"] + 0.04
    step = (Q["spinSettle"] - r0) / len(run)
    for i, nm in enumerate(run):
        music.add(strings(note(nm), step * 1.2, vel=0.16 + 0.02 * i, attack=0.015, release=0.06, voices=4, bright=0.8, width=0.6), r0 + i * step, pan=-0.6 + 1.2 * i / 7)
    music.add(timpani("A1", 0.28, decay=0.7), Q["spinSettle"], pan=-0.1)
    for i, nm in enumerate(["D5", "E5", "F#5", "A5", "B5", "D6"]):
        music.add(harp(nm, 0.12 + 0.02 * i), 5.82 + i * 0.03, pan=0.3)
    music.add(cymbal_swell(0.32, 0.12), 5.68, pan=0.0)

    # ---------------------------------------------------------------- BAR 4 (6-8): the title
    T0 = Q["titleStart"]
    music.add(timpani("D2", 0.62, decay=1.8), T0, pan=-0.1)
    music.add(sub_bloom(note("D1"), 1.8, 0.32), T0)
    music.add(strings(note("D2"), 1.9, vel=0.45, attack=0.02, release=0.4, voices=5, bright=0.35, width=0.35), T0)
    music.add(strings(note("D3"), 1.9, vel=0.3, attack=0.02, release=0.4, voices=5, bright=0.4), T0)
    for nm in ("A3", "D4", "F#4"):
        music.add(strings(note(nm), 1.9, vel=0.2, attack=0.03, release=0.4, bright=0.55), T0)
    for nm in ("D4", "F#4"):
        music.add(horn(note(nm), 1.25, vel=0.3, attack=0.05, release=0.35), T0)
    music.add(cymbal_swell(0.05, 0.1, peak_at=0.04), T0 - 0.04, pan=0.0)
    for i, nm in enumerate(("D3", "A3", "D4", "F#4", "A4")):
        music.add(harp(nm, 0.2), T0 + i * 0.012, pan=-0.3 + 0.15 * i)
    # the theme, third time: horns and violins together -> the signature
    theme = (("A4", T0, 0.25, 0.34), ("D5", T0 + 0.25, 0.25, 0.36), ("E5", T0 + 0.5, 0.25, 0.38), ("F#5", T0 + 0.75, 0.5, 0.4))
    for nm, t0, d, v in theme:
        music.add(horn(note(nm), d, vel=v * 1.35, attack=0.03, release=0.1), t0)
        music.add(strings(note(nm), d, vel=v * 0.85, attack=0.02, release=0.1, voices=6, bright=0.8, width=0.5), t0)
    # each letter lands on a celesta + pizzicato sparkle, with a soft felt thump
    for i, (t0, nm) in enumerate(zip(Q["letterLands"], ("D5", "E5", "F#5", "A5", "B5", "D6", "E6", "F#6", "A6"))):
        p = -0.65 + 1.3 * i / 8
        music.add(celesta(nm, 0.16), t0, pan=p)
        music.add(pizz(nm[:-1] + str(int(nm[-1]) - 1), 0.12), t0, pan=p)
        sfx.add(thump(0.13, 110 + 6 * i), t0, pan=p)
    # the subtitle is written on a gentle harp arpeggio
    a0, a1 = Q["subtitleWrite"]
    sub_notes = ("D4", "F#4", "A4", "D5", "F#5", "A5", "D6")
    for i, nm in enumerate(sub_notes):
        music.add(harp(nm, 0.16), a0 + (a1 - a0) * i / len(sub_notes), pan=-0.3 + 0.6 * i / 6)
    # the signature chime: theme resolves up to A over a D add9 bloom
    C0 = Q["signatureChime"]
    music.add(glock("A6", 0.2), C0, pan=0.2)
    music.add(glock("D6", 0.12), C0 + 0.012, pan=-0.2)
    for nm in ("D6", "F#6", "A6"):
        music.add(celesta(nm, 0.12), C0, pan=0.1)
    music.add(bell(note("D6"), 0.12), C0, pan=0.0)
    for nm, v in (("A5", 0.3), ("E5", 0.16), ("D5", 0.16)):
        music.add(strings(note(nm), 0.9, vel=v, attack=0.06, release=0.6, voices=6, bright=0.65, width=0.6), C0)
    music.add(horn(note("A4"), 0.9, vel=0.26, attack=0.08, release=0.5), C0)
    music.add(horn(note("D4"), 0.9, vel=0.22, attack=0.08, release=0.5), C0)
    for i, nm in enumerate(("D3", "A3", "D4", "F#4", "A4", "E5")):
        music.add(harp(nm, 0.15), C0 + i * 0.02, pan=-0.4 + 0.16 * i)
    music.add(triangle(0.06), C0, pan=0.4)

    # =============================================================== SOUND DESIGN
    # the sea: a soft bed under the opening
    sea = sea_bed(1.6, 0.16)
    sea *= np.clip((1.45 - tt(sea.shape[1])) / 0.4, 0, 1)
    sfx.add(sea, 0.0)
    # the wave gathers, rolls across from the left and curls (pan follows it)
    ws, wc = Q["waveStart"], Q["waveCrash"]
    wv = whoosh(wc - ws + 0.05, 260, 2600, vel=0.42, peak=0.86, bw=0.9)
    nn = len(wv)
    pans = np.linspace(-0.9, 0.05, nn)
    gl, gr = pan_gains(pans)
    sfx.add(np.vstack([wv * gl, wv * gr]), ws)
    sfx.add(whoosh(0.18, 1500, 4200, vel=0.12, peak=0.6, bw=0.7), Q["waveCurl"] - 0.06, pan=-0.1)
    # crash: splash, a soft low thud and a scatter of droplets
    sfx.add(whoosh(0.55, 4200, 900, vel=0.2, peak=0.06, bw=1.2), wc, pan=0.05)
    sfx.add(thump(0.2, 70), wc, pan=0.0)
    for i in range(9):
        sfx.add(droplet(rng.uniform(900, 2100), 0.05), wc + 0.05 + rng.random() * 0.4, pan=rng.uniform(-0.6, 0.6))
    # the land blooms out of the sea with a rustle
    lb = Q["landBloom"]
    sfx.add(rustle(0.65, 0.1, density=420, shape=lambda c: np.exp(-((c - 0.15) / 0.22) ** 2)), lb, pan=-0.3)
    sfx.add(rustle(0.65, 0.09, density=420, shape=lambda c: np.exp(-((c - 0.2) / 0.22) ** 2)), lb + 0.02, pan=0.35)
    # the river runs off into the distance
    river = babble(1.3, 0.06)
    river *= np.clip(tt(len(river)) / 0.3, 0, 1) * np.clip((1.3 - tt(len(river))) / 0.3, 0, 1)
    sfx.add(river, lb + 0.15, pan=0.0)
    # mountains: a pencil sketch, then a pop as each one springs up
    for t0, p, fr in zip(Q["mountainPops"], (-0.5, 0.6, 0.0), ("D4", "F#4", "A4")):
        sfx.add(pencil(0.2, 0.09), t0 - 0.2, pan=p)
        sfx.add(pop(note(fr), 0.28), t0, pan=p)
    # trees: tiny leafy pips
    for t0 in Q["treePops"]:
        sfx.add(rustle(0.08, 0.1, density=500), t0, pan=rng.uniform(-0.6, 0.6))
    # clouds: a puff of air on each hop
    for t0 in Q["cloudBounces"]:
        sfx.add(whoosh(0.12, 500, 1100, vel=0.05, peak=0.3), t0 - 0.02, pan=-0.3)
    # the mountain stretches and we swoop up and over it
    sfx.add(whoosh(Q["newLand"] - Q["mountainStretch"] + 0.08, 280, 3200, vel=0.6, peak=0.85, bw=0.8), Q["mountainStretch"], pan=0.0)
    sfx.add(triangle(0.04, 2100), Q["newLand"], pan=0.2)
    # the road is painted on with a long brush stroke (bottom-left to top-right)
    br = whoosh(0.4, 900, 1600, vel=0.22, peak=0.4, bw=0.6)
    gl, gr = pan_gains(np.linspace(-0.6, 0.6, len(br)))
    sfx.add(np.vstack([br * gl, br * gr]), Q["roadDraw"])
    # houses pop up (with a little chimney puff)
    for i, t0 in enumerate(Q["housePops"]):
        sfx.add(pop(note(("B3", "D4", "E4", "F#4", "A4")[i]), 0.2), t0, pan=-0.5 + 0.25 * i)
        sfx.add(whoosh(0.1, 800, 1400, vel=0.03, peak=0.3), t0 + 0.12, pan=-0.4 + 0.25 * i)
    # the sea floods in from the right and laps at the new coast
    fl = whoosh(0.34, 3200, 520, vel=0.3, peak=0.25, bw=1.0)
    gl, gr = pan_gains(np.linspace(0.85, 0.25, len(fl)))
    sfx.add(np.vstack([fl * gl, fl * gr]), Q["coastFlood"])
    sfx.add(whoosh(0.45, 2400, 800, vel=0.12, peak=0.1, bw=1.1), Q["coastFlood"] + 0.27, pan=0.3)
    for i in range(5):
        sfx.add(droplet(rng.uniform(700, 1600), 0.05), Q["coastFlood"] + 0.1 + rng.random() * 0.3, pan=rng.uniform(0.1, 0.8))
    lap = babble(0.7, 0.04)
    lap *= np.clip(tt(len(lap)) / 0.15, 0, 1) * np.clip((0.7 - tt(len(lap))) / 0.2, 0, 1)
    sfx.add(lap, Q["boatSail"] + 0.05, pan=0.45)
    # the pull-back: air rushing past as the world falls away beneath us
    sfx.add(whoosh(0.66, 2600, 260, vel=0.26, peak=0.3, bw=1.0), Q["zoomOut"], pan=0.0)
    for i in range(4):
        sfx.add(pencil(0.16, 0.05), Q["continentsDraw"] + i * 0.07, pan=(-0.6, 0.6, -0.3, 0.3)[i])
    # the map curls into a ball: a papery roll that narrows from wide stereo to centre
    cs, cg = Q["curlStart"], Q["globeFormed"]
    paper = rustle(cg - cs, 0.065, density=520, band=(700, 4200), shape=lambda c: 0.3 + 0.7 * (c / (cg - cs)))
    roll = whoosh(cg - cs, 260, 1100, vel=0.11, peak=0.8, bw=0.9)
    nn = len(paper)
    width = np.linspace(0.9, 0.0, nn)
    L = paper * pan_gains(-width)[0] + roll[:nn] * 0.7
    R = paper * pan_gains(width)[1] + roll[:nn] * 0.7
    sfx.add(np.vstack([L, R]), cs)
    # the globe arrives: ripples spread across its oceans
    for i, (dt_, p) in enumerate(((0.06, -0.4), (0.16, 0.45), (0.27, -0.1))):
        sfx.add(droplet(520 + 90 * i, 0.08), cg + dt_, pan=p)
    # wind-up and spin: a breath in, then a whoosh that travels round the planet
    sfx.add(whoosh(Q["spinGo"] - Q["spinWindup"] + 0.02, 600, 1500, vel=0.16, peak=0.95), Q["spinWindup"], pan=-0.2)
    sp = whoosh(Q["spinSettle"] - Q["spinGo"] + 0.15, 500, 1300, vel=0.75, peak=0.45, bw=0.8)
    gl, gr = pan_gains(np.sin(np.linspace(-1.2, 1.4, len(sp))))
    sfx.add(np.vstack([sp * gl, sp * gr]), Q["spinGo"])
    # the subtitle's pen
    sfx.add(pencil(a1 - a0, 0.035), a0, pan=0.0)

    return music, sfx


# =========================================================================== mix & master
def k_weighted_loudness(x):
    """approximate integrated loudness (ITU-R BS.1770, K-weighting, simple gating)"""
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    y = signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=1), axis=1)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    pw = []
    for i in range(0, y.shape[1] - blk, hop):
        pw.append(np.sum(np.mean(y[:, i:i + blk] ** 2, axis=1)))
    pw = np.array(pw)
    lk = -0.691 + 10 * np.log10(pw + 1e-12)
    g = pw[lk > -70]
    rel = -0.691 + 10 * np.log10(np.mean(g)) - 10
    g = pw[(lk > -70) & (lk > rel)]
    return -0.691 + 10 * np.log10(np.mean(g))


def master(music, sfx):
    ir = make_ir(2.1)
    dry = music.buf + sfx.buf
    send = music.buf * music.wet + sfx.buf * sfx.wet
    wet = np.vstack([signal.fftconvolve(send[c], ir[c])[:NTOT] for c in range(2)])
    mix = dry + 0.55 * wet
    mix = signal.sosfilt(signal.butter(2, 32, "high", fs=SR, output="sos"), mix, axis=1)
    # gentle tilt: tame the sub a little, lift presence and air so the plucks and bells sparkle
    mix = mix - 0.2 * signal.sosfilt(signal.butter(2, 110, "low", fs=SR, output="sos"), mix, axis=1)
    mix = mix + 0.35 * signal.sosfilt(signal.butter(1, 2800, "high", fs=SR, output="sos"), mix, axis=1)
    # trim to exactly the picture length with a soft fade into silence
    n = int(DUR * SR)
    mix = mix[:, :n]
    t = tt(n)
    fade_in = np.clip(t / 0.01, 0, 1)
    fade_out = np.where(t > Q["holdFrom"] + 0.06, 0.5 + 0.5 * np.cos(np.pi * np.clip((t - Q["holdFrom"] - 0.06) / (DUR - Q["holdFrom"] - 0.06), 0, 1)), 1.0)
    mix *= fade_in * fade_out
    # level to a YouTube-friendly loudness, then a soft-knee peak limiter at -1 dBFS
    target = -15.0
    lufs = k_weighted_loudness(mix)
    mix *= 10 ** ((target - lufs) / 20)
    ceiling = 10 ** (-1.0 / 20)
    knee = 0.7 * ceiling
    a = np.abs(mix)
    over = a > knee
    mix[over] = np.sign(mix[over]) * (knee + (ceiling - knee) * np.tanh((a[over] - knee) / (ceiling - knee)))
    return mix, k_weighted_loudness(mix)


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    ints = (x.T * (2 ** 23 - 1)).astype("<i4")
    b = ints.astype("<i4").tobytes()
    # pack 32-bit little-endian ints into 24-bit
    arr = np.frombuffer(b, dtype=np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(arr)


def spectrogram_png(x, path):
    """a quick visual sync check: spectrogram with the cue sheet drawn over it"""
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return
    mono = x.mean(axis=0)
    f, tseg, S = signal.spectrogram(mono, fs=SR, nperseg=2048, noverlap=2048 - 240)
    S = 10 * np.log10(S + 1e-12)
    keep = f < 9000
    S = S[keep][::-1]
    S = np.clip((S - (S.max() - 80)) / 80, 0, 1)
    img = (np.stack([S ** 1.5, S ** 0.8, S ** 0.5], -1) * 255).astype(np.uint8)
    im = Image.fromarray(img).resize((1600, 500))
    d = ImageDraw.Draw(im)
    for k, v in Q.items():
        for tv in (v if isinstance(v, list) else [v]):
            if isinstance(tv, (int, float)):
                xpx = int(tv / DUR * 1600)
                d.line([(xpx, 0), (xpx, 18)], fill=(255, 210, 60), width=1)
    for b in range(5):
        xpx = int(b * 2 / DUR * 1599)
        d.line([(xpx, 0), (xpx, 500)], fill=(255, 255, 255), width=1)
    im.save(path)


def main():
    music, sfx = compose()
    mix, lufs = master(music, sfx)
    out = HERE / "world_exe_score.wav"
    write_wav(out, mix)
    peak = 20 * np.log10(np.max(np.abs(mix)) + 1e-12)
    print(f"wrote {out.relative_to(ROOT)}  {mix.shape[1] / SR:.3f}s  peak {peak:.2f} dBFS  loudness {lufs:.1f} LUFS")
    if "--spectrogram" in sys.argv:
        spectrogram_png(mix, ROOT / "out" / "score_spectrogram.png")
        print("wrote out/score_spectrogram.png")


if __name__ == "__main__":
    main()
