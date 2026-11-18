# Montage – reference-style edit (1080×1920, H.264)

Pipeline
1. `tools/grade_and_cut.sh <source.mov> public` – cuts the source to the timeline (frame-accurate) and applies the per-shot grade → `public/graded.mp4`, `public/voice_raw.wav`.
2. `python3 -I tools/synth_audio.py public` – original 120 BPM music bed + SFX composed on the cut grid → `music.wav`, `sfx.wav`.
3. `tools/mix.sh` – voice chain, sidechain-ducked music, SFX, two-pass loudnorm to −14 LUFS → `public/mix.wav`.
4. `node tools/stills.mjs <dir> <frames>` – preview stills.
5. `npm run render` – final MP4 → `out/final.mp4`.

Timeline and on-screen text live in `src/timeline.ts`.
