# reel01 — Event studio, 1-year anniversary invitation

## Session
- Source: one iPhone 14 Pro take, vertical 1080×1920, 20.1 s, 30 fps, HEVC 10-bit HDR (HLG, Dolby Vision 8.4), stereo audio. Contains GPS metadata (stripped from every derived file).
- Language: Kazakh (some Russian loanwords: "ровно").
- Output: 1080×1920, 30 fps, 21.8 s, H.264 High CRF 12, BT.709, AAC 320k, master −14 LUFS / −1 dBTP.

## Transcript (corrected by ear-model consensus: faster-whisper medium + large-v3 + 3 short re-transcriptions)
> Достар, біздің ивент студиямыз Жаңаөзен қаласында ашылғанына ровно бір жыл болып жатыр екен. Соған орай, кеңсемізде клиенттерге арналған ашық есік күні болатынын хабарлаймыз. 21-ші қараша, сағат он бес нөл нөлде. Келіңіздер, сіздерді тосын сый күтеді.

EN: Friends, it has been exactly one year since our event studio opened in Zhanaozen. To mark it, we are announcing an open house for clients at our office. 21 November, 15:00. Come — a surprise awaits you.

## Strategy
- Format: invitation / announcement (“offer”), 20–25 s.
- Structure: kept in spoken order (the opening "Достар!" with open arms is already a strong hook); ending = payoff with a hold + recap end card (screenshot-able date/time).
- Takes & slips: none found. Checked: stretched words (two Whisper flags were leading silence and a 0.42 s pause, not repeats), repeated phrases, restart words, >1 s pauses. No retakes in the source.
- Pacing: her pauses are already short (120–480 ms). Speech is never sped up or cut; pauses are time-remapped (speed-ramped) so each phrase lands on the musical grid. The 0.7 s pre-roll is ramped in at ~2.3×.
- Colour: no grading, LUT, white balance or filters (client brief). Only the unavoidable technical HLG→BT.709 conversion (BT.2408 reference-white mapping, mobius roll-off, desat 0).
  - Measured: Remotion's frame decoder rounds luma ~1 code value low (−1.1 on Y 36–215). The picture master is pre-compensated by +1 Y from level 36 up (tools/prepare_media.sh), so the RENDER matches the conversion.
  - Verified on final/reel_final.mp4 (identity-camera frames, YUV planes vs the uncompensated conversion): Y mean −0.06 / −0.04 code values, U +0.05, V +0.11–0.13, PSNR-Y 47.8–48.4 dB (H.264 CRF 12 noise only).
- Voice: standard dialogue processing only (70 Hz high-pass, 3:1 soft-knee compression from −24 dBFS: crest factor 21 → 15 dB) so the final limiter never squashes syllables.

## Delivery checks (final/reel_final.mp4)
- 1080×1920, 30 fps, 654 frames, 21.80 s, H.264 High CRF 12 (preset slow), BT.709 tagged, AAC 320k 48 kHz.
- Loudness: −14.2 LUFS integrated, −1.3 dBTP true peak; audio = video duration (tools/master.sh acceptance PASS).
- Lip sync: every speech piece at 0.0 ms offset from its planned frame (tools/check_sync.py).
- Faces: found on 654/654 frames, never in the app-UI band, chin + 60 px always above every title plate (tools/audit_render.py).
- Remaining silence inside phrases: her own natural pauses (≤ 310 ms); pauses between phrases re-timed to the beat grid (67–500 ms).
- Takes removed: 0 (none in the source). Speech removed or sped up: none.

## Decisions
- Music: original score composed to the cut (tools/score.py), 120 BPM (15 frames per beat), D major, elegant house. Pickup hit on "Достар!", break + riser before the date, drop on "21-ші қараша", final chord on the end card. Fully synthesized: no samples, no licence needed.
- Sound design: 12 cues (swell, 3 impacts, 3 whooshes, riser, sparkle, 3 ticks), placed by their audible peak.
- Camera: 11 shots, 9 kinds of entrance (burst-out reveal, hard cuts, push-in through a ramped pause, whip pan, punch-in, slow-motion lean-in, impact cut-out, pull-out with her gesture, slow push on the slow-motion smile). Face-following framing from the face track. Zoom: ×1.41 max on held shots; ×1.5 only for an instant (mid-whip and the end of the payoff lean-in, under motion blur).
- Typography: Noto Serif Display (lining numerals) + Inter Tight, both verified to contain every Kazakh letter. Manrope / Playfair / Unbounded were rejected: they lack Ә Ғ Қ Ң Ұ. Accent = rose gold #E2B48C sampled from the studio's own logo in the footage. Black plates, 8 px rose-gold marker bar.
- Titles (all words from her speech): БІЗГЕ 1 ЖЫЛ (hook) · ЖАҢАӨЗЕН · КЛИЕНТТЕРГЕ АРНАЛҒАН / Ашық есік күні · 21 қараша / САҒАТ 15:00 · СІЗДЕРДІ / тосын сый / КҮТЕДІ · end card.
- Full subtitles: not added (key-information titles carry the message without sound). Can be added on request.

## Open items (to verify)
- Studio name: both models hear "Seventeen" / "17" before "студиямыз"; the window logo reads "…EVENT DESIGN". Not shown on screen until confirmed.
- Date & time on screen (21 қараша, 15:00) come from her speech and were confirmed by three independent transcriptions; please double-check against the real event before posting.
- Address is not mentioned in the video; consider adding it in the post caption.
