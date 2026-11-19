#!/usr/bin/env bash
# Voice + continuous music bed with ducking, mastered to -14 LUFS / -1 dBTP.
# Usage: mix.sh voice_or_video music out.wav [music_gain=0.25]
set -euo pipefail
v=${1:?voice}; m=${2:?music}; out=${3:?out.wav}; mg=${4:-0.25}
ffmpeg -hide_banner -loglevel error -y -i "$v" -stream_loop -1 -i "$m" -filter_complex \
"[0:a]highpass=f=80,afftdn=nf=-25,equalizer=f=4000:t=q:w=1:g=2,acompressor=threshold=-18dB:ratio=3.5:attack=5:release=120,asplit=2[v][vsc];\
[1:a]volume=${mg}[m];[m][vsc]sidechaincompress=threshold=0.05:ratio=8:attack=20:release=300[md];\
[v][md]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1:LRA=6[a]" \
  -map "[a]" -ar 48000 "$out"
