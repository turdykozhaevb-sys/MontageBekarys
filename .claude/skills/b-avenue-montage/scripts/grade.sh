#!/usr/bin/env bash
# B-Avenue color grade + reframe to 1080x1920.
# Usage: grade.sh <warm|clean|pop> in.mp4 out.mp4
set -euo pipefail
preset=${1:?preset: warm|clean|pop}; in=${2:?input}; out=${3:?output}
case "$preset" in
  warm)  g="eq=contrast=1.06:brightness=0.01:saturation=0.82:gamma=1.02,curves=master='0/0.06 0.25/0.24 0.5/0.52 0.8/0.82 1/0.95',colorbalance=rs=0.04:bs=-0.03:rh=0.03:bh=-0.04:bm=0.02,vignette=PI/5,noise=alls=4:allf=t" ;;
  clean) g="eq=contrast=1.04:brightness=0.03:saturation=1.05,curves=master='0/0.05 0.5/0.53 1/0.97',colorbalance=bs=0.04:gs=0.01:rh=0.02:bh=0.03" ;;
  pop)   g="eq=contrast=1.12:saturation=1.22:gamma=0.98,curves=master='0/0.03 0.3/0.27 0.7/0.74 1/0.97',colorbalance=bs=0.06:bm=0.03:rs=0.02:rh=0.02,unsharp=5:5:0.4" ;;
  *) echo "unknown preset $preset" >&2; exit 1 ;;
esac
# fill 9:16 (crop center), then grade
ffmpeg -hide_banner -loglevel error -y -i "$in" \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,$g,format=yuv420p" \
  -c:v libx264 -preset medium -crf 18 -c:a copy "$out"
