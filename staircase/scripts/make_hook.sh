#!/usr/bin/env bash
# Cold-open hook (3.6 s): fast cuts of the film's big moments on the score's swell, a hit into the endless
# staircase, then a boom and black for a monologue to follow. make_hook.sh <score.flac> [master.mp4]
set -euo pipefail
cd "$(dirname "$0")/.."
SCORE=$1; M=${2:-out/The_Staircase_1080p.mp4}; T=$(mktemp -d)
A0=115.143   # score time that puts its 1:57.3 hit on the cut to the staircase (2.167 s in)
ffmpeg -v error -y -f lavfi -i "aevalsrc=exprs='0.9*exp(-3.2*t)*sin(2*PI*(36*t+38/7*(1-exp(-7*t))))':s=44100:d=1.6" \
  -f lavfi -i "anoisesrc=d=0.25:c=pink:a=0.6:r=44100" \
  -filter_complex "[1]lowpass=f=900,afade=t=out:st=0:d=0.22:curve=exp[n];[0][n]amix=inputs=2:normalize=0,pan=stereo|c0=c0|c1=c0[o]" -map "[o]" $T/boom.wav
ffmpeg -v error -y -ss $A0 -t 3.6 -i "$SCORE" -i $T/boom.wav -i $T/boom.wav -filter_complex \
  "[0]afade=t=in:st=0:d=0.12,afade=t=out:st=3.13:d=0.47[m];[1]adelay=2167|2167,volume=0.9[b1];[2]adelay=3133|3133,volume=1.1[b2];[m][b1][b2]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.89:level=false,atrim=0:3.6[a]" \
  -map "[a]" -ar 48000 -c:a pcm_s24le $T/audio.wav
# film frame:length pairs — butterfly shadow, awe, tired, scared, scream, hope, resolve, then the endless staircase
segs="418:13 592:11 1592:10 1784:9 1972:8 2196:7 1856:7 2556:29"
inputs=(); filt=""; labels=""; k=0
for s in $segs; do st=${s%:*}; n=${s#*:}
  inputs+=(-ss "$(awk "BEGIN{printf \"%.4f\", $st/30}")" -t "$(awk "BEGIN{printf \"%.4f\", ($n+2)/30}")" -i "$M")
  extra=""; [ $k = 7 ] && extra=",fade=t=in:st=0:d=0.13:color=white"
  filt+="[$k:v]trim=end_frame=$n,setpts=PTS-STARTPTS,fps=30,format=yuv420p$extra[v$k];"; labels+="[v$k]"; k=$((k+1))
done
filt+="color=c=black:s=1920x1080:r=30:d=0.4667,format=yuv420p[blk];${labels}[blk]concat=n=9:v=1:a=0[v]"
ffmpeg -v error -y "${inputs[@]}" -i $T/audio.wav -filter_complex "$filt" -map "[v]" -map 8:a \
  -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 320k -movflags +faststart -shortest out/insert/The_Staircase_hook.mp4
rm -rf $T
