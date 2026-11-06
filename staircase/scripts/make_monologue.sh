#!/usr/bin/env bash
# Monologue edit: hold the opening empty-wall shot so the Alan Watts quote can be read, the speaker rises in front of
# the quote (person cut-out over the quote), sound effects as its lines bloom in, and a spiral timer with a
# 50-second "MOVIE STARTS IN" countdown.
#   make_monologue.sh <raw monologue video>
# Needs a Python 3.12 venv with mediapipe==0.10.21 (it bundles the selfie-segmentation model):
#   python3.12 -m venv mpenv && mpenv/bin/pip install "mediapipe==0.10.21" "numpy<2" opencv-python-headless
set -euo pipefail
cd "$(dirname "$0")/.."
RAW=$1; MP=${MPENV:-mpenv}/bin/python; T=$(mktemp -d)
F=1.9      # the empty wall ends here (he rises in just after)
HOLD=2.6   # hold its last frame this long, so the quote can be read
END=51.15  # just after the last word
# picture: 1920x1080, the held frame gets live grain
ffmpeg -v error -y -i "$RAW" -filter_complex "[0:v]scale=1922:1080,crop=1920:1080,fps=30,setsar=1,split=3[a][b][c];\
[a]trim=0:$F,setpts=PTS-STARTPTS[v1];\
[b]trim=start=$F,setpts=PTS-STARTPTS,trim=end_frame=1,loop=loop=$(awk "BEGIN{print int($HOLD*30+0.5)-1}"):size=1:start=0,setpts=N/30/TB,noise=alls=6:allf=t[v2];\
[c]trim=$F:$END,setpts=PTS-STARTPTS[v3];[v1][v2][v3]concat=n=3:v=1:a=0[v]" -map "[v]" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p public/monologue/mono.mp4
# voice: the same cut (silence over the hold), high-passed and levelled to -16 LUFS
ffmpeg -v error -y -i "$RAW" -filter_complex "[0:a]atrim=0:$F,asetpts=PTS-STARTPTS[a1];anullsrc=r=48000:cl=stereo,atrim=0:$HOLD[a2];[0:a]atrim=$F:$END,asetpts=PTS-STARTPTS,afade=t=out:st=$(awk "BEGIN{print $END-$F-0.35}"):d=0.35[a3];[a1][a2][a3]concat=n=3:v=0:a=1,highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11" -ar 48000 -c:a pcm_s16le $T/voice.wav
# sound effects for the quote: a soft swish per line (the first with a low thump), a shimmer for the author, a reverse
# swish as it dissolves. (bandpass widths in ffmpeg default to Q, so plain high/low-pass filters shape the noise.)
SR=48000; ms(){ awk "BEGIN{printf \"%d\", ($1)*1000+0.5}"; }
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=0.55:c=pink:a=0.8:r=$SR" -af "highpass=f=900,lowpass=f=7500,volume='pow(sin(PI*min(1,t/0.55)),1.5)*exp(-1.5*t)':eval=frame,aecho=0.6:0.4:40|70:0.25|0.15,volume=24dB" -ac 2 $T/swish.wav
ffmpeg -v error -y -f lavfi -i "aevalsrc=exprs='0.8*exp(-6*t)*sin(2*PI*(52*t+30/9*(1-exp(-9*t))))':s=$SR:d=0.8" -ac 2 $T/thump.wav
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=1.6:c=white:a=0.5:r=$SR" -af "highpass=f=7000,volume='exp(-2.2*t)*min(1,t/0.08)':eval=frame,apulsator=hz=12:amount=0.6,aecho=0.7:0.6:110|170:0.3|0.2" -ac 2 $T/shimmer.wav
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=0.7:c=pink:a=0.7:r=$SR" -af "highpass=f=600,lowpass=f=6000,volume='pow(t/0.7,2.2)':eval=frame,afade=t=out:st=0.6:d=0.1" -ac 2 $T/rswish.wav
ffmpeg -v error -y -i $T/voice.wav -i $T/swish.wav -i $T/swish.wav -i $T/swish.wav -i $T/swish.wav -i $T/swish.wav -i $T/thump.wav -i $T/shimmer.wav -i $T/rswish.wav -filter_complex "\
[0]aresample=$SR[v];\
[1]adelay=$(ms 0.50)|$(ms 0.50),volume=0.45[l1];\
[2]asetrate=$SR*1.06,aresample=$SR,adelay=$(ms 0.82)|$(ms 0.82),volume=0.38[l2];\
[3]adelay=$(ms 1.14)|$(ms 1.14),volume=0.38[l3];\
[4]asetrate=$SR*1.06,aresample=$SR,adelay=$(ms 1.46)|$(ms 1.46),volume=0.35[l4];\
[5]asetrate=$SR*0.94,aresample=$SR,adelay=$(ms 1.78)|$(ms 1.78),volume=0.42[l5];\
[6]adelay=$(ms 0.52)|$(ms 0.52),volume=0.55[th];\
[7]adelay=$(ms 2.40)|$(ms 2.40),volume=0.35[sh];\
[8]adelay=$(ms 5.30)|$(ms 5.30),volume=0.3[rs];\
[v][l1][l2][l3][l4][l5][th][sh][rs]amix=inputs=9:normalize=0:duration=first,alimiter=limit=0.89:level=false[o]" -map "[o]" -c:a pcm_s16le $T/mix.wav
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 public/monologue/mono.mp4)
# graphics: quote + spiral timer + countdown
npx remotion render src/index.ts Monologue $T/render.mp4 --props="{\"src\":\"monologue/mono.mp4\",\"quoteIn\":0.3,\"quoteOut\":6.0,\"durationSec\":$DUR,\"width\":1920,\"height\":1080}" \
  --concurrency=4 --timeout=600000 --muted --codec=h264 --crf=12 --pixel-format=yuv420p --log=error
# the speaker cut out over the rise (frames 128-186), laid over the quote
mkdir -p $T/matte; $MP -I scripts/monologue_matte.py public/monologue/mono.mp4 $T/matte 128 186
ffmpeg -v error -y -i $T/render.mp4 -framerate 30 -start_number 128 -i $T/matte/%05d.png -i $T/mix.wav -filter_complex \
  "[1:v]setpts=PTS-STARTPTS+128/30/TB[m];[0:v][m]overlay=eof_action=pass:format=auto[v]" -map "[v]" -map 2:a \
  -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 256k -movflags +faststart out/insert/The_Staircase_monologue.mp4
rm -rf $T
