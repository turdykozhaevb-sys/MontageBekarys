"""Procedural dynamic music bed for IMG_9110 (numpy only, no samples).
House groove in A minor; bar grid aligned so bar 7 lands on the date reveal (13.39 s).
Usage: python3 music_synth.py out.wav [duration]
"""
import sys, wave
import numpy as np

SR = 48000
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 19.6
BAR = 13.39 / 7          # bar length so that the downbeat of bar 7 hits the date reveal
BEAT = BAR / 4
N = int(DUR * SR)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def env(n, a, d):
    """attack (s) + exponential decay time-constant d (s)"""
    t = np.arange(n) / SR
    e = np.exp(-t / d)
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e

def lp(x, fc):  # zero-phase FFT low-pass with soft knee
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))

def hp(x, fc):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (fc / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(X, len(x))

def place(buf, sig, t, gain=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain

def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for d in (-detune, 0, detune):
        ph = (t * freq * (1 + d)) % 1.0
        out += 2 * ph - 1
    return out / 3

# ---- one-shot sounds
def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 48 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env(n, 0.001, 0.16) + 0.25 * np.sin(ph * 2) * env(n, 0.0005, 0.01)

def snare():
    n = int(0.3 * SR); t = np.arange(n) / SR
    noise = hp(rng.standard_normal(n), 1500) * env(n, 0.001, 0.07)
    body = np.sin(2 * np.pi * 190 * t) * env(n, 0.001, 0.05)
    return 0.55 * noise + 0.5 * body

def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR)
    return hp(rng.standard_normal(n), 7000) * env(n, 0.0005, 0.09 if open_ else 0.018)

def crash():
    n = int(2.2 * SR)
    return hp(rng.standard_normal(n), 4000) * env(n, 0.002, 0.6)

def stab(freqs, length):
    n = int(length * SR)
    s = sum(saw(f, n, 0.006) for f in freqs) / len(freqs)
    return lp(s, 2600) * env(n, 0.004, 0.11)

def bass_note(freq, length):
    n = int(length * SR); t = np.arange(n) / SR
    s = 0.7 * np.sin(2 * np.pi * freq * t) + 0.3 * saw(freq, n)
    return lp(s, 700) * env(n, 0.003, 0.12)

def pad(freqs, length):
    n = int(length * SR)
    s = sum(saw(f, n, 0.01) for f in freqs) / len(freqs)
    e = np.minimum(1, np.arange(n) / (0.3 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.4 * SR))
    return lp(s, 1100) * e

# A minor: Am - F - C - G
CH = [(220.0, 261.63, 329.63), (174.61, 220.0, 261.63), (196.0, 261.63, 329.63), (196.0, 246.94, 293.66)]
BS = [55.0, 43.65, 65.41, 49.0]

drums = np.zeros(N); bass = np.zeros(N); keys = np.zeros(N); fx = np.zeros(N)
K, S, H, HO = kick(), snare(), hat(), hat(True)
nbars = int(np.ceil(DUR / BAR)) + 1
for b in range(nbars):
    t0 = b * BAR
    ch, bn = CH[b % 4], BS[b % 4]
    intro = b == 0
    for q in range(4):
        tb = t0 + q * BEAT
        if not intro: place(drums, K, tb, 1.0)
        if q in (1, 3) and not intro: place(drums, S, tb, 0.55)
        place(drums, HO if not intro else H, tb + BEAT / 2, 0.35)
        for s16 in (0, 1, 3):
            place(drums, H, tb + s16 * BEAT / 4, 0.18 if intro else 0.22)
        place(bass, bass_note(bn, BEAT * 0.45), tb + BEAT / 2, 1.0)
        if not intro: place(bass, bass_note(bn, BEAT * 0.2), tb + BEAT * 0.75, 0.6)
    # syncopated chord stabs
    for off in (0, 0.75, 1.5, 2.5, 3.25):
        place(keys, stab(ch, BEAT * 0.5), t0 + off * BEAT, 0.5)
    place(keys, pad([f / 2 for f in ch], BAR), t0, 0.25)
    # snare roll into the date reveal (bar 6 -> 7)
    if b == 6:
        for k in range(8):
            place(drums, S, t0 + 2 * BEAT + k * BEAT / 4, 0.2 + 0.05 * k)

# riser into 13.39 + impacts at 0 and 13.39
rl = 2 * BEAT; n = int(rl * SR)
riser = hp(rng.standard_normal(n), 2500) * np.linspace(0, 1, n) ** 2
place(fx, riser, 13.39 - rl, 0.35)
place(fx, crash(), 0.0, 0.35)
place(fx, crash(), 13.39, 0.45)
place(drums, K, 13.39, 0.6)

mix = 0.9 * drums + 0.8 * bass + 0.55 * keys + fx
# end: fade out last 0.6 s
fo = int(0.6 * SR); mix[-fo:] *= np.linspace(1, 0, fo)
mix = np.tanh(mix * 0.9)
mix /= np.max(np.abs(mix)) + 1e-9
# subtle stereo: keys/hats widened via short delay
L = mix; R = np.concatenate([np.zeros(int(0.008 * SR)), mix])[:N] * 0.35 + mix * 0.65
st = np.stack([L, R], 1) * 0.89
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print('ok', DUR, 'bpm', round(60 / BEAT, 2))
