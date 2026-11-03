"""Measure a video's editing and look as numbers, to compare a render against a reference.

Usage: python measure.py <video> [--fps 10] [--json out.json]

Reports cuts and shot lengths, camera motion, luma, saturation, black point and
vignette. Needs ffmpeg on PATH and numpy.
"""
import argparse
import json
import subprocess

import numpy as np

W, H = 180, 320  # analysis size (vertical 9:16)


def read_frames(path, fps):
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-vf",
           f"fps={fps},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32) / 255


def luma(rgb):
    return rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)


def saturation(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1)
    return np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)


def shift(a, b):
    """Global translation between two luma frames via phase correlation, in pixels."""
    fa, fb = np.fft.fft2(a), np.fft.fft2(b)
    r = fa * np.conj(fb)
    corr = np.abs(np.fft.ifft2(r / np.maximum(np.abs(r), 1e-9)))
    y, x = np.unravel_index(corr.argmax(), corr.shape)
    y = y - H if y > H // 2 else y
    x = x - W if x > W // 2 else x
    return float(np.hypot(x, y))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--fps", type=float, default=10)
    ap.add_argument("--json")
    a = ap.parse_args()

    f = read_frames(a.video, a.fps)
    y = luma(f)
    diff = np.abs(np.diff(y, axis=0)).mean(axis=(1, 2))
    thresh = max(0.08, np.median(diff) + 6 * diff.std())
    cuts = (np.where(diff > thresh)[0] + 1) / a.fps
    bounds = np.concatenate([[0], cuts, [len(f) / a.fps]])
    shots = np.diff(bounds)

    cut_frames = set((cuts * a.fps).astype(int))
    motion = [shift(y[i - 1], y[i]) for i in range(1, len(y)) if i not in cut_frames]
    motion = np.array(motion) * (1080 / W) / (30 / a.fps)  # px/frame at 1080 wide, 30 fps

    corner = np.concatenate([y[:, :H // 6, :W // 6], y[:, :H // 6, -W // 6:],
                             y[:, -H // 6:, :W // 6], y[:, -H // 6:, -W // 6:]], axis=1).mean()
    centre = y[:, H // 3:2 * H // 3, W // 3:2 * W // 3].mean()

    out = {
        "duration_s": round(len(f) / a.fps, 2),
        "cuts": len(cuts),
        "shot_len_median_s": round(float(np.median(shots)), 2),
        "shot_len_mean_s": round(float(shots.mean()), 2),
        "camera_px_per_frame_median": round(float(np.median(motion)), 2) if len(motion) else 0,
        "frames_moving_pct": round(float((motion > 0.5).mean() * 100), 1) if len(motion) else 0,
        "luma_mean": round(float(y.mean()), 3),
        "luma_std": round(float(y.std()), 3),
        "saturation_mean": round(float(saturation(f).mean()), 3),
        "black_point_p1": round(float(np.percentile(y, 1)), 3),
        "corner_over_centre": round(float(corner / max(centre, 1e-6)), 2),
        "cut_times_s": [round(float(c), 2) for c in cuts],
    }
    print(json.dumps({k: v for k, v in out.items() if k != "cut_times_s"}, indent=2))
    if a.json:
        with open(a.json, "w") as fh:
            json.dump(out, fh, indent=2)


if __name__ == "__main__":
    main()
