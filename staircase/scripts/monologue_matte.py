import sys, cv2, numpy as np, mediapipe as mp
src, outdir, a, b = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
cap=cv2.VideoCapture(src); cap.set(cv2.CAP_PROP_POS_FRAMES, a)
seg=mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=0)
prev=None
for n in range(a, b+1):
    ok, fr = cap.read()
    if not ok: break
    m = seg.process(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)).segmentation_mask
    m = cv2.resize(m, (fr.shape[1], fr.shape[0]), interpolation=cv2.INTER_LINEAR)
    m = np.clip((m - 0.35) / 0.4, 0, 1)
    m = cv2.GaussianBlur(m, (0, 0), 1.5)
    if prev is not None: m = 0.65*m + 0.35*prev   # steady the edges between frames
    prev = m
    m[790:1060, 1300:1920] = 0   # keep the countdown and spiral on top
    rgba = np.dstack([fr, (m*255).astype(np.uint8)])
    cv2.imwrite(f'{outdir}/{n:05d}.png', rgba)
print('done', n)
