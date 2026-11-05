#!/usr/bin/env bash
# Cold open (11 s): fast cuts of the film's big moments on the score's swell, a hit into the endless staircase,
# the pull-back running on, then the title card (spiral -> title, flapping butterfly) on the score's climax.
#
#   make_hook.sh <score.flac>
#
# Needs, in out/: The_Staircase_1080p.mp4 (film master), insert/The_Staircase_insert_wide_extension.mp4,
# title/titlecard.mp4. To make the title card:
#   npx remotion render src/index.ts InsertWideLong out/title/bg_tail.mp4 --frames=90-219 ...
#   ffmpeg: ext frames 41.. + bg_tail -> public/title/bg.mp4      (the title's blurred backdrop)
#   npx remotion render src/index.ts TitleCard out/title/titlecard.mp4 ...
set -euo pipefail
cd "$(dirname "$0")/.."
SCORE=$1; M=out/The_Staircase_1080p.mp4; EXT=out/insert/The_Staircase_insert_wide_extension.mp4; TC=out/title/titlecard.mp4
T=$(mktemp -d); SR=48000
TOT=11.0     # seconds
TS=5.1333    # title card starts (frame 154)
REV=6.7333   # title reveal (TitleCard HIT = 1.6 s in)
A0=115.143   # score time whose 1:57.3 hit lands on the cut to the staircase (2.167 s)
B0=$(awk "BEGIN{print 131.43-$REV}")  # score time whose 2:11.4 downbeat lands on the title reveal
ms(){ awk "BEGIN{printf \"%d\", $1*1000+0.5}"; }

# ---- sound effects ----
ffmpeg -v error -y -f lavfi -i "aevalsrc=exprs='0.9*exp(-3.2*t)*sin(2*PI*(36*t+38/7*(1-exp(-7*t))))':s=$SR:d=1.6" -f lavfi -i "anoisesrc=d=0.25:c=pink:a=0.6:r=$SR" \
  -filter_complex "[1]lowpass=f=900,afade=t=out:st=0:d=0.22:curve=exp[n];[0][n]amix=inputs=2:normalize=0,pan=stereo|c0=c0|c1=c0[o]" -map "[o]" $T/boom.wav
ffmpeg -v error -y -f lavfi -i "aevalsrc=exprs='1.0*exp(-1.9*t)*sin(2*PI*(30*t+46/6*(1-exp(-6*t))))':s=$SR:d=3" -f lavfi -i "anoisesrc=d=0.5:c=white:a=0.5:r=$SR" \
  -filter_complex "[1]bandpass=f=2500:w=3000,afade=t=out:st=0:d=0.45:curve=exp[n];[0][n]amix=inputs=2:normalize=0,pan=stereo|c0=c0|c1=c0[o]" -map "[o]" $T/impact.wav
D=$(awk "BEGIN{print $REV-$TS}")
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=$D:c=pink:a=0.7:r=$SR" -af "highpass=f=400,lowpass=f=9000,volume='0.25+0.75*pow(t/$D,1.6)':eval=frame,aecho=0.6:0.5:60|90:0.3|0.2,apulsator=hz=6:amount=0.35,afade=t=in:st=0:d=0.35" -ac 2 $T/riser.wav
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=0.45:c=pink:a=0.8:r=$SR" -af "bandpass=f=1200:w=1600,volume='sin(PI*t/0.45)^2':eval=frame" -ac 2 $T/whoosh.wav
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=3.2:c=white:a=0.5:r=$SR" -af "highpass=f=6000,volume='exp(-1.3*t)':eval=frame,apulsator=hz=11:amount=0.6,aecho=0.7:0.6:120|190:0.35|0.25" -ac 2 $T/shimmer.wav
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=0.62:c=pink:a=0.8:r=$SR" -af "bandpass=f=1800:w=2200,volume='pow(max(0,sin(2*PI*5*t)),3)':eval=frame,afade=t=out:st=0.45:d=0.17" -ac 2 $T/flutter.wav

# ---- mix: score swell + hit, its climax under the title, effects ----
ffmpeg -v error -y -ss $A0 -t 7 -i "$SCORE" -ss $B0 -t $TOT -i "$SCORE" -i $T/boom.wav -i $T/riser.wav -i $T/whoosh.wav -i $T/impact.wav -i $T/shimmer.wav \
  -i $T/flutter.wav -i $T/flutter.wav -i $T/flutter.wav -filter_complex "\
[0]aresample=$SR,afade=t=in:st=0:d=0.12,afade=t=out:st=5.0:d=1.5:curve=tri[a];\
[1]aresample=$SR,volume=0,atrim=0:$TS,asetpts=PTS-STARTPTS[bpre];\
[1]aresample=$SR,atrim=$TS,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=1.4:curve=qsin,afade=t=out:st=5.2:d=0.67:curve=qsin[bpost];\
[bpre][bpost]concat=n=2:v=0:a=1[b];\
[2]adelay=$(ms 2.167)|$(ms 2.167),volume=0.9[s1];\
[3]adelay=$(ms $TS)|$(ms $TS),volume=0.75[s2];\
[4]adelay=$(ms 6.29)|$(ms 6.29),volume=0.6,apulsator=hz=1.2:amount=0.5[s3];\
[5]adelay=$(ms $REV)|$(ms $REV),volume=1.15[s4];\
[6]adelay=$(ms $REV)|$(ms $REV),volume=0.35[s5];\
[7]adelay=$(ms 6.833)|$(ms 6.833),volume=0.22[f1];\
[8]adelay=$(ms 8.333)|$(ms 8.333),volume=0.18[f2];\
[9]adelay=$(ms 9.733)|$(ms 9.733),volume=0.15[f3];\
[a][b][s1][s2][s3][s4][s5][f1][f2][f3]amix=inputs=10:normalize=0:duration=longest,atrim=0:$TOT,alimiter=limit=0.89:level=false,afade=t=out:st=10.6:d=0.4[o]" \
  -map "[o]" -c:a pcm_s24le $T/audio.wav

# ---- picture ----
# film frame:length pairs - butterfly shadow, awe, tired, scared, scream, hope, resolve, then the endless staircase
segs="418:13 592:11 1592:10 1784:9 1972:8 2196:7 1856:7 2556:48"
inputs=(); filt=""; labels=""; k=0
for s in $segs; do st=${s%:*}; n=${s#*:}
  inputs+=(-ss "$(awk "BEGIN{printf \"%.4f\", $st/30}")" -t "$(awk "BEGIN{printf \"%.4f\", ($n+2)/30}")" -i "$M")
  extra=""; [ $k = 7 ] && extra=",fade=t=in:st=0:d=0.13:color=white"
  filt+="[$k:v]trim=end_frame=$n,setpts=PTS-STARTPTS,fps=30,format=yuv420p$extra[v$k];"; labels+="[v$k]"; k=$((k+1))
done
# the pull-back carries on (extension frames 0-40), then the title card
filt+="[8:v]trim=end_frame=41,setpts=PTS-STARTPTS,format=yuv420p[ext];[9:v]setpts=PTS-STARTPTS,format=yuv420p[tc];${labels}[ext][tc]concat=n=10:v=1:a=0[v]"
ffmpeg -v error -y "${inputs[@]}" -i "$EXT" -i "$TC" -i $T/audio.wav -filter_complex "$filt" -map "[v]" -map 10:a \
  -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 320k -movflags +faststart -shortest out/insert/The_Staircase_hook_title.mp4
rm -rf $T
