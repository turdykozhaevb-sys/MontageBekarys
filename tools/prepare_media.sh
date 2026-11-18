#!/usr/bin/env bash
# Rebuilds every media file the Remotion project uses from the ORIGINAL iPhone clip.
#
#   tools/prepare_media.sh /path/to/original.MOV
#
# 1. source.mp4  - the picture. The original is HDR (HLG, BT.2020, Dolby Vision 8.4).
#                  Remotion renders in SDR, so ONE technical conversion is unavoidable:
#                  BT.2408 mapping (HDR reference white -> SDR white), mobius highlight
#                  roll-off, desat=0 (no saturation change), BT.2020 -> BT.709 primaries.
#                  No creative grading: exposure, contrast, saturation, white balance and
#                  skin tones are left as shot. Rotation baked in (1080x1920), constant
#                  30 fps, all metadata (GPS location included) stripped.
# 2. voice.wav   - the original audio, decoded once to 48 kHz PCM (no lossy re-encode).
# 3. hfr_*.mp4   - optical-flow 4x frame interpolation of the slow-motion ranges listed
#                  in remotion/src/data/timeline.json (smooth slow motion, no stutter).
set -euo pipefail
SRC="${1:?usage: tools/prepare_media.sh /path/to/original.MOV}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/remotion/public/media"
mkdir -p "$OUT"

TONEMAP="zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=mobius:param=0.3:desat=0,zscale=t=bt709:m=bt709:r=tv:d=error_diffusion,format=yuv420p"
# Decoder calibration (measured, not a grade): Remotion's frame decoder (swscale default rounding)
# returns luma ~1 code value low (Y -1.1 on levels 36-215, measured against the YUV planes).
# Pre-compensating the master by +1 Y from level 36 up makes the RENDERED video match the
# uncompensated conversion: mean luma error -0.97 -> ~0 code values. Chroma untouched.
CALIBRATE="lutyuv=y='val+gte(val,36)'"

if [ ! -f "$OUT/source.mp4" ]; then
  ffmpeg -nostdin -v error -y -i "$SRC" -map 0:v:0 -map_metadata -1 -map_chapters -1 \
    -vf "$TONEMAP,$CALIBRATE,fps=30" \
    -c:v libx264 -preset slow -crf 12 -profile:v high -x264-params keyint=30:min-keyint=1:bframes=2 \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
    -an -movflags +faststart "$OUT/source.mp4"
fi

# Voice: decoded once to 48 kHz PCM, then standard dialogue processing: 70 Hz high-pass (handling
# rumble) and gentle 3:1 soft-knee compression from -24 dBFS (crest factor 21 -> 15 dB), so the
# voice sits steadily over the music without the final limiter having to squash syllables.
ffmpeg -nostdin -v error -y -i "$SRC" -map 0:a:0 -map_metadata -1 -ac 2 -ar 48000 \
  -af "highpass=f=70,acompressor=threshold=0.063:ratio=3:attack=4:release=90:knee=4:makeup=1:detection=rms" \
  -c:a pcm_s16le "$OUT/voice.wav"

# Slow-motion ranges (source seconds) from the planner
python3 - "$ROOT/remotion/src/data/timeline.json" > "$OUT/.hfr_ranges" <<'EOF'
import json, sys
d = json.load(open(sys.argv[1]))
for c in d["hfr"]:
    print(f'{c["startSec"]:.6f} {c["endSec"]:.6f} {c["file"].split("/")[-1]}')
EOF
rm -f "$OUT"/hfr_*.mp4
while read -r AF B FILE; do
  # AF is an exact source frame time, so clip frame j == source time AF + j/120
  NAME="${FILE%.mp4}"
  DUR=$(python3 -c "print($B-$AF)")
  ffmpeg -nostdin -v error -y -ss "$AF" -i "$OUT/source.mp4" -t "$DUR" -an \
    -vf "minterpolate=fps=120:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
    -c:v libx264 -preset slow -crf 12 -x264-params keyint=24:min-keyint=1 \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
    -movflags +faststart "$OUT/$NAME.mp4"
  echo "built $NAME.mp4  (source $AF .. $B s)"
done < "$OUT/.hfr_ranges"
rm -f "$OUT/.hfr_ranges"
