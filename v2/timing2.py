# Sentence-level timing: map each sentence of sentences.txt onto voice.mp3, snapping to pauses.
import subprocess, json, unicodedata, numpy as np
sr = 16000
raw = subprocess.run(['ffmpeg','-v','error','-i','voice.mp3','-ac','1','-ar',str(sr),'-f','s16le','-'],capture_output=True).stdout
a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
hop = sr // 100
db = 20*np.log10(np.sqrt(np.convolve(a**2, np.ones(hop)/hop, 'same')[::hop]) + 1e-6)
quiet = db < -38
pauses, i = [], 0
while i < len(quiet):
    if quiet[i]:
        j = i
        while j < len(quiet) and quiet[j]: j += 1
        if j - i >= 12: pauses.append(((i+j)/200, (j-i)/100, i/100, j/100))
        i = j
    else: i += 1
import re
lines = [re.sub(r'^\[\d+\]\s*', '', l.strip()) for l in open('../strasbourg/shots.txt', encoding='utf8') if l.startswith('[')]
anch = json.load(open('../strasbourg/timing.json'))   # verified paragraph-level bounds
wt = lambda s: sum(1 for c in s if c.isalnum() and unicodedata.category(c) not in ('Mn','Mc'))
out, carry = [], None
for line, an in zip(lines, anch):
    ss = [x.strip() for x in re.split(r'(?<=[.?])\s+', line) if x.strip()]
    W = np.array([wt(x) for x in ss], float)
    b = [an['start']]
    for k in range(1, len(ss)):
        exp = b[-1] + (an['end'] - b[-1]) * W[k-1] / W[k-1:].sum()
        cand = [p for p in pauses if b[-1] + 0.5 < p[0] < min(exp + 2.5, an['end'] - 0.5) and p[0] > exp - 2.5]
        b.append(max(cand, key=lambda p: p[1]*2 - abs(p[0]-exp)*0.8)[3] - 0.1 if cand else exp)
    b.append(an['end'])
    segs = [{'s': round(float(b[k]), 2), 'e': round(float(b[k+1]), 2)} for k in range(len(ss))]
    if carry:                       # sentence continued from previous line: merge, mid = line boundary
        segs[0] = {'s': carry['s'], 'e': segs[0]['e'], 'm': carry['e']}
    carry = segs.pop() if not line.endswith(('.', '?')) else None
    out += segs
for o in out:
    if 'm' in o: continue
    d = o['e'] - o['s']
    c = [p for p in pauses if o['s'] + d*.3 < p[0] < o['s'] + d*.7]
    o['m'] = round(max(c, key=lambda p: p[1])[3] - 0.08 if c else o['s'] + d/2, 2)
json.dump(out, open('sent_timing.json', 'w'))
d = [o['e']-o['s'] for o in out]
print('n', len(out), 'min %.2f max %.2f' % (min(d), max(d)), [(i, round(x,2)) for i, x in enumerate(d) if x < 1.0 or x > 9])
