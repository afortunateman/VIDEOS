#!/usr/bin/env python3
"""Gentle mastering: ride the level so the quiet opening is audible while the
long crescendo survives, soft-limit the peaks, normalise."""
import sys
import numpy as np
import scipy.io.wavfile as wav
from scipy.ndimage import uniform_filter1d

sr, x = wav.read(sys.argv[1])
x = x.astype(np.float64) / 32768.0
# slow loudness envelope (3 s window) -> 0.45 of the dynamic range is removed
env = np.sqrt(uniform_filter1d((x ** 2).mean(axis=1), 3 * sr, mode='nearest')) + 1e-4
ref = np.percentile(env, 95)
gain = np.clip((env / ref) ** -0.45, 0.5, 4.0)
gain = uniform_filter1d(gain, sr // 2, mode='nearest')
y = x * gain[:, None]
y /= np.percentile(np.abs(y), 99.97)          # let only the very top touch the limiter
y = np.tanh(y * 0.9) / np.tanh(0.9)
y *= 0.89 / np.abs(y).max()
y = np.concatenate([np.zeros((sr // 4, 2)), y])
wav.write(sys.argv[2], sr, (y * 32767).astype(np.int16))
