#!/usr/bin/env python3
"""
Edit planner: builds the time-remap (source -> output) and the musical grid.

Single source of truth for the cut. Writes remotion/src/data/timeline.json, which
both the Remotion composition (picture + voice) and tools/score.py (music + SFX) read.

How the cut works
-----------------
The source is ONE continuous take. Speech is never sped up, slowed down or chopped:
every "speech" piece plays at exactly 1.0x with its own audio. Only the silent pauses
between phrases ("gap" pieces), the pre-roll ("lead") and the final smile ("tail") are
re-timed. The picture runs through them on a smooth speed curve that leaves and re-enters
at exactly 1.0x (see remotion/src/lib/timeRemap.ts), so pauses disappear without jump
cuts and lip sync is untouched.

Each gap's output length is chosen so that the NEXT phrase's first syllable lands on
the musical grid (120 BPM = exactly 15 frames per beat at 30 fps).

Edges come from the audio speech mask (it-reelsmaker speech_mask.py, threshold -44 dBFS):
first speech - 20 ms ... last speech + 30 ms.

Run:  python3 tools/plan_edit.py
"""
import json
import math
import os

FPS = 30
BPM = 120.0
BEAT = 60.0 / BPM  # 0.5 s = 15 frames
BEAT_F = 15

# --- Measured on the source (seconds of remotion/public/media/source.mp4) -------------------
# Speech pieces: (src_in, src_out, first-syllable onset, text)
SPEECH = [
    (0.71, 5.35, 0.73, "Достар, біздің ивент студиямыз Жаңаөзен қаласында ашылғанына"),
    (5.72, 8.46, 5.74, "ровно бір жыл болып жатыр екен. Соған орай,"),
    (8.70, 10.97, 8.72, "кеңсемізде клиенттерге арналған"),
    (11.20, 13.68, 11.22, "ашық есік күні болатынын хабарлаймыз."),
    (13.94, 17.07, 13.96, "21-ші қараша, сағат он бес нөл нөлде."),
    (17.19, 19.12, 17.21, "Келіңіздер, сіздерді тосын сый күтеді."),
]
# Rules for the pause BEFORE speech piece i:
#   (min_out_s, max_out_s, grid_beats, target_fraction_of_raw, prefer_group)
#   grid_beats: 1 = the onset lands on a beat, 0.5 = on an eighth note
#   prefer_group: 2 = favour a half-bar, 4 = favour a bar downbeat, 0 = no preference
GAP_RULES = {
    1: (0.12, 0.45, 0.5, 0.6, 0),   # -> "ровно бір жыл"
    2: (0.10, 0.40, 0.5, 0.6, 0),   # -> "кеңсемізде"   (section change: news -> invitation)
    3: (0.10, 0.40, 0.5, 0.6, 0),   # -> "ашық есік күні"
    4: (0.30, 0.95, 1.0, 1.6, 2),   # -> "21-ші қараша"  payoff: music break + slow-down
    5: (0.06, 0.40, 0.5, 0.6, 0),   # -> "Келіңіздер"   (her pause here is only ~70 ms)
}
LEAD_SRC = 0.10              # picture starts here; ramps fast into "Достар" at 1.0x
BEAT0_FRAME = 9              # "Достар" lands on frame 9 (after a 0.3 s swell)
TAIL_SRC = (19.12, 20.06)    # the smile after the last word: slow-motion hold
END_HOLD_BEATS = 4           # end card holds one bar after its hit
BAR_PHASE = 3                # bar downbeats fall on beats 3, 7, 11, ... ("Достар" is a pickup);
                             # this puts the date drop (beat 27) and the end-card hit on downbeats

# Key words (source seconds; from the speech envelope + 3 transcription passes)
WORDS = {
    "dostar": 0.73,
    "bizdin": 1.46,
    "zhanaozen": 3.10,
    "rovno": 5.74,
    "bir_zhyl": 6.20,
    "sogan": 7.61,
    "kense": 8.72,
    "klient": 9.78,
    "ashyq": 11.22,
    "habarlaimyz": 12.96,
    "zhiyrma": 13.96,
    "qarasha": 14.74,
    "sagat": 15.38,
    "on_bes": 15.62,
    "nol_nolde": 16.09,
    "keliniz": 17.21,
    "sizderdi": 17.90,
    "tosyn": 18.24,
    "kutedi": 18.72,
    "last_voice": 19.09,
}


def fr(t):
    return int(round(t * FPS))


def grid_in(s):
    """speech in-points snap DOWN to the source frame grid (never clip a syllable)"""
    return math.floor(s * FPS + 1e-6) / FPS


def grid_out(s):
    return math.ceil(s * FPS - 1e-6) / FPS


def plan():
    global SPEECH
    SPEECH = [(grid_in(a), grid_out(b), on, lab) for a, b, on, lab in SPEECH]
    pieces = []
    onset0_off = SPEECH[0][2] - SPEECH[0][0]
    lead_dur = BEAT0_FRAME / FPS - onset0_off
    pieces.append({"kind": "lead", "src_in": LEAD_SRC, "src_out": SPEECH[0][0], "out_dur": lead_dur})
    t = lead_dur
    beat0 = BEAT0_FRAME / FPS
    for i, (a, b, onset, label) in enumerate(SPEECH):
        if i > 0:
            prev_b = SPEECH[i - 1][1]
            raw = a - prev_b
            lo, hi, grid, frac, prefer = GAP_RULES[i]
            step = BEAT * grid
            onset_off = onset - a
            best = None
            k0 = math.floor((t + lo + onset_off - beat0) / step)
            for k in range(k0 - 1, k0 + 6):
                target = beat0 + k * step
                g = target - onset_off - t
                if lo - 1e-6 <= g <= hi + 1e-6:
                    cost = abs(g - raw * frac)
                    beats = (target - beat0) / BEAT
                    if prefer and abs(beats / prefer - round(beats / prefer)) > 1e-6:
                        cost += 0.5
                    if best is None or cost < best[0]:
                        best = (cost, g, target)
            if best is None:
                raise SystemExit(f"gap {i}: no grid slot in [{lo},{hi}] (raw {raw:.2f})")
            _, g, target = best
            pieces.append({"kind": "gap", "src_in": prev_b, "src_out": a, "out_dur": g, "raw": raw})
            t += g
        pieces.append({"kind": "speech", "src_in": a, "src_out": b, "out_dur": b - a,
                       "onset_off": onset - a, "label": label})
        t += b - a
    pieces.append({"kind": "tail", "src_in": SPEECH[-1][1], "src_out": TAIL_SRC[1], "out_dur": None})
    return pieces


def quantize(pieces):
    """Frame-exact, contiguous piece boundaries (no rounding drift)."""
    t = 0.0
    f = 0
    for p in pieces:
        if p["out_dur"] is None:
            p["from"] = f
            continue
        t += p["out_dur"]
        f_end = fr(t)
        p["from"], p["dur"] = f, f_end - f
        f = f_end
    return pieces


def src_to_out_frame(pieces, s):
    for p in pieces:
        if p["kind"] == "speech" and p["src_in"] - 1e-6 <= s <= p["src_out"] + 1e-6:
            return fr(p["from"] / FPS + (s - p["src_in"]))
    raise ValueError(f"source {s} is not inside a speech piece")


def main():
    pieces = quantize(plan())
    words = {k: src_to_out_frame(pieces, v) for k, v in WORDS.items()}

    # End card: first bar downbeat after the last word (at least 4 frames of breath)
    k = math.ceil((words["last_voice"] + 4 - BEAT0_FRAME) / BEAT_F)
    while (k - BAR_PHASE) % 4:
        k += 1
    endcard = BEAT0_FRAME + k * BEAT_F
    duration = endcard + END_HOLD_BEATS * BEAT_F
    tail = pieces[-1]
    tail["dur"] = duration - tail["from"]

    # Slow-motion ranges need optical-flow frames (tools/make_hfr.sh builds them at 4x)
    hfr = []
    for p in pieces:
        rate = (p["src_out"] - p["src_in"]) / (p["dur"] / FPS)
        p["avg_rate"] = rate
        if p["kind"] in ("gap", "tail") and rate < 0.95:
            hfr.append([round(p["src_in"] - 0.25, 2), round(min(p["src_out"] + 0.25, 20.13), 2)])

    data = {
        "_generated_by": "tools/plan_edit.py (edit the script and re-run, do not edit this file by hand)",
        "fps": FPS,
        "width": 1080,
        "height": 1920,
        "bpm": BPM,
        "beatFrames": BEAT_F,
        "beat0Frame": BEAT0_FRAME,
        "barPhase": BAR_PHASE,
        "durationInFrames": duration,
        "endCardFrame": endcard,
        "pieces": [],
        "words": words,
        # optical-flow clips (4x frame rate) used for slow motion; built by tools/prepare_media.sh
        "hfr": [
            {"file": f"media/hfr_{math.floor(a * FPS):04d}.mp4", "startSec": math.floor(a * FPS) / FPS,
             "endSec": b, "fps": FPS * 4}
            for a, b in hfr
        ],
    }
    for p in pieces:
        q = {"kind": p["kind"], "srcIn": round(p["src_in"], 4), "srcOut": round(p["src_out"], 4),
             "from": p["from"], "durationInFrames": p["dur"]}
        if p["kind"] == "speech":
            q["label"] = p["label"]
            q["onsetFrame"] = p["from"] + fr(p["onset_off"])
        data["pieces"].append(q)

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(root, "remotion", "src", "data", "timeline.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"BPM {BPM:g}, beat = {BEAT_F} frames, beat 0 = frame {BEAT0_FRAME}")
    for p in pieces:
        extra = ""
        if p["kind"] == "speech":
            on = p["from"] + fr(p["onset_off"])
            extra = f"onset f{on} = beat {(on - BEAT0_FRAME) / BEAT_F:5.2f}   {p['label'][:40]}"
        elif p["kind"] == "gap":
            extra = f"pause {p['raw'] * 1000:.0f} -> {p['dur'] / FPS * 1000:.0f} ms"
        print(f"{p['kind']:6s} src {p['src_in']:6.2f}-{p['src_out']:6.2f}  out f{p['from']:4d} +{p['dur']:3d}  "
              f"{p['avg_rate']:4.2f}x  {extra}")
    print(f"end card f{endcard} (beat {(endcard - BEAT0_FRAME) / BEAT_F:.0f}), duration {duration} f = {duration / FPS:.2f} s")
    print("words:", words)
    print("hfr ranges:", hfr)


if __name__ == "__main__":
    main()
