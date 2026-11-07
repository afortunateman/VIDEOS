"""Analyse a music file for editing to picture: tempo, strong onsets, loudness curve and the
key/chord per window, so cuts land on hits and crossfades join matching harmony.

Usage: python audio_analyze.py <audio> [--win 4] [--top 25]
Needs ffmpeg on PATH and numpy.
"""
import argparse
import subprocess

import numpy as np

SR = 22050
NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


def stft(x, n=2048, hop=512):
    w = np.hanning(n)
    frames = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * w
    return np.abs(np.fft.rfft(frames, axis=1)), hop / SR


def key_of(chroma):
    best = None
    for i in range(12):
        for name, prof in (('major', MAJOR), ('minor', MINOR)):
            r = np.corrcoef(chroma, np.roll(prof, i))[0, 1]
            if best is None or r > best[0]:
                best = (r, f"{NOTES[i]} {name}")
    return best[1], best[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--win", type=float, default=4.0, help="seconds per key/loudness window")
    ap.add_argument("--top", type=int, default=25, help="how many strongest onsets to list")
    a = ap.parse_args()
    x = load(a.audio)
    S, dt = stft(x)
    freqs = np.fft.rfftfreq(2048, 1 / SR)
    # onset strength: positive spectral flux on a log spectrum
    L = np.log1p(S * 10)
    flux = np.maximum(0, np.diff(L, axis=0)).sum(1)
    flux = (flux - flux.mean()) / (flux.std() + 1e-9)
    peaks = [i for i in range(1, len(flux) - 1) if flux[i] > flux[i - 1] and flux[i] >= flux[i + 1] and flux[i] > 1.5]
    # tempo from onset autocorrelation (60-180 bpm)
    ac = np.correlate(flux, flux, 'full')[len(flux) - 1:]
    lags = np.arange(len(ac)) * dt
    ok = (lags > 60 / 180) & (lags < 60 / 60)
    bpm = 60 / lags[ok][np.argmax(ac[ok])]
    print(f"duration {len(x) / SR:.2f} s, tempo ~{bpm:.1f} bpm")
    print(f"\nstrongest onsets (good cut / hit points):")
    for i in sorted(sorted(peaks, key=lambda i: -flux[i])[:a.top]):
        print(f"  {(i + 1) * dt:8.3f} s  strength {flux[i]:.1f}")
    # chroma per window
    pc = np.round(12 * np.log2(np.maximum(freqs, 1) / 440) + 69) % 12
    band = (freqs > 60) & (freqs < 5000)
    hop_w = int(a.win / dt)
    print(f"\nwindow   rms dB   key (confidence)   -- join sections only where the key matches")
    for s in range(0, len(S), hop_w):
        seg = S[s:s + hop_w]
        if len(seg) < 4:
            break
        e = (seg[:, band] ** 2).sum(0)
        chroma = np.array([e[pc[band] == k].sum() for k in range(12)])
        k, r = key_of(chroma / (chroma.sum() + 1e-9))
        t0 = s * dt
        rms = 20 * np.log10(np.sqrt((x[int(t0 * SR):int((t0 + a.win) * SR)] ** 2).mean()) + 1e-9)
        print(f"  {t0:7.2f}  {rms:6.1f}   {k:9s} ({r:.2f})")


if __name__ == "__main__":
    main()
