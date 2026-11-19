#!/usr/bin/env bash
# Final export: burn ASS subtitles (optional), attach mixed audio (optional), H.264 1080x1920.
# Usage: export.sh video.mp4 out.mp4 [subs.ass] [audio.wav]
set -euo pipefail
in=${1:?video}; out=${2:?out}; ass=${3:-}; aud=${4:-}
here=$(cd "$(dirname "$0")/.." && pwd)
vf="scale=1080:1920:flags=lanczos,format=yuv420p"
[ -n "$ass" ] && vf="$vf,ass='$ass':fontsdir='$here/fonts'"
args=(-i "$in"); map=(-map 0:v)
if [ -n "$aud" ]; then args+=(-i "$aud"); map+=(-map 1:a); else map+=(-map 0:a?); fi
ffmpeg -hide_banner -loglevel error -y "${args[@]}" "${map[@]}" -vf "$vf" \
  -c:v libx264 -preset slow -crf 18 -profile:v high -movflags +faststart \
  -c:a aac -b:a 192k -ar 48000 -shortest "$out"
