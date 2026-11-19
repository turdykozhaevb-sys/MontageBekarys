#!/usr/bin/env bash
# Voice + continuous music bed with ducking, mastered to -14 LUFS / -1 dBTP (two-pass loudnorm).
# Usage: mix.sh voice_or_video music out.wav [music_gain=0.25]
set -euo pipefail
v=${1:?voice}; m=${2:?music}; out=${3:?out.wav}; mg=${4:-0.25}
tmp=$(mktemp --suffix=.wav); trap 'rm -f "$tmp"' EXIT
ffmpeg -hide_banner -loglevel error -y -i "$v" -stream_loop -1 -i "$m" -filter_complex \
"[0:a]highpass=f=80,afftdn=nf=-25,equalizer=f=4000:t=q:w=1:g=2,acompressor=threshold=-18dB:ratio=3.5:attack=5:release=120,asplit=2[v][vsc];\
[1:a]volume=${mg}[m];[m][vsc]sidechaincompress=threshold=0.05:ratio=8:attack=20:release=300[md];\
[v][md]amix=inputs=2:normalize=0:duration=first[a]" -map "[a]" -ar 48000 -c:a pcm_f32le "$tmp"
# pass 1: measure
j=$(ffmpeg -hide_banner -nostats -i "$tmp" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$j" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
# pass 2: apply measured values (linear gain when possible)
ffmpeg -hide_banner -loglevel error -y -i "$tmp" -af \
"loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" \
  -ar 48000 "$out"
