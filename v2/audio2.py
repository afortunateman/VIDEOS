# Synthesize soundtrack + SFX timed to sentence beats, mix under voice.mp3 -> mix.wav
import json, subprocess, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 44100
T = json.load(open('sent_timing.json'))
S = lambda i: T[i]['s']; E = lambda i: T[i]['e']
voice = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', 'voice.mp3', '-ac', '1', '-ar', str(SR),
                                      '-f', 's16le', '-'], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
N = len(voice) + SR * 2
rng = np.random.default_rng(3)
music, sfx = np.zeros(N, np.float32), np.zeros(N, np.float32)

def put(buf, x, t, g=1.0):
    i = int(t * SR)
    if i < 0: x, i = x[-i:], 0
    j = min(i + len(x), N)
    if i < N: buf[i:j] += x[:j - i] * g

def tt(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def env(n, a, r):  # attack/release fade (seconds)
    e = np.ones(n, np.float32); ai, ri = int(a * SR), int(r * SR)
    if ai: e[:ai] = np.linspace(0, 1, ai)
    if ri: e[-ri:] *= np.linspace(1, 0, ri)
    return e
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---- instruments ----------------------------------------------------------
def pluck(f, d=1.2, bright=1.0):
    t = tt(d); x = np.zeros_like(t)
    for n in range(1, 9):
        x += np.sin(2 * np.pi * f * n * t * (1 + 0.0007 * n)) * np.exp(-t * (2.5 + n * 1.6 / bright)) / n ** 1.1
    x[:40] *= np.linspace(0, 1, 40)
    return x * 0.5

def drone(f, d, g=1.0):
    t = tt(d); x = np.zeros_like(t); vib = 1 + 0.002 * np.sin(2 * np.pi * 0.23 * t)
    for n in range(1, 10):
        x += np.sin(2 * np.pi * f * n * t * vib + n) / n ** 1.4
    return lp(x, 900) * env(len(t), 2.5, 2.5) * g * 0.35

def pad(notes, d, g=1.0, choir=False):
    t = tt(d); x = np.zeros_like(t)
    for m in notes:
        for det in (-0.004, 0.004):
            ph = 2 * np.pi * hz(m) * (1 + det) * t + (0.012 * np.sin(2 * np.pi * 5.1 * t) if choir else 0)
            x += np.sin(ph) + (0.3 * np.sin(2 * ph) if choir else 0.15 * np.sin(3 * ph))
    return x * env(len(t), 1.5, 1.8) * g * 0.06

def thump(f0=90, f1=40, d=0.35, g=1.0):
    t = tt(d); ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-t * 18)) / SR
    return (np.sin(ph) * np.exp(-t * 11) + lp(rng.normal(0, 1, len(t)), 400) * np.exp(-t * 40) * 0.6) * g

def boom(g=1.0):
    t = tt(3.0); ph = 2 * np.pi * np.cumsum(32 + 60 * np.exp(-t * 3)) / SR
    x = np.sin(ph) * np.exp(-t * 1.4) + lp(rng.normal(0, 1, len(t)), 180) * np.exp(-t * 2.2) * 0.8
    x[:200] += rng.normal(0, 0.6, 200)
    return x * g * 0.9

def whoosh(d=0.45, g=1.0, up=True):
    n = int(d * SR); x = rng.normal(0, 1, n); out = np.zeros(n)
    k = 8
    for s in range(k):  # stepped band sweep
        a, b = s * n // k, (s + 1) * n // k
        c = 400 * 2 ** ((s if up else k - s) * 0.55)
        out[a:b] = bp(x, c * 0.6, min(c * 1.6, 18000))[a:b]
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    return out * e * g * 0.35

def bell(f=98, g=1.0):
    t = tt(6.0); x = np.zeros_like(t)
    for r, a, dec in [(.5, .6, .5), (1, 1, .7), (1.19, .5, 1), (1.5, .45, 1.1), (2, .35, 1.4), (2.51, .3, 1.8), (2.66, .25, 2), (3.01, .2, 2.4), (4.17, .15, 3)]:
        x += np.sin(2 * np.pi * f * r * t) * a * np.exp(-t * dec)
    x[:60] *= np.linspace(0, 1, 60)
    return x * g * 0.18

def tick(hi=True):
    t = tt(0.04); return bp(rng.normal(0, 1, len(t)), 2500 if hi else 1800, 6000) * np.exp(-t * 180) * 0.5

def heartbeat(g=1.0):
    x = np.zeros(int(0.9 * SR)); a = thump(70, 38, 0.3, 1.0); b = thump(60, 35, 0.3, 0.7)
    x[:len(a)] += a; i = int(0.24 * SR); x[i:i + len(b)] += b
    return x * g

def riser(d=2.0, g=1.0):
    t = tt(d); f = 180 * (7 ** (t / d))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + bp(rng.normal(0, 1, len(t)), 1500, 9000) * 0.5
    return x * (t / d) ** 2.2 * g * 0.5

def murmur(d, g=1.0):
    t = tt(d); x = np.zeros_like(t)
    for v in range(10):
        am = 0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(2.5, 5.5) * t + rng.uniform(0, 6)) ** 2
        x += bp(rng.normal(0, 1, len(t)), rng.uniform(250, 500), rng.uniform(900, 1800)) * am * rng.uniform(.4, 1)
    return x * env(len(t), 1.0, 1.0) * g * 0.05

# ---- score ------------------------------------------------------------------
D2, A2, D3 = hz(38), hz(45), hz(50)
EIGHTH = 0.29
MOTIF = [69, 69, 67, 65, 64, 62, 65, 67, 69, 69, 67, 64, 62, 64, 65, 67, 65, 64, 62, 62, 60, 62, 64, 62]  # D dorian

def dance(t0, t1, level=1.0, stomp=True, grow=False):
    n = int((t1 - t0) / EIGHTH)
    for k in range(n):
        t = t0 + k * EIGHTH; u = k / max(n - 1, 1); lv = level * (0.5 + 0.5 * u if grow else 1)
        if k % 2 == 0 or lv > 0.8: put(music, pluck(hz(MOTIF[k % len(MOTIF)]), 0.9), t, 0.55 * lv)
        if k % 6 == 0: put(music, pluck(hz(50), 1.4, 0.6), t, 0.5 * lv)
        if stomp and k % 3 == 0: put(sfx, thump(110, 45, 0.25), t, (0.5 if k % 6 == 0 else 0.3) * lv)

def drone_bed(t0, t1, f=D2, g=1.0):
    put(music, drone(f, t1 - t0 + 2.5), t0 - 1, g); put(music, drone(f * 1.5, t1 - t0 + 2.5), t0 - 1, g * 0.5)

def chords(t0, t1, prog, g=1.0, choir=False):
    k, t = 0, t0
    while t < t1:
        put(music, pad(prog[k % len(prog)], min(4.5, t1 - t + 1.5), g, choir), t); t += 4; k += 1

Dm, Bb, Gm, A_, F, C = [50, 53, 57], [46, 50, 53], [43, 50, 55], [45, 49, 52], [41, 48, 53], [48, 52, 55]
# A: opening
drone_bed(0, S(8), g=0.9); chords(0, S(8), [Dm, Bb], 0.8)
# B: dancing spreads (sparse -> full)
drone_bed(S(8), S(26), g=0.8); dance(S(8), S(15), 0.45, stomp=False); dance(S(15), S(26), 0.9, grow=True)
# C: context, faith
drone_bed(S(26), S(40), A2 / 2 * 2, 0.8); chords(S(26), S(34), [Dm, Gm, Bb, A_], 0.9); chords(S(34), S(40), [Dm, F, Gm, A_], 1.0, choir=True)
# D: authorities, the cure -> ironic dance returns bigger
drone_bed(S(40), S(45), g=0.8)
for k in range(int((S(45) - S(40)) / 0.5)): put(sfx, tick(k % 2 == 0), S(40) + k * 0.5, 0.35)
dance(S(45), S(53), 1.0, grow=True); chords(S(48), S(53), [Dm, C, Bb, A_], 0.7)
# E: consequences; music cut on "music stopped" (60)
drone_bed(S(53), S(60), D2 * 0.94, 0.9); chords(S(53), S(60), [Dm, Bb, Gm, A_], 0.8)
chords(S(62), S(66), [Dm, F, C, Dm], 1.1, choir=True); drone_bed(S(62), S(66), g=0.6)
# F: mystery + theories
drone_bed(S(66), S(80), A2 / 2, 0.9); chords(S(68), S(80), [Dm, Bb, Gm, A_], 0.7)
for k in range(int((E(71) - S(68)) / 0.86)): put(sfx, heartbeat(), S(68) + k * 0.86, 0.7)
# G: reflection
chords(S(80), S(91), [F, C, Dm, Bb], 0.9); drone_bed(S(80), S(91), g=0.5)
for k in range(int((S(91) - S(80)) / 1.16)): put(music, pluck(hz(MOTIF[(k * 5) % 24] + 12), 1.6, 0.7), S(80) + k * 1.16, 0.25)
# H: ending - motif softly, final bell
dance(S(91), E(96) - 1, 0.5, stomp=False); drone_bed(S(91), E(96) + 1, g=0.8); chords(S(91), E(96), [Dm, Bb, Dm, A_], 0.9)

# ---- SFX at story beats ---------------------------------------------------
for i, g in [(0, 1), (6, .8), (13, .5), (45, 1), (53, .9), (57, .9), (60, .8), (66, 1)]: put(sfx, boom(g), S(i) - 0.02)
for i in [0, 34, 62, 65, 78, 95]: put(sfx, bell(98 if i != 95 else 87), S(i), 0.9)
for i in [2, 8, 15, 19, 26, 34, 40, 44, 53, 62, 66, 68, 72, 74, 78, 80, 86, 91]: put(sfx, whoosh(0.45), S(i) - 0.3, 0.8)
put(sfx, riser(2.0), S(44) - 2.0, 0.8); put(sfx, riser(2.2), S(66) - 2.2, 0.8)
for k in range(int((S(11) - S(8)) / 0.5)): put(sfx, tick(k % 2 == 0), S(8) + k * 0.5, 0.3)
for a, b, g in [(3, 6, .8), (15, 19, .9), (19, 26, 1.4), (45, 53, 1.2), (62, 65, .5)]: put(sfx, murmur(S(b) - S(a) + 1), S(a), g)
# music hard-stops at "music events were stopped"
cut = int(S(60) * SR); music[cut:cut + int(1.6 * SR)] *= np.linspace(0, 1, int(1.6 * SR)) ** 3

# ---- mix --------------------------------------------------------------------
ir = rng.normal(0, 1, int(2.2 * SR)) * np.exp(-np.arange(int(2.2 * SR)) / SR * 3.2)
music = music + fftconvolve(music, ir)[:N] * 0.012
sfx = sfx + fftconvolve(sfx, ir)[:N] * 0.006
fade = np.ones(N, np.float32); fe = int(E(96) * SR); fade[fe:] = np.linspace(1, 0, N - fe) ** 2
music *= 0.115 / (np.abs(music).max() + 1e-9) * fade
sfx *= 0.6 / (np.abs(sfx).max() + 1e-9) * fade
mix = np.zeros(N, np.float32); mix[:len(voice)] = voice * 0.95
mix += music + sfx
r = lambda x: 20*np.log10(np.sqrt(np.mean(x[:len(voice)]**2))+1e-9)
print('voice %.1f dB, music %.1f dB, sfx %.1f dB' % (r(voice*0.95), r(music), r(sfx)))
mix /= max(1.0, np.abs(mix).max() / 0.97)
wavfile.write('mix.wav', SR, (mix * 32767).astype(np.int16))
print('mix.wav', N / SR, 's')
