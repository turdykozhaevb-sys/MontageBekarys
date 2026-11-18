#!/usr/bin/env python3
"""
Face track for the virtual camera and the text layout checks.

Detects the face on every source frame (OpenCV YuNet, model in tools/models/, MIT licence),
fills gaps, smooths it (Gaussian, sigma 0.35 s) so a camera following it feels operated,
not jittery, and writes remotion/src/data/faces.json:
  { fps, cx[], cy[], top[], chin[] }  indexed by SOURCE frame (source pixels, 1080x1920)

Run:  python3 tools/face_track.py    (needs opencv-python-headless, numpy)
"""
import json
import os

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "remotion", "public", "media", "source.mp4")
MODEL = os.path.join(ROOT, "tools", "models", "face_detection_yunet_2023mar.onnx")
OUT = os.path.join(ROOT, "remotion", "src", "data", "faces.json")


def main():
    cap = cv2.VideoCapture(SRC)
    fps = cap.get(cv2.CAP_PROP_FPS)
    det = cv2.FaceDetectorYN.create(MODEL, "", (1080, 1920), 0.7, 0.3, 5000)
    rows = []
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        h, w = fr.shape[:2]
        det.setInputSize((w, h))
        _, faces = det.detect(fr)
        if faces is None:
            rows.append(None)
            continue
        # the largest face in the upper 60% of the frame (drops false hits on hands)
        cands = [f for f in faces if f[1] < 0.6 * h]
        if not cands:
            rows.append(None)
            continue
        f = max(cands, key=lambda f: f[2] * f[3])
        rows.append((f[0] + f[2] / 2, f[1] + f[3] / 2, f[1], f[1] + f[3]))
    n = len(rows)
    arr = np.full((n, 4), np.nan)
    for i, r in enumerate(rows):
        if r:
            arr[i] = r
    idx = np.arange(n)
    for k in range(4):
        good = ~np.isnan(arr[:, k])
        arr[:, k] = np.interp(idx, idx[good], arr[good, k])
    sigma = 0.35 * fps
    rad = int(3 * sigma)
    ker = np.exp(-0.5 * (np.arange(-rad, rad + 1) / sigma) ** 2)
    ker /= ker.sum()
    sm = np.stack([np.convolve(np.pad(arr[:, k], rad, mode="edge"), ker, mode="valid") for k in range(4)], 1)
    data = {
        "_generated_by": "tools/face_track.py",
        "fps": fps,
        "detected": int(sum(r is not None for r in rows)),
        "frames": n,
        "cx": [round(float(v), 1) for v in sm[:, 0]],
        "cy": [round(float(v), 1) for v in sm[:, 1]],
        "top": [round(float(v), 1) for v in sm[:, 2]],
        "chin": [round(float(v), 1) for v in sm[:, 3]],
    }
    with open(OUT, "w") as f:
        json.dump(data, f)
    print(f"{data['detected']}/{n} frames with a face; cx {sm[:,0].min():.0f}-{sm[:,0].max():.0f}, "
          f"cy {sm[:,1].min():.0f}-{sm[:,1].max():.0f}, top >= {sm[:,2].min():.0f}, chin <= {sm[:,3].max():.0f}")


if __name__ == "__main__":
    main()
