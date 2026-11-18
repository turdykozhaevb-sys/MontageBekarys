"""Original 120 BPM music bed + SFX, composed to the edit's cut grid.
Writes public/music.wav and public/sfx.wav (48 kHz stereo)."""
import numpy as np, wave, sys
SR = 48000; BPM = 120; BEAT = 60 / BPM; DUR = 18.0
N = int(SR * DUR); rng = np.random.default_rng(7)
CUTS = [2.5, 6.0, 8.5, 12.0]          # hard cuts (all on beats)
POPS = [c + 0.25 for c in CUTS]        # step-number reveals (8th after cut)
BRAND = 15.75; QMARK = 2.0
t_all = np.arange(N) / SR

def W(): return np.zeros((N, 2))
def add(buf, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR); sig = sig[: max(0, N - i)]
    if sig.ndim == 1: sig = np.stack([sig * (1 - pan) ** .5, sig * (1 + pan) ** .5], 1) / 2 ** .5 * 2 ** .5 / 1.0
    buf[i:i + len(sig)] += sig * gain
def env(n, a, d, s=0.0, curve=4.0):
    t = np.arange(n) / SR; e = np.minimum(t / max(a, 1e-4), 1.0)
    return e * (s + (1 - s) * np.exp(-curve * np.maximum(t - a, 0) / max(d, 1e-4)))
def note(m): return 440 * 2 ** ((m - 69) / 12)
def lp(x, fc):  # one-pole lowpass (array or scalar cutoff)
    fc = np.broadcast_to(fc, x.shape[:1]); a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); z = 0.0 if x.ndim == 1 else np.zeros(x.shape[1])
    for i in range(len(x)): z = (1 - a[i]) * x[i] + a[i] * z; y[i] = z
    return y
def hp(x, fc): return x - lp(x, fc)
def reverb(x, secs=2.2, mix=0.25, damp=3000):
    n = int(secs * SR); ir = rng.standard_normal((n, 2)) * np.exp(-6.9 * np.arange(n) / n)[:, None]
    ir[:, 0] = lp(ir[:, 0], damp); ir[:, 1] = lp(ir[:, 1], damp); ir /= np.abs(ir).sum(0) ** .5 * 6
    L = len(x) + n; F = 1 << (L - 1).bit_length()
    wet = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], F) * np.fft.rfft(ir[:, c], F), F)[:len(x)] for c in range(2)], 1)
    return x * (1 - mix) + wet * mix

# ---------------- MUSIC ----------------
# Am - F - C - G, one chord per bar (2 s)
PROG = [[57, 60, 64], [53, 57, 60], [48, 55, 60, 64], [55, 59, 62]]
BASS = [45, 41, 36, 43]
pad, pluck, bass, drums = W(), W(), W(), W()
bars = int(DUR / (4 * BEAT)) + 1
for b in range(bars):
    t0 = b * 4 * BEAT; ch = PROG[b % 4]
    n = int(4 * BEAT * SR + SR * .6); tt = np.arange(n) / SR
    p = sum(np.sin(2 * np.pi * note(m) * tt * (1 + d)) for m in ch for d in (-0.003, 0.003)) / len(ch)
    add(pad, np.stack([p, np.roll(p, 240)], 1) * env(n, 0.5, 2.5, 0.6)[:, None] * 0.18, t0)
    # 8th-note pluck arpeggio
    arp = ch + [ch[0] + 12]
    for k in range(8):
        m = arp[[0, 2, 1, 3, 2, 1, 3, 2][k]] + 12; nn = int(.45 * SR); tt2 = np.arange(nn) / SR
        s = (np.sin(2 * np.pi * note(m) * tt2) + .35 * np.sin(4 * np.pi * note(m) * tt2) + .12 * np.sin(6 * np.pi * note(m) * tt2)) * env(nn, .003, .12)
        add(pluck, s * .16, t0 + k * BEAT / 2, pan=(-.35 if k % 2 else .35))
    # sub bass: root on beats 1 and 3 + octave pickup
    for k, (off, mm) in enumerate([(0, 0), (2, 0), (3.5, 12)]):
        nn = int(.9 * SR); tt2 = np.arange(nn) / SR; f = note(BASS[b % 4] - 12 + mm)
        s = np.tanh(1.5 * np.sin(2 * np.pi * f * tt2)) * env(nn, .008, .5, .3)
        add(bass, s * .32, t0 + off * BEAT)
def kick():
    n = int(.4 * SR); tt = np.arange(n) / SR; f = 45 + 110 * np.exp(-tt * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .25) + rng.standard_normal(n) * env(n, .0005, .006) * .2
def clap():
    n = int(.35 * SR); s = hp(rng.standard_normal(n), 900)
    e = sum(env(n, .001, .012) * (np.arange(n) >= int(d * SR)) for d in (0, .011, .022)) * .6 + env(n, .002, .18) * .5
    return s * e
def hat(open_=False):
    n = int((.25 if open_ else .06) * SR); return hp(rng.standard_normal(n), 7000) * env(n, .001, .15 if open_ else .025)
DROP = CUTS[0]
for b in range(bars):
    for k in range(8):
        t = b * 4 * BEAT + k * BEAT / 2
        if t < DROP or t >= 17.0: continue
        if k % 2 == 0: add(drums, kick() * .55, t)
        if k in (2, 6): add(drums, clap() * .22, t, pan=.1)
        add(drums, hat(k % 2 == 1) * (.10 if k % 2 else .06), t, pan=-.3)
# intro: filter sweep opening up over the hook, full band from the first cut
cut_env = np.clip((t_all - 0.0) / DROP, 0, 1) ** 2
pluck = np.stack([lp(pluck[:, c], 600 + 9000 * cut_env) for c in range(2)], 1)
pad = np.stack([lp(pad[:, c], 900 + 6000 * cut_env) for c in range(2)], 1)
bass *= (t_all >= DROP - 0.02)[:, None]
music = reverb(pad + pluck * 1.0, 2.6, .3) + bass + reverb(drums, 1.2, .12)
# outro: band stops on beat 17.0, final Am chord rings out
n = int(1.5 * SR); tt = np.arange(n) / SR
fin = sum(np.sin(2 * np.pi * note(m) * tt) + .3 * np.sin(4 * np.pi * note(m) * tt) for m in [45, 57, 60, 64, 69]) / 5 * env(n, .005, 1.2)
gate = np.ones(N); gate[int(17.0 * SR):] = 0; a_, b_ = int(16.9 * SR), int(17.0 * SR); gate[a_:b_] = np.linspace(1, 0, b_ - a_)
music = music * gate[:, None]
fin_st = W(); add(fin_st, np.stack([fin, fin], 1) * .3, 17.0); music += reverb(fin_st, 2.5, .45)
# master fade to 18.0
music *= np.clip((DUR - t_all) / 0.6, 0, 1)[:, None]

# ---------------- SFX ----------------
sfx = W()
def whoosh(length=0.55, hi=6000):
    n = int(length * SR); tt = np.arange(n) / SR; x = rng.standard_normal(n)
    sweep = 300 + hi * (tt / length) ** 2; y = lp(x, sweep); y = hp(y, 150)
    e = (tt / length) ** 2.2 * np.exp(-((tt - length) ** 2) / .002) + (tt / length) ** 3
    y = y * e / np.abs(y * e).max(); return np.stack([y * np.linspace(1.2, .6, n), y * np.linspace(.6, 1.2, n)], 1)
def impact():
    n = int(1.2 * SR); tt = np.arange(n) / SR; f = 38 + 60 * np.exp(-tt * 12)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .003, .9) + lp(rng.standard_normal(n), 900) * env(n, .002, .25) * .5
    return np.stack([s, s], 1)
def tick(f=2200):
    n = int(.12 * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) * .6 + np.sin(2 * np.pi * f * 1.5 * tt) * .25) * env(n, .001, .03) + hp(rng.standard_normal(n), 4000) * env(n, .0005, .004) * .3
    return np.stack([s, s], 1)
def pop():
    n = int(.25 * SR); tt = np.arange(n) / SR; f = 900 * np.exp(-tt * 18) + 180
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .08); return np.stack([s, s], 1)
def riser(length):
    n = int(length * SR); tt = np.arange(n) / SR; x = lp(rng.standard_normal(n), 400 + 7000 * (tt / length) ** 2)
    y = x * (tt / length) ** 3; y /= np.abs(y).max(); return np.stack([y, y], 1)
def shimmer():
    n = int(2.0 * SR); tt = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * note(m) * tt) * env(n, .004, .9 + .2 * i) for i, m in enumerate([81, 84, 88, 93])) / 4
    return np.stack([s, np.roll(s, 300)], 1)
add(sfx, riser(DROP - 0.4) * .16, 0.4)                        # hook build into first cut
add(sfx, impact() * .55, DROP)                                # downbeat hit on first step
for c in CUTS: add(sfx, whoosh() * .22, c - 0.5)              # whoosh peaks exactly on each cut
for p in POPS: add(sfx, tick() * .18, p)                      # number reveal
add(sfx, pop() * .3, QMARK)                                   # "?" pop
for w in [0.0, 0.66, 1.42, 1.88]: add(sfx, tick(3200) * .07, w + .02)   # hook word reveals
add(sfx, shimmer() * .22, BRAND)                              # brand reveal
sfx = reverb(sfx, 1.0, .15)

def write(path, x):
    x = x / max(1.0, np.abs(x).max() / 0.95); d = (x * 32767).astype(np.int16)
    w = wave.open(path, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
write(sys.argv[1] + '/music.wav', music); write(sys.argv[1] + '/sfx.wav', sfx)
print('ok')
