"""Cut a person out of footage (for putting them in front of text or graphics).
Writes RGBA PNGs: python matte.py <video> <out_dir> <first_frame> <last_frame> [--keep x0 y0 x1 y1 ...]
--keep boxes (pixels) are forced transparent so overlays there stay on top (e.g. a countdown).
Needs Python <= 3.12 with mediapipe==0.10.21 and opencv-python.
"""
import argparse
import os

import cv2
import mediapipe as mp
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("video"); ap.add_argument("out"); ap.add_argument("a", type=int); ap.add_argument("b", type=int)
ap.add_argument("--keep", type=int, nargs="*", default=[])
args = ap.parse_args()
os.makedirs(args.out, exist_ok=True)
cap = cv2.VideoCapture(args.video)
cap.set(cv2.CAP_PROP_POS_FRAMES, args.a)
seg = mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=0)
prev = None
for n in range(args.a, args.b + 1):
    ok, fr = cap.read()
    if not ok:
        break
    m = seg.process(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)).segmentation_mask
    m = cv2.resize(m, (fr.shape[1], fr.shape[0]), interpolation=cv2.INTER_LINEAR)
    m = np.clip((m - 0.35) / 0.4, 0, 1)          # firm up the edge
    m = cv2.GaussianBlur(m, (0, 0), 1.5)          # soften it again slightly
    if prev is not None:
        m = 0.65 * m + 0.35 * prev                # steady the edge between frames
    prev = m
    k = args.keep
    for i in range(0, len(k) - 3, 4):
        m[k[i + 1]:k[i + 3], k[i]:k[i + 2]] = 0
    cv2.imwrite(f"{args.out}/{n:05d}.png", np.dstack([fr, (m * 255).astype(np.uint8)]))
print("done", n)
