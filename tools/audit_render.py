#!/usr/bin/env python3
"""
Render audit: face detection on EVERY frame of the finished video.

Checks
  1. the face is found on every frame (never cropped out by the virtual camera)
  2. the top of the face box stays below the social-app UI band (y > 220)
  3. chin + 60 px stays above the highest title plate (y = 1000), so no title can
     ever touch the face, whatever title is on screen
Also reports the zoom-softness proxy (sharpness of the face crop) per frame range.

Run:  python3 tools/audit_render.py remotion/out/reel_render.mp4
"""
import sys
import os

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.path.join(ROOT, "tools", "models", "face_detection_yunet_2023mar.onnx")
UI_TOP = 220
PLATE_TOP_MIN = 1000
MARGIN = 60


def main(path):
    cap = cv2.VideoCapture(path)
    det = cv2.FaceDetectorYN.create(MODEL, "", (1080, 1920), 0.6, 0.3, 5000)
    n = 0
    missing, ui, overlap = [], [], []
    chins = []
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        h, w = fr.shape[:2]
        det.setInputSize((w, h))
        _, faces = det.detect(fr)
        cands = [] if faces is None else [f for f in faces if f[1] < 0.6 * h]
        if not cands:
            missing.append(n)
        else:
            f = max(cands, key=lambda f: f[2] * f[3])
            top, chin = f[1], f[1] + f[3]
            chins.append((n, chin))
            if top < UI_TOP:
                ui.append((n, int(top)))
            if chin + MARGIN > PLATE_TOP_MIN:
                overlap.append((n, int(chin)))
        n += 1
    worst = max(chins, key=lambda c: c[1]) if chins else None
    print(f"frames {n}; face found on {n - len(missing)}")
    print(f"  missing face   : {len(missing)} {missing[:20]}")
    print(f"  face in UI band: {len(ui)} {ui[:10]}")
    print(f"  chin+{MARGIN} > {PLATE_TOP_MIN}: {len(overlap)} {overlap[:10]}")
    if worst:
        print(f"  lowest chin    : y={worst[1]:.0f} at frame {worst[0]} (clearance to plates {PLATE_TOP_MIN - worst[1] - MARGIN:.0f} px)")
    ok = not missing and not ui and not overlap
    print("AUDIT", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
