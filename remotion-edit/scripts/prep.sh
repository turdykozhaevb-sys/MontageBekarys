#!/usr/bin/env bash
# FFmpeg pre-pass: grade + H.264 mezzanine + speech master + cut SFX. Run from project root.
set -euo pipefail
CUTS=(2.67 6.30 9.03 12.60)
# --- SFX: soft noise whoosh (rise+fall) per cut, placed 0.12s before the cut
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=0.5:c=pink:a=0.5:r=44100" \
  -af "highpass=f=400,lowpass=f=5000,afade=t=in:d=0.25,afade=t=out:st=0.25:d=0.25,volume=0.5" scripts/whoosh.wav
FC="[0:a]"; MIX=""
IN="-i scripts/source.mov"; i=1; DEL=""
for c in "${CUTS[@]}"; do
  ms=$(python3 -c "print(int(($c-0.28)*1000))"); IN="$IN -i scripts/whoosh.wav"
  DEL="$DEL[$i:a]adelay=${ms}|${ms},volume=0.55[w$i];"; MIX="$MIX[w$i]"; i=$((i+1))
done
# speech: light denoise + gentle comp, then mix SFX, then loudnorm to -14 LUFS / -1 dBTP
ffmpeg -v error -y $IN -filter_complex \
 "[0:a]afftdn=nf=-30,highpass=f=70,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120:makeup=3[sp];${DEL}[sp]${MIX}amix=inputs=5:normalize=0:duration=first[m];[m]loudnorm=I=-14:TP=-1:LRA=9[a]" \
 -map "[a]" -ar 48000 -c:a pcm_s16le scripts/master.wav
# --- Video: HEVC->H.264, no crop/scale, light neutral-cool lifted grade, bt709
ffmpeg -v error -y -i scripts/source.mov -i scripts/master.wav -map 0:v -map 1:a \
 -vf "eq=contrast=1.05:saturation=0.95:gamma=0.98,curves=all='0/0.025 1/0.99',colorbalance=rs=-0.015:bs=0.025:rh=-0.01:bh=0.02,format=yuv420p" \
 -c:v libx264 -crf 14 -preset slow -r 30 -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
 -c:a aac -b:a 256k -t 18 public/graded.mp4
