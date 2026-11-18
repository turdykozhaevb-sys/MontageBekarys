#!/usr/bin/env python3
"""
Lip-sync check: for every speech piece of the cut, cross-correlate the final mix against the
original voice at the planned position. A lag of 0 ms means the voice sits exactly on the frames
the picture uses (the picture of a speech piece is the same source span at 1.0x).

Run:  python3 tools/check_sync.py final/reel_final.mp4
"""
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000


def main(path):
    tl = json.load(open(os.path.join(ROOT, "remotion", "src", "data", "timeline.json"), encoding="utf-8"))
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", path, "-map", "0:a:0", "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    mix = np.frombuffer(raw, dtype=np.float32)
    voice, vsr = sf.read(os.path.join(ROOT, "remotion", "public", "media", "voice.wav"), dtype="float32")
    voice = voice.mean(1)
    assert vsr == SR
    fps = tl["fps"]
    worst = 0.0
    for p in tl["pieces"]:
        if p["kind"] != "speech":
            continue
        out0 = p["from"] / fps
        dur = p["durationInFrames"] / fps
        v = voice[int(p["srcIn"] * SR):int((p["srcIn"] + dur) * SR)]
        pad = int(0.1 * SR)
        m = mix[max(0, int(out0 * SR) - pad):int((out0 + dur) * SR) + pad]
        # normalised cross-correlation around the expected position (+-100 ms)
        c = np.correlate(m, v, mode="valid")
        lag = (np.argmax(np.abs(c)) - pad) / SR * 1000
        worst = max(worst, abs(lag))
        print(f"f{p['from']:4d}  lag {lag:+6.1f} ms   {p['label'][:48]}")
    ok = worst <= 1.0
    print("SYNC", "PASS" if ok else "FAIL", f"(worst {worst:.1f} ms)")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
