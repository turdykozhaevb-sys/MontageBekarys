#!/usr/bin/env bash
# Voice chain + sidechain-ducked music + SFX, mastered to -14 LUFS / -1 dBTP.
set -euo pipefail
cd "$(dirname "$0")/../public"
FC="[0:a]apad=whole_dur=18,highpass=f=85,afftdn=nf=-28:nr=8,equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=3500:t=q:w=1.5:g=2.5,acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=4dB,asplit[v][sc];\
[1:a]volume=-13dB[m];[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450[md];\
[2:a]volume=-4dB[s];[v][md][s]amix=inputs=3:normalize=0:duration=longest,atrim=0:18"
LN=$(mktemp); ffmpeg -hide_banner -y -i voice_raw.wav -i music.wav -i sfx.wav -filter_complex "$FC,loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json" -f null - 2> "$LN"
read I TP LRA TH OFF < <(python3 -c "
import json,re;t=open('$LN').read();j=json.loads(t[t.rindex('{'):])
print(j['input_i'],j['input_tp'],j['input_lra'],j['input_thresh'],j['target_offset'])")
ffmpeg -v error -y -i voice_raw.wav -i music.wav -i sfx.wav -filter_complex "$FC,loudnorm=I=-14:TP=-1.5:LRA=9:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true,aresample=48000" -c:a pcm_s16le mix.wav
ffmpeg -hide_banner -i mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary | grep -E "I:|Peak:|LRA:"
