#!/usr/bin/env bash
# Cuts the source to the approved timeline and applies the per-shot grade.
# Usage: tools/grade_and_cut.sh <source.mov> <out_dir>
set -euo pipefail
SRC="$1"; OUT="$2"; mkdir -p "$OUT"
BASE="colorbalance=rs=-0.03:bs=0.04:rm=-0.04:bm=0.04:rh=-0.02:bh=0.02,curves=master='0/0.045 0.25/0.215 0.5/0.45 0.78/0.70 1/0.84'"
# shot: src_start_frame src_end_frame(excl) per-shot trim
declare -a SHOTS=(
 "0 75 colorbalance=rm=-0.02:bm=0.03,eq=saturation=0.66:gamma=0.97"
 "80 185 colorbalance=rm=-0.02:bm=0.03,eq=saturation=0.70:gamma=0.90"
 "195 270 colorbalance=rm=-0.025:bm=0.035,eq=saturation=0.64:gamma=1.06"
 "271 376 colorbalance=rm=0.015:bm=-0.02,eq=saturation=0.95:gamma=1.07"
 "378 540 eq=saturation=0.85:gamma=0.88"
)
FC=""; i=0
for s in "${SHOTS[@]}"; do
  read -r a b trim <<<"$s"
  FC+="[0:v]trim=start_frame=$a:end_frame=$b,setpts=PTS-STARTPTS,$BASE,$trim[v$i];"
  FC+="[0:a]atrim=start=$(python3 -c "print($a/30)"):end=$(python3 -c "print($b/30)"),asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st=$(python3 -c "print(($b-$a)/30-0.012)"):d=0.012[a$i];"
  i=$((i+1))
done
FC+="[v0][v1][v2][v3][v4]concat=n=5:v=1:a=0[v];[a0][a1][a2][a3][a4]concat=n=5:v=0:a=1[a]"
ffmpeg -hide_banner -v error -y -i "$SRC" -filter_complex "$FC" -map "[v]" -c:v libx264 -preset slow -crf 12 -pix_fmt yuv420p -r 30 -colorspace bt709 -color_primaries bt709 -color_trc bt709 -an "$OUT/graded.mp4" \
  -map "[a]" -ac 2 -ar 48000 -c:a pcm_s16le "$OUT/voice_raw.wav"
