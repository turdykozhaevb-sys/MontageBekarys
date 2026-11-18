#!/usr/bin/env python3
"""
Original score + sound design, composed to picture.

Reads remotion/src/data/timeline.json (written by tools/plan_edit.py) and writes:
  remotion/public/audio/music.wav        the score, already ducked under the voice
  remotion/public/audio/sfx/*.wav        individual sound-design hits, placed in Remotion
                                         (src/edit/sound.ts), so they stay editable there

Everything is synthesized here from scratch (no samples, no third-party loops), so there is
nothing to license. Deterministic: the same timeline always gives the same audio.

Music: elegant house / nu-disco, 120 BPM, D major.
  Pickup hit on "Достар!" (beat 0)  -> groove from beat 3 (bar downbeats on beats 3, 7, 11 ...)
  Verse A  beats 3-15   Bm9 | Gmaj9 | Dmaj9           (the anniversary)
  Verse B  beats 15-25  Asus | Bm9 | Gmaj9 + arp      (the invitation lifts)
  Break    beats 25-27  drums out, snare roll          (picture slows, riser SFX)
  Drop     beat 27      "21-ші қараша"  Dmaj9 | Bm9 | Gmaj9 | A
  End hit  beat 39      Dmaj9 rings out under the end card

Run:  python3 tools/score.py   (needs numpy, scipy, soundfile, pyloudnorm)
"""
import json
import os

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, "remotion", "src", "data", "timeline.json"), encoding="utf-8"))
FPS, BF, B0 = TL["fps"], TL["beatFrames"], TL["beat0Frame"]
DUR = TL["durationInFrames"] / FPS
N = int(round(DUR * SR))
OUT_DIR = os.path.join(ROOT, "remotion", "public", "audio")
SFX_DIR = os.path.join(OUT_DIR, "sfx")
os.makedirs(SFX_DIR, exist_ok=True)
rng = np.random.default_rng(20261121)


def bt(b):
    """beat number -> seconds on the output timeline"""
    return (B0 + b * BF) / FPS


def ft(f):
    return f / FPS


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tarr(n):
    return np.arange(n) / SR


# ---------------------------------------------------------------- DSP helpers
def _sos(kind, fc, order=2):
    return signal.butter(order, fc, kind, fs=SR, output="sos")


def lp(x, fc, order=2):
    return signal.sosfilt(_sos("low", min(fc, SR / 2 * 0.95), order), x, axis=0)


def hp(x, fc, order=2):
    return signal.sosfilt(_sos("high", fc, order), x, axis=0)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(_sos("band", [lo, min(hi, SR / 2 * 0.95)], order), x, axis=0)


def st(x):
    return x if x.ndim == 2 else np.stack([x, x], 1)


def pan(x, p):
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)


def place(buf, x, t0, gain=1.0):
    x = st(x)
    i0 = int(round(t0 * SR))
    if i0 < 0:
        x, i0 = x[-i0:], 0
    n = min(len(x), len(buf) - i0)
    if n > 0:
        buf[i0:i0 + n] += gain * x[:n]


def fade(x, fin=0.002, fout=0.01):
    x = x.copy()
    a, b = int(fin * SR), int(fout * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a)[:, None] if x.ndim == 2 else np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)[:, None] if x.ndim == 2 else np.linspace(1, 0, b)
    return x


def saw(f, n, phase0=0.0):
    """band-limited sawtooth (PolyBLEP)"""
    dt = f / SR
    ph = (phase0 + dt * np.arange(n)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt
    y[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt
    y[m] -= x * x + x + x + 1
    return y


def reverb_ir(seconds=2.4, predelay=0.018, damp=7000):
    n = int(seconds * SR)
    t = tarr(n)
    irs = []
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t / (seconds / 6.9))
        ir = lp(ir, damp)
        for d, g in [(0.011, 0.6), (0.017, 0.4), (0.029, 0.35), (0.041, 0.25), (0.053, 0.2)]:
            ir[int((d + 0.0031 * ch) * SR)] += g
        ir = np.concatenate([np.zeros(int(predelay * SR)), ir])
        irs.append(ir / np.sqrt(np.sum(ir ** 2)))
    return irs


IR_HALL = reverb_ir(2.6, 0.02, 6500)
IR_ROOM = reverb_ir(1.1, 0.008, 9000)


def reverb(x, ir, length=None):
    x = st(x)
    out = np.stack([signal.fftconvolve(x[:, c], ir[c]) for c in range(2)], 1)
    return out[: (length or len(out))]


def pingpong(x, delay, fb=0.45, taps=6, damp=5000):
    x = st(x)
    d = int(delay * SR)
    out = np.zeros((len(x) + d * taps, 2))
    y = x.mean(1)
    for k in range(1, taps + 1):
        y = lp(y, damp, 1) * fb
        ch = (k - 1) % 2
        out[k * d:k * d + len(y), ch] += y
    return out[: len(x)]


# ---------------------------------------------------------------- instruments
HAT_F = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0]


def metal(n):
    t = tarr(n)
    return sum(np.sign(np.sin(2 * np.pi * f * t + rng.random() * 6.28)) for f in HAT_F) / 6


def kick():
    n = int(0.45 * SR)
    t = tarr(n)
    f = 52 + 95 * np.exp(-t / 0.032) + 60 * np.exp(-t / 0.005)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.24)
    y += 0.35 * np.sin(2 * np.pi * 118 * t) * np.exp(-t / 0.045)  # knock: audible on phones
    click = hp(rng.standard_normal(n), 1800) * np.exp(-t / 0.0018) * 0.22
    y = np.tanh(1.7 * (y + click)) / np.tanh(1.7)
    return fade(y, 0, 0.02)


def clap():
    n = int(0.6 * SR)
    t = tarr(n)
    nz = bp(rng.standard_normal(n), 950, 3600)
    env = np.zeros(n)
    for k, d in enumerate([0.0, 0.0085, 0.0175, 0.027]):
        i = int(d * SR)
        env[i:] += np.exp(-t[: n - i] / (0.0055 if k < 3 else 0.115))
    return fade(nz * env * 0.55, 0, 0.05)


def hat(open_=False):
    dur = 0.4 if open_ else 0.09
    n = int(dur * SR)
    t = tarr(n)
    y = metal(n) * 0.35 + rng.standard_normal(n) * 0.5
    y = hp(bp(y, 5500, 15000), 7000)
    return fade(y * np.exp(-t / (0.13 if open_ else 0.02)), 0.0005, 0.01)


def shaker():
    n = int(0.08 * SR)
    t = tarr(n)
    y = hp(rng.standard_normal(n), 6000)
    return fade(y * (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.022), 0, 0.01)


def snare():
    n = int(0.3 * SR)
    t = tarr(n)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.045) * 0.5 + np.sin(2 * np.pi * 335 * t) * np.exp(-t / 0.025) * 0.2
    nz = bp(rng.standard_normal(n), 1800, 9500) * np.exp(-t / 0.10) * 0.75
    return fade(np.tanh(1.2 * (tone + nz)), 0, 0.02)


def crash(dur=3.0):
    n = int(dur * SR)
    t = tarr(n)
    out = []
    for _ in range(2):
        y = hp(rng.standard_normal(n) * 0.8 + metal(n) * 0.25, 3800)
        y = y * np.exp(-t / 0.85) * (1 - np.exp(-t / 0.0015))
        out.append(lp(y, 13000))
    return fade(np.stack(out, 1), 0, 0.3)


def bass_note(f, dur):
    n = int(dur * SR)
    t = tarr(n)
    sub = np.sin(2 * np.pi * f * t)
    grit = lp(saw(f, n, 0.0), 900) * 0.7
    env = np.minimum(1, t / 0.004) * np.exp(-t / 0.4)
    return fade((sub * 0.6 + grit) * env, 0.001, 0.03)


def supersaw(f, n, voices=7, cents=13.0):
    out = np.zeros((n, 2))
    for v in range(voices):
        k = (v - (voices - 1) / 2) / ((voices - 1) / 2)
        out += pan(saw(f * 2 ** (k * cents / 1200), n, rng.random()), k * 0.85)
    return out / voices


def pad_chord(notes, dur, cutoff, attack=0.12, release=0.5):
    n = int((dur + release) * SR)
    t = tarr(n)
    y = sum(supersaw(midi(m), n) for m in notes) / len(notes)
    y = lp(y, cutoff, 2)
    env = np.minimum(1, t / attack)
    rel_i = int(dur * SR)
    env[rel_i:] *= np.exp(-(t[rel_i:] - dur) / (release / 4))
    return y * env[:, None]


def pluck(f, dur=0.45, bright=1.0):
    n = int(dur * SR)
    t = tarr(n)
    y = np.zeros(n)
    K = int(min(18, (SR / 2 * 0.85) / f))
    for k in range(1, K + 1):
        y += (1 / k) * np.sin(2 * np.pi * f * k * t + rng.random() * 0.2) * np.exp(-t * (7 + (3.2 / bright) * k))
    y *= 1 - np.exp(-t / 0.0015)
    return fade(y / 1.6, 0, 0.02)


def bell(f, dur=1.8):
    n = int(dur * SR)
    t = tarr(n)
    idx = 2.0 * np.exp(-t / 0.22)
    y = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t))
    y += 0.25 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.3)
    return fade(y * np.exp(-t / 0.6) * (1 - np.exp(-t / 0.0008)), 0, 0.05)


# ---------------------------------------------------------------- harmony
CHORDS = {  # (bass midi, pad voicing) - smooth voice leading around A3..F#4
    "Dmaj9": (38, [57, 61, 64, 66]),
    "Bm9": (35, [57, 61, 62, 66]),
    "Gmaj9": (31, [57, 59, 62, 66]),
    "Asus": (33, [57, 59, 64, 66]),
    "A": (33, [57, 61, 64, 69]),
}
# (start_beat, end_beat, chord, pad cutoff Hz)
PROGRESSION = [
    (0, 3, "Dmaj9", 3000),
    (3, 7, "Bm9", 2200), (7, 11, "Gmaj9", 2200), (11, 15, "Dmaj9", 2400),
    (15, 19, "Asus", 2600), (19, 23, "Bm9", 2700), (23, 25, "Gmaj9", 2800),
    (25, 26, "Gmaj9", 2000), (26, 27, "A", 3200),
    (27, 31, "Dmaj9", 4800), (31, 35, "Bm9", 4800), (35, 37, "Gmaj9", 5000), (37, 39, "A", 5200),
    (39, 43.5, "Dmaj9", 3800),
]


def chord_at(b):
    for s, e, c, _ in PROGRESSION:
        if s <= b < e:
            return c
    return "Dmaj9"


# ---------------------------------------------------------------- the score
def compose():
    drums = np.zeros((N, 2))
    bass = np.zeros((N, 2))
    pads = np.zeros((N, 2))
    keys = np.zeros((N, 2))   # arp, stabs, bells
    fx = np.zeros((N, 2))     # crashes / rolls (not pumped)
    rev_send = np.zeros((N, 2))
    dly_send = np.zeros((N, 2))
    kick_times = []

    K, C, CH, OH, SH, SN = kick(), clap(), hat(), hat(True), shaker(), snare()
    VERSE = [b for b in range(3, 25)]
    CHORUS = [b for b in range(27, 39)]

    # --- hook: pickup hit on "Достар!" (beat 0), filtered 16th hats crescendo into beat 3
    place(fx, crash(3.2), bt(0), 0.22)
    place(drums, K, bt(0), 0.9)
    kick_times.append(bt(0))
    for i, b in enumerate(np.arange(1.0, 3.0, 0.25)):
        g = 0.03 + 0.10 * (i / 8) ** 1.6
        place(drums, pan(CH, 0.3 * (-1) ** i), bt(b), g)
    place(bass, bass_note(midi(26), 2.0), bt(0), 0.55)
    for j, m in enumerate([74, 78, 81, 85, 81, 78]):
        x = pan(pluck(midi(m), 0.5, 1.4), 0.4 * (-1) ** j)
        place(keys, x, bt(1 + j * 0.333), 0.07)
        place(dly_send, x, bt(1 + j * 0.333), 0.05)

    # --- grooves
    for b in VERSE + CHORUS:
        place(drums, K, bt(b), 0.5)
        kick_times.append(bt(b))
        if (b - 3) % 4 in (1, 3):        # beats 2 and 4 of the bar
            place(drums, C, bt(b), 0.36)
            place(rev_send, C, bt(b), 0.25)
        if b in CHORUS:
            place(drums, pan(OH, 0.15), bt(b + 0.5), 0.13)
        else:
            place(drums, pan(CH, 0.15), bt(b + 0.5), 0.14)
            place(drums, pan(CH, -0.2), bt(b + 0.75), 0.05)
        if b >= 15:                        # shaker 16ths from verse B on
            for j, v in enumerate([0.5, 0.25, 0.85, 0.3]):
                place(drums, pan(SH, 0.45), bt(b + j * 0.25), 0.07 * v * (1.25 if b in CHORUS else 1))
        # bass: off-beat 8ths, octave pickups in the chorus
        root = CHORDS[chord_at(b)][0]
        place(bass, bass_note(midi(root), 0.22), bt(b + 0.5), 0.42)
        if b in CHORUS and (b - 3) % 2 == 1:
            place(bass, bass_note(midi(root + 12), 0.1), bt(b + 0.75), 0.22)

    # --- break (beats 25-27): drums out, snare roll building, picture slows
    roll = [25 + i * 0.5 for i in range(2)] + [26 + i * 0.25 for i in range(2)] + [26.5 + i * 0.125 for i in range(4)]
    for i, b in enumerate(roll):
        g = 0.07 + 0.22 * (i / len(roll)) ** 1.5
        place(fx, lp(SN, 2500 + 9000 * i / len(roll)), bt(b), g)
        place(rev_send, SN, bt(b), g * 0.5)
    place(bass, bass_note(midi(31), 0.9), bt(25), 0.4)

    # --- drop on "21-ші қараша" (beat 27)
    place(fx, crash(3.0), bt(27), 0.26)

    # --- fill into the end (beats 37-39)
    for i, b in enumerate([37.5, 37.75, 38, 38.25, 38.5, 38.625, 38.75, 38.875]):
        place(fx, SN, bt(b), 0.06 + 0.14 * i / 8)

    # --- end hit (beat 39): no drums after it, the chord rings out
    place(fx, crash(3.5), bt(39), 0.24)
    place(drums, K, bt(39), 0.9)
    kick_times.append(bt(39))
    place(bass, bass_note(midi(26), 2.6), bt(39), 0.6)

    # --- pads, following the progression
    for s, e, c, cut in PROGRESSION:
        rel = 2.2 if s >= 39 else 0.35
        x = pad_chord(CHORDS[c][1], bt(e) - bt(s), cut, attack=0.05 if s in (0, 27, 39) else 0.12, release=rel)
        g = 0.44 if s == 0 else (0.38 if s >= 27 else 0.34)
        place(pads, x, bt(s), g)
        place(rev_send, x, bt(s), g * 0.35)

    # --- pluck arpeggio: verse B (quiet) and chorus
    for b16 in np.arange(15, 39, 0.25):
        c = chord_at(b16)
        tones = sorted(CHORDS[c][1]) + [CHORDS[c][1][1] + 12]
        pat = [0, 2, 1, 3, 2, 4, 3, 1]
        idx = int(round((b16 - 15) * 4)) % len(pat)
        f = midi(tones[pat[idx]] + 12)
        if 25 <= b16 < 27:
            continue
        g = (0.1 if b16 < 27 else 0.14) * (1.0 if idx % 2 == 0 else 0.7)
        x = pan(pluck(f, 0.4, 1.3), 0.35 * np.sin(b16 * 2.1))
        place(keys, x, bt(b16), g)
        place(dly_send, x, bt(b16), g * 0.6)
        place(rev_send, x, bt(b16), g * 0.4)

    # --- chorus chord stabs (syncopated, 16th positions 3, 6, 10, 14 of each bar)
    for bar in range(27, 39, 4):
        for p16 in (3, 6, 10, 14):
            b = bar + p16 / 4
            c = chord_at(b)
            x = sum(pluck(midi(m + 12), 0.35, 1.8) for m in CHORDS[c][1]) / 3
            place(keys, pan(x, 0.0), bt(b), 0.13)
            place(rev_send, x, bt(b), 0.05)

    # --- end chord: bells
    for i, m in enumerate([74, 78, 81, 85, 90]):
        x = pan(bell(midi(m), 2.5), (i - 2) * 0.3)
        place(keys, x, bt(39) + i * 0.045, 0.05)
        place(rev_send, x, bt(39) + i * 0.045, 0.08)

    # --- sidechain pump from the kick (bass, pads, keys breathe with the groove)
    pump = np.ones(N)
    for tk in kick_times:
        i = int(tk * SR)
        n = int(0.4 * SR)
        t = tarr(n)
        shape = 1 - 0.6 * np.exp(-t / 0.12) * np.minimum(1, t / 0.003 + 0.4)
        seg = pump[i:i + n]
        seg[:] = np.minimum(seg, shape[: len(seg)])
    pump = pump[:, None]

    wet = reverb(rev_send, IR_HALL, N) * 0.55 + reverb(drums * 0.08, IR_ROOM, N)
    dly = pingpong(dly_send, 0.375, fb=0.5)
    mix = drums + fx + (bass * (0.55 + 0.45 * pump)) + (pads + keys) * pump + wet + dly * 0.8
    # gentle glue + safety
    mix = hp(mix, 35, 2)
    # low shelf via a phase-coherent Linkwitz-Riley (LR4) split at 120 Hz: lows -5 dB,
    # so the harmony (pads, plucks, bass harmonics) carries on phone speakers
    lo = lp(lp(mix, 120, 2), 120, 2)
    hi = hp(hp(mix, 120, 2), 120, 2)
    mix = hi + lo * 10 ** (-5 / 20)
    mix = np.tanh(mix * 1.15) / 1.15
    # final fade so the file ends in silence exactly on the last frame
    tail = int(0.9 * SR)
    mix[-tail:] *= np.linspace(1, 0, tail)[:, None] ** 2
    return mix


# ---------------------------------------------------------------- sound design
def stft_noise(n, fc_fn, bw_oct):
    nz = rng.standard_normal(n)
    f, tt, Z = signal.stft(nz, SR, nperseg=1024, noverlap=896)
    fc = fc_fn(tt)
    lf = np.log2(np.maximum(f, 20))[:, None]
    G = np.exp(-0.5 * ((lf - np.log2(fc)[None, :]) / (bw_oct / 2)) ** 2)
    _, y = signal.istft(Z * G, SR, nperseg=1024, noverlap=896)
    return y[:n]


def whoosh(dur, peak, f0, f1, f2, bw=1.4, pan_from=-0.8, pan_to=0.8, rise=2.4):
    n = int(dur * SR)
    t = tarr(n)

    def fc(tt):
        return np.where(tt < peak, f0 * (f1 / f0) ** (np.clip(tt / peak, 0, 1) ** 1.3),
                        f1 * (f2 / f1) ** np.clip((tt - peak) / (dur - peak), 0, 1))

    y = stft_noise(n, fc, bw)
    env = np.where(t < peak, (t / peak) ** rise, np.exp(-(t - peak) / max(1e-3, dur - peak) * 4.5))
    y = y * env
    p = np.interp(t, [0, peak, dur], [pan_from, (pan_from + pan_to) / 2, pan_to])
    s = pan(y, p)
    s = s + reverb(s * 0.25, IR_ROOM, len(s))
    return fade(s / np.max(np.abs(s)), 0.005, 0.03)


def riser(dur):
    n = int(dur * SR)
    t = tarr(n)
    y = stft_noise(n, lambda tt: 250 * (9000 / 250) ** np.clip(tt / dur, 0, 1) ** 1.6, 1.1)
    tone = sum(np.sin(2 * np.pi * np.cumsum(f0 * 2 ** (2.2 * (t / dur) ** 1.5)) / SR) for f0 in (220, 330))
    y = y / np.max(np.abs(y)) + 0.12 * tone
    y *= (t / dur) ** 2.2
    s = np.stack([y, np.roll(y, 240)], 1)
    s = s + reverb(s * 0.3, IR_HALL, len(s))
    s[-int(0.004 * SR):] *= np.linspace(1, 0, int(0.004 * SR))[:, None]
    return s / np.max(np.abs(s))


def impact(dur, sub_from, sub_to, sub_decay, crack, wet):
    n = int(dur * SR)
    t = tarr(n)
    f = sub_to + (sub_from - sub_to) * np.exp(-t / 0.12)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / sub_decay)
    thump = lp(rng.standard_normal(n), 160, 2) * np.exp(-t / 0.05) * 2.2
    body = bp(rng.standard_normal(n), 250, 1600) * np.exp(-t / 0.07) * 0.5
    crk = hp(rng.standard_normal(n), 2500) * np.exp(-t / 0.01) * crack
    y = np.tanh(1.5 * (sub + thump + body + crk))
    s = st(y) + reverb(st(body + crk) * wet, IR_HALL, n)
    return fade(s / np.max(np.abs(s)), 0.0005, 0.2)


def swell_in(dur):
    c = crash(dur + 0.2)[: int(dur * SR)][::-1]
    w = whoosh(dur, dur * 0.97, 300, 5000, 5000, 1.6, 0.6, -0.2, rise=2.0)
    s = c / np.max(np.abs(c)) * 0.7 + w * 0.6
    s[-int(0.003 * SR):] *= np.linspace(1, 0, int(0.003 * SR))[:, None]
    return s / np.max(np.abs(s))


def sparkle():
    s = np.zeros((int(2.6 * SR), 2))
    notes = [81, 85, 88, 90, 93, 97]
    for i, m in enumerate(notes):
        place(s, pan(bell(midi(m), 1.6), -0.6 + 1.2 * i / (len(notes) - 1)), i * 0.055, 1.0 - i * 0.08)
    shimmer = hp(rng.standard_normal(len(s)), 7000) * np.exp(-tarr(len(s)) / 0.35) * 0.08
    s += st(shimmer)
    s = s + reverb(s * 0.5, IR_HALL, len(s))
    return fade(s / np.max(np.abs(s)), 0.001, 0.4)


def tick():
    n = int(0.12 * SR)
    t = tarr(n)
    f = 700 + 900 * np.exp(-t / 0.006)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.018)
    y += hp(rng.standard_normal(n), 4000) * np.exp(-t / 0.002) * 0.3
    s = st(y) + reverb(st(y) * 0.2, IR_ROOM, n)
    return fade(s / np.max(np.abs(s)), 0, 0.02)


# ---------------------------------------------------------------- levels
def speech_regions():
    regs = []
    for p in TL["pieces"]:
        if p["kind"] == "speech":
            regs.append((ft(p["onsetFrame"]), ft(p["from"] + p["durationInFrames"])))
    return regs


def duck_curve(regs, duck_db, attack=0.08, release=0.30, bridge=0.36):
    """Smooth gain curve: duck_db under speech, 0 dB elsewhere. Pauses shorter than
    `bridge` stay ducked so the bed does not pump between words."""
    merged = []
    for a, b in regs:
        if merged and a - merged[-1][1] < bridge:
            merged[-1] = (merged[-1][0], b)
        else:
            merged.append((a, b))
    target = np.zeros(N)
    for a, b in merged:
        target[int(max(0, a - 0.06) * SR):int(b * SR)] = 1.0
    # one-pole smoothing with separate attack/release
    g = np.zeros(N)
    ka, kr = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR))
    # vectorised in blocks (signal.lfilter per segment of constant direction is overkill; loop at 1 kHz)
    step = SR // 1000
    tt = target[::step]
    gg = np.zeros_like(tt)
    ka1, kr1 = ka ** step, kr ** step
    for i in range(1, len(tt)):
        k = ka1 if tt[i] > gg[i - 1] else kr1
        gg[i] = tt[i] + (gg[i - 1] - tt[i]) * k
    g = np.interp(np.arange(N), np.arange(len(tt)) * step, gg)
    return 10 ** (duck_db * g / 20), merged


def main():
    meter = pyln.Meter(SR)
    voice, vsr = sf.read(os.path.join(ROOT, "remotion", "public", "media", "voice.wav"), dtype="float64")
    assert vsr == SR, vsr
    v_lufs = meter.integrated_loudness(voice)
    v_peak = 20 * np.log10(np.max(np.abs(voice)))

    music = compose()
    m_lufs = meter.integrated_loudness(music)
    # bed sits 9 LU under the voice; under speech it ducks a further 8.5 dB (~ -17.5 LU)
    music *= 10 ** ((v_lufs - 9.0 - m_lufs) / 20)
    gain, merged = duck_curve(speech_regions(), -8.5)
    music *= gain[:, None]
    peak = np.max(np.abs(music))
    if peak > 0.98:
        music *= 0.98 / peak
    sf.write(os.path.join(OUT_DIR, "music.wav"), music.astype(np.float32), SR, subtype="PCM_24")

    # SFX: sample peak set relative to the voice LOUDNESS (LUFS), not its peak (a single
    # plosive would otherwise move every effect). Hits that land on speech are kept lower.
    def write(name, x, rel_lu):
        x = x * 10 ** ((v_lufs + rel_lu) / 20) / np.max(np.abs(x))
        sf.write(os.path.join(SFX_DIR, name), x.astype(np.float32), SR, subtype="PCM_24")

    write("swell_in.wav", swell_in(0.30), +9.4)
    write("impact_hook.wav", impact(1.8, 80, 34, 0.45, 0.6, 0.35), +12.4)   # lands on "Достар!"
    write("impact_drop.wav", impact(2.6, 95, 30, 0.75, 0.8, 0.45), +15.4)   # lands on "21-ші"
    write("impact_end.wav", impact(3.0, 85, 30, 0.9, 0.5, 0.6), +15.4)      # no speech under it
    write("whoosh_push.wav", whoosh(0.55, 0.30, 350, 4200, 1200, 1.3, -0.5, 0.5), +8.4)
    write("whoosh_whip.wav", whoosh(0.45, 0.30, 600, 6500, 2500, 1.1, -0.9, 0.9, rise=3.0), +8.4)
    write("whoosh_pull.wav", whoosh(0.70, 0.30, 2600, 1800, 300, 1.6, 0.6, -0.6, rise=2.0), +7.4)
    write("riser.wav", riser(1.25), +7.4)
    write("sparkle.wav", sparkle(), +6.4)
    write("tick.wav", tick(), -0.6)

    print(f"voice  {v_lufs:6.1f} LUFS, peak {v_peak:5.1f} dBFS")
    print(f"music  raw {m_lufs:6.1f} LUFS -> bed {v_lufs - 9:5.1f} LUFS, under speech ~{v_lufs - 17.5:5.1f}")
    print(f"ducked regions: {[(round(a, 2), round(b, 2)) for a, b in merged]}")
    print(f"music.wav {N / SR:.2f} s, peak {20 * np.log10(np.max(np.abs(music))):.1f} dBFS")


if __name__ == "__main__":
    main()
