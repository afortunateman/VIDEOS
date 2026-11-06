# Align shots.txt to voice.mp3: proportional by spoken length, snapped to pauses.
import subprocess, re, json, unicodedata, numpy as np
sr = 16000
raw = subprocess.run(['ffmpeg','-v','error','-i','voice.mp3','-ac','1','-ar',str(sr),'-f','s16le','-'],capture_output=True).stdout
a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
hop = sr // 100
rms = np.sqrt(np.convolve(a**2, np.ones(hop)/hop, 'same')[::hop] + 1e-12)
db = 20*np.log10(rms)
quiet = db < -38
# pauses: quiet runs >= 0.15s -> (mid, length)
pauses, i = [], 0
while i < len(quiet):
    if quiet[i]:
        j = i
        while j < len(quiet) and quiet[j]: j += 1
        if j - i >= 15: pauses.append(((i+j)/200, (j-i)/100, i/100, j/100))
        i = j
    else: i += 1
speech = np.nonzero(~quiet)[0]
t0, t1 = speech[0]/100, speech[-1]/100
shots = []
for line in open('shots.txt', encoding='utf8'):
    m = re.match(r'\[(\d+)\]\s*(.*)', line)
    if m:
        w = sum(1 for ch in m[2] if ch.isalnum() and unicodedata.category(ch) not in ('Mn','Mc'))
        shots.append([int(m[1]), w])
# cumulative speech time function (excluding pauses) for proportional mapping
sp = np.cumsum(~quiet) / 100
def at_speech(s):  # speech-seconds -> wall time
    return np.searchsorted(sp, s) / 100
W = np.array([s[1] for s in shots], float)
bounds = [t0]
for k in range(1, len(shots)):
    done = sp[int(bounds[-1]*100)]; left = sp[int(t1*100)] - done
    exp = at_speech(done + left * W[k-1] / W[k-1:].sum())
    cand = [p for p in pauses if bounds[-1] + 0.8 < p[0] < exp + 4 and p[0] > exp - 4]
    if cand:
        best = max(cand, key=lambda p: p[1]*2 - abs(p[0]-exp)*0.6)
        bounds.append(best[3] - 0.12)  # cut just before next phrase starts
    else:
        bounds.append(exp)
out = []
for k, (p, w) in enumerate(shots):
    s = 0.0 if k == 0 else bounds[k]
    e = bounds[k+1] if k+1 < len(shots) else len(a)/sr
    out.append({'panel': p, 'start': round(float(s), 2), 'end': round(float(e), 2)})
json.dump(out, open('timing.json','w'), indent=0)
print(' '.join(f"{o['panel']}:{o['start']:.1f}" for o in out))
print('min dur', min(o['end']-o['start'] for o in out))
