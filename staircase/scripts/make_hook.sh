#!/usr/bin/env bash
# Cold open (12 s): fast cuts of the film's big moments on the score's swell, a hit into the endless staircase,
# and as its pull-back settles, the title card (spiral -> title, flapping butterfly) on the score's climax,
# held while the music tapers off.
#
#   make_hook.sh <score.flac>
#
# Needs, in out/: The_Staircase_1080p.mp4 (film master) and title/titlecard.mp4. To make the title card:
#   npx remotion render src/index.ts InsertHold public/title/bg.mp4 ...   (shot 32's last framing held: the backdrop)
#   npx remotion render src/index.ts TitleCard out/title/titlecard.mp4 ...
set -euo pipefail
cd "$(dirname "$0")/.."
SCORE=$1; M=out/The_Staircase_1080p.mp4; TC=out/title/titlecard.mp4
T=$(mktemp -d); SR=48000
TS=3.7667    # title card starts (frame 113), as shot 32's pull-back settles
REV=5.3667   # title reveal (TitleCard HIT = 1.6 s in)
TOT=11.9667  # 113 + 246 frames
A0=115.143   # score time whose 1:57.3 hit lands on the cut to the staircase (2.167 s)
B0=$(awk "BEGIN{print 128.43-$REV}")  # score time whose 2:08.4 downbeat lands on the title reveal
# The build's piano enters at 2:05.71, which lands 2.65 s in. Bring the build in just before that note so the
# piano starts whole, and let the hit's tail ring on under it and dissolve (both sit on D, so they blend).
XF=2.50      # build fades in (0.12 s), just before the piano's first note
AOUT=2.65    # the hit's tail starts dissolving as the piano enters (1.4 s)
# a steady crescendo under the spiral: from the symbol's start up to the reveal (+5 dB), easing back after the hit
CA=$(awk "BEGIN{print $TS-$XF}"); CB=$(awk "BEGIN{print $REV-$XF}")
CRESC="if(lt(t,$CA),1.0,if(lt(t,$CB),1.0+0.35*(t-$CA)/($CB-$CA),1.35-0.35*min(1,(t-$CB)/0.6)))"
ms(){ awk "BEGIN{printf \"%d\", ($1)*1000+0.5}"; }

# ---- sound effects ----
ffmpeg -v error -y -f lavfi -i "aevalsrc=exprs='0.9*exp(-3.2*t)*sin(2*PI*(36*t+38/7*(1-exp(-7*t))))':s=$SR:d=1.6" -f lavfi -i "anoisesrc=d=0.25:c=pink:a=0.6:r=$SR" \
  -filter_complex "[1]lowpass=f=900,afade=t=out:st=0:d=0.22:curve=exp[n];[0][n]amix=inputs=2:normalize=0,pan=stereo|c0=c0|c1=c0[o]" -map "[o]" $T/boom.wav
ffmpeg -v error -y -f lavfi -i "aevalsrc=exprs='1.0*exp(-1.9*t)*sin(2*PI*(30*t+46/6*(1-exp(-6*t))))':s=$SR:d=3" -f lavfi -i "anoisesrc=d=0.5:c=white:a=0.5:r=$SR" \
  -filter_complex "[1]bandpass=f=2500:w=3000,afade=t=out:st=0:d=0.45:curve=exp[n];[0][n]amix=inputs=2:normalize=0,pan=stereo|c0=c0|c1=c0[o]" -map "[o]" $T/impact.wav
D=$(awk "BEGIN{print $REV-$TS}")
D=$(awk "BEGIN{print $REV-3.3}")   # the riser swells from silence, from 3.3 s up to the reveal
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=$D:c=pink:a=0.7:r=$SR" -af "highpass=f=400,lowpass=f=9000,volume='pow(t/$D,2.6)':eval=frame,aecho=0.6:0.5:60|90:0.3|0.2,apulsator=hz=6:amount=0.35" -ac 2 $T/riser.wav
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=0.45:c=pink:a=0.8:r=$SR" -af "bandpass=f=1200:w=1600,volume='sin(PI*t/0.45)^2':eval=frame" -ac 2 $T/whoosh.wav
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=3.2:c=white:a=0.5:r=$SR" -af "highpass=f=6000,volume='exp(-1.3*t)':eval=frame,apulsator=hz=11:amount=0.6,aecho=0.7:0.6:120|190:0.35|0.25" -ac 2 $T/shimmer.wav
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=0.62:c=pink:a=0.8:r=$SR" -af "bandpass=f=1800:w=2200,volume='pow(max(0,sin(2*PI*5*t)),3)':eval=frame,afade=t=out:st=0.45:d=0.17" -ac 2 $T/flutter.wav

# ---- mix: the hit, then the build's piano running into the title, resolving onto the score's final chord ----
# the piano phrase runs up to the title reveal, just before the climax's downbeat (2:08.43), and fades under the final chord
FIN=157.55                               # the score's final chord (A), the end of the piece's cadence
FAT=$(awk "BEGIN{print $REV-0.10}")      # it blooms in on the title reveal
ffmpeg -v error -y -ss $A0 -t 7 -i "$SCORE" -ss $B0 -t $(awk "BEGIN{print $FAT+0.8}") -i "$SCORE" -ss $(awk "BEGIN{print $FIN-0.10}") -t 4.05 -i "$SCORE" \
  -i $T/boom.wav -i $T/riser.wav -i $T/whoosh.wav -i $T/impact.wav -i $T/shimmer.wav \
  -i $T/flutter.wav -i $T/flutter.wav -i $T/flutter.wav -i $T/flutter.wav -filter_complex "\
[0]aresample=$SR,afade=t=in:st=0:d=0.12,afade=t=out:st=$AOUT:d=1.4:curve=qsin[a];\
[1]aresample=$SR,volume=0,atrim=0:$XF,asetpts=PTS-STARTPTS[bpre];\
[1]aresample=$SR,atrim=$XF,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.12,volume='$CRESC':eval=frame,afade=t=out:st=$(awk "BEGIN{print $FAT-$XF}"):d=0.7:curve=qsin[bpost];\
[bpre][bpost]concat=n=2:v=0:a=1[b];\
[2]aresample=$SR,afade=t=in:st=0:d=0.12,apad=pad_dur=2.5,aecho=0.85:0.9:700|1300:0.32|0.2,afade=t=out:st=3.2:d=3.3:curve=exp,adelay=$(ms $FAT)|$(ms $FAT)[fin];\
[a][b][fin]amix=inputs=3:normalize=0:duration=longest[music];\
[3]adelay=$(ms 2.167)|$(ms 2.167),volume=0.9[s1];\
[4]adelay=$(ms 3.3)|$(ms 3.3),volume=0.45[s2];\
[5]adelay=$(ms $REV-0.443)|$(ms $REV-0.443),volume=0.45,apulsator=hz=1.2:amount=0.5[s3];\
[6]adelay=$(ms $REV)|$(ms $REV),volume=0.55[s4];\
[7]adelay=$(ms $REV)|$(ms $REV),volume=0.3[s5];\
[8]adelay=$(ms $REV+0.1)|$(ms $REV+0.1),volume=0.22[f1];\
[9]adelay=$(ms $REV+1.6)|$(ms $REV+1.6),volume=0.18[f2];\
[10]adelay=$(ms $REV+3.0)|$(ms $REV+3.0),volume=0.15[f3];\
[11]adelay=$(ms $REV+4.5)|$(ms $REV+4.5),volume=0.12[f4];\
[music][s1][s2][s3][s4][s5][f1][f2][f3][f4]amix=inputs=10:normalize=0:duration=longest,apad=whole_dur=$TOT,atrim=0:$TOT,alimiter=limit=0.89:level=false,afade=t=out:st=$(awk "BEGIN{print $TOT-1.2}"):d=1.2[o]" \
  -map "[o]" -c:a pcm_s24le $T/audio.wav
cp $T/audio.wav out/title/hook_audio.wav

# ---- picture ----
# film frame:length pairs - butterfly shadow, awe, tired, scared, scream, hope, resolve, then the endless staircase
segs="418:13 592:11 1592:10 1784:9 1972:8 2196:7 1856:7 2556:48"
inputs=(); filt=""; labels=""; k=0
for s in $segs; do st=${s%:*}; n=${s#*:}
  inputs+=(-ss "$(awk "BEGIN{printf \"%.4f\", $st/30}")" -t "$(awk "BEGIN{printf \"%.4f\", ($n+2)/30}")" -i "$M")
  extra=""; [ $k = 7 ] && extra=",fade=t=in:st=0:d=0.13:color=white"
  filt+="[$k:v]trim=end_frame=$n,setpts=PTS-STARTPTS,fps=30,format=yuv420p$extra[v$k];"; labels+="[v$k]"; k=$((k+1))
done
# then the title card, over the same framing held still
filt+="[8:v]setpts=PTS-STARTPTS,format=yuv420p[tc];${labels}[tc]concat=n=9:v=1:a=0[v]"
ffmpeg -v error -y "${inputs[@]}" -i "$TC" -i $T/audio.wav -filter_complex "$filt" -map "[v]" -map 9:a \
  -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 320k -movflags +faststart -shortest out/insert/The_Staircase_hook_title.mp4
rm -rf $T
