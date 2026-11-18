#!/usr/bin/env bash
# Audio mastering of the Remotion render (the video stream is copied, never re-encoded).
#   tools/master.sh remotion/out/reel_render.mp4 final/reel_final.mp4
#
#  - 25 Hz high-pass (rumble only: the score's bass and kick are kept)
#  - gain to -14 LUFS integrated, then a look-ahead limiter (4x oversampled true-peak safety)
#    so the hits never pass -1 dBTP; the gain is re-measured and corrected (max 4 passes)
#  - audio trimmed to the exact video duration, AAC 320 kb/s 48 kHz, +faststart, metadata stripped
#  - acceptance: -14 +/- 0.5 LUFS, true peak <= -1.0 dBTP, |audio - video| <= 0.03 s (exit 1 otherwise)
set -euo pipefail
IN="${1:?render.mp4}"
OUT="${2:?master.mp4}"
mkdir -p "$(dirname "$OUT")"
VD=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$IN")
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

measure() {  # prints "I TP" of a file's audio
  ffmpeg -nostdin -hide_banner -i "$1" -map 0:a:0 -af ebur128=peak=true -f null - 2>&1 | tail -n 14 |
    awk '/^ +I:/{i=$2} /^ +Peak:/{p=$2} END{print i, p}'
}

ffmpeg -nostdin -v error -y -i "$IN" -map 0:a:0 -af "highpass=f=25,atrim=0:$VD" -c:a pcm_f32le -ar 48000 "$TMP/pre.wav"
read -r I0 _ < <(measure "$TMP/pre.wav")
GAIN=$(python3 -c "print(-14.0 - $I0)")
for pass in 1 2 3 4; do
  # limiter on a 4x oversampled signal catches inter-sample peaks; ceiling -1.5 dBFS
  ffmpeg -nostdin -v error -y -i "$TMP/pre.wav" \
    -af "volume=${GAIN}dB,aresample=192000,alimiter=limit=-1.5dB:attack=2:release=60:level=disabled:latency=1,aresample=48000" \
    -c:a pcm_f32le "$TMP/lim.wav"
  read -r I TPK < <(measure "$TMP/lim.wav")
  echo "pass $pass: gain ${GAIN} dB -> ${I} LUFS, true peak ${TPK} dBTP"
  DONE=$(python3 -c "print(1 if abs($I + 14) <= 0.2 else 0)")
  [ "$DONE" = 1 ] && break
  GAIN=$(python3 -c "print($GAIN + (-14.0 - $I))")
done

ffmpeg -nostdin -v error -y -i "$IN" -i "$TMP/lim.wav" -map 0:v:0 -map 1:a:0 -map_metadata -1 \
  -c:v copy -c:a aac -b:a 320k -ar 48000 -t "$VD" -movflags +faststart "$OUT"

read -r I PEAK < <(measure "$OUT")
AD=$(ffprobe -v error -select_streams a:0 -show_entries stream=duration -of csv=p=0 "$OUT")
VD2=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 "$OUT")
echo "master: integrated $I LUFS, true peak $PEAK dBTP, video ${VD2}s, audio ${AD}s"
python3 - "$I" "$PEAK" "$VD2" "$AD" <<'EOF'
import sys
i, p, vd, ad = map(float, sys.argv[1:])
ok = abs(i + 14) <= 0.5 and p <= -1.0 and abs(vd - ad) <= 0.03
print("ACCEPTANCE", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
EOF
