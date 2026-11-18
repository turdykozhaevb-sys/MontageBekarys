# MontageBekarys

Professional Remotion edit of a 20-second Kazakh talking-head clip: an event studio's
**1-year anniversary open-house invitation** (21 қараша, 15:00, Жаңаөзен).

- **Final video:** `final/reel_final.mp4` (1080×1920, 30 fps, 21.8 s, H.264 High, BT.709, −14 LUFS)
- **Editable project:** `remotion/` (React + Remotion 4.0.545)
- **Edit notes:** `edit/reel01/project.md` (transcript, decisions, open items)

## How the edit works

| Layer | What | Where |
|---|---|---|
| The cut | One continuous take. Speech plays at exactly 1.0× (lips always in sync). Only the silent pauses, the pre-roll and the final smile are **time-remapped** with smooth speed ramps, so pauses vanish without jump cuts and every phrase lands on the beat. | `tools/plan_edit.py` → `remotion/src/data/timeline.json`, `remotion/src/lib/timeRemap.ts` |
| Slow motion | Optical-flow 4× frames (120 fps) for the slowed pause before the date and the slow-motion ending. | `tools/prepare_media.sh`, `remotion/src/components/Footage.tsx` |
| Camera | Virtual camera: 11 shots, 9 kinds of entrance, face-following framing, real motion blur on moves only. Uniform scale only: no distortion, aspect ratio kept. | `remotion/src/edit/shots.ts`, `remotion/src/lib/camera.ts`, `remotion/src/components/CameraLayer.tsx` |
| Titles | Kazakh titles, verbatim from her speech, each on its spoken word. Noto Serif Display + Inter Tight (both cover every Kazakh letter). Rose-gold accent sampled from the studio's logo. | `remotion/src/edit/Titles.tsx`, `remotion/src/components/Plate.tsx`, `remotion/src/theme.ts` |
| Sound | Original score composed to the cut (120 BPM = 15 frames/beat), ducked under the voice; 12 sound-design cues; voice from the lossless original audio. | `tools/score.py` → `remotion/public/audio/`, `remotion/src/edit/sound.tsx` |
| Colour | **No grading.** Only the unavoidable technical HDR (HLG) → SDR BT.709 conversion, plus a measured +1 luma pre-compensation for Remotion's frame decoder. Verified on the final file against the uncompensated conversion: luma mean error −0.06 code values, chroma ≤ 0.13 (encoding noise only). | `tools/prepare_media.sh` |

## Render

```bash
cd remotion
npm install
npx remotion studio                                   # preview and edit
npx remotion render Reel out/reel_render.mp4          # PNG frames, H.264 CRF 12, preset slow, BT.709 (remotion.config.ts)
cd .. && tools/master.sh remotion/out/reel_render.mp4 final/reel_final.mp4
```

In a container without Chrome, point Remotion at a local Chrome Headless Shell:
`REMOTION_BROWSER=/path/to/chrome-headless-shell npx remotion render Reel out/reel_render.mp4`

### Mastering

`tools/master.sh` copies the video stream untouched and masters the audio: 25 Hz rumble filter, gain to
−14 LUFS, 4×-oversampled look-ahead limiter (true peak ≤ −1 dBTP), audio trimmed to the exact video length.
It exits non-zero if the result misses −14 ±0.5 LUFS, −1 dBTP or the duration.
The voice itself gets standard dialogue processing in `tools/prepare_media.sh` (70 Hz high-pass, 3:1 soft-knee compression).

### Quality checks

```bash
python3 tools/check_sync.py final/reel_final.mp4     # every voice piece at its planned frame (lip sync), 0 ms tolerance 1 ms
python3 tools/audit_render.py final/reel_final.mp4   # face on every frame, never in the UI band, never under a title
```

## Change something

| You want to… | Edit | Then |
|---|---|---|
| Move a title, change its text or timing | `remotion/src/edit/Titles.tsx` | render |
| Change a shot, zoom, or transition | `remotion/src/edit/shots.ts` | render |
| Move / remove a sound effect | `remotion/src/edit/sound.tsx` (`SFX`) | render |
| Change the cut (pauses, tempo, ending length) | `tools/plan_edit.py` | `python3 tools/plan_edit.py && python3 tools/score.py`, rebuild slow-mo clips if the ranges changed (`tools/prepare_media.sh <original.MOV>`), render |
| Change the music | `tools/score.py` | `python3 tools/score.py`, render |

Python tools need `numpy scipy soundfile pyloudnorm opencv-python-headless faster-whisper`.

## Rebuild all media from the original iPhone file

```bash
tools/prepare_media.sh /path/to/original.MOV   # picture master, voice.wav, slow-motion clips
python3 tools/face_track.py                    # face track for the camera
python3 tools/plan_edit.py                     # the cut + beat grid
python3 tools/score.py                         # music + sound design
```

Fonts: SIL Open Font License (`remotion/public/fonts/OFL-*.txt`). Face model: OpenCV YuNet (MIT).
Music and sound effects are synthesized by `tools/score.py`: original, no third-party samples.
