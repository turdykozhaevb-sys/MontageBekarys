import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import tl from './timeline.json';
import {Cap, C, FONT, Snow, Subtitle, WhatsApp, usePop, useFonts, useT, PRIZES} from './Main';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Corner frame that draws itself in and pulses gently
const Frame: React.FC = () => {
  const {t, f} = useT();
  const p = interpolate(t, [0.2, 1.1], [0, 1], clamp);
  const pulse = 0.6 + 0.4 * Math.sin(f / 12);
  const L = 150, T = 8, M = 46;
  const corner = (x: number, y: number, sx: number, sy: number, k: number) => (
    <g key={`${x}${y}`} transform={`translate(${x} ${y}) scale(${sx} ${sy})`} opacity={k}>
      <path d={`M0 ${L * (1 - k)} V0 H${L * (1 - k)}`} stroke={C.gold} strokeWidth={T} fill="none" strokeLinecap="round" />
    </g>
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: p * pulse}}>
        {corner(M, M, 1, 1, p)}
        {corner(1080 - M, M, -1, 1, p)}
        {corner(M, 1920 - M, 1, -1, p)}
        {corner(1080 - M, 1920 - M, -1, -1, p)}
      </svg>
    </AbsoluteFill>
  );
};

// Progress bar at the very top
const Progress: React.FC = () => {
  const {t} = useT();
  return (
    <div style={{position: 'absolute', top: 0, left: 0, height: 10, width: `${(t / tl.duration) * 100}%`, background: `linear-gradient(90deg, ${C.teal}, ${C.gold})`}} />
  );
};

// Dark gradient under the subtitles so the text stays readable over bright footage
const Shade: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 62%, rgba(0,0,0,.7) 100%)', pointerEvents: 'none'}} />
);

// Gold pill that pops in at a given time and leaves before the next one
const Pill: React.FC<{t0: number; t1: number; y: number; text: string; bg?: string; color?: string}> = ({t0, t1, y, text, bg = C.gold, color = C.navy}) => {
  const {t} = useT();
  if (t < t0 || t >= t1) return null;
  const p = usePop(t0, {damping: 11, stiffness: 160, mass: 0.6});
  const out = interpolate(t, [t1 - 0.2, t1], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: Math.min(p, out), transform: `scale(${0.7 + 0.3 * p})`}}>
      <div style={{background: bg, color, fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 6, padding: '14px 50px', borderRadius: 999, boxShadow: '0 16px 50px rgba(0,0,0,.45)'}}>{text}</div>
    </div>
  );
};

// Sweep line that crosses the frame at each scene start
const Sweep: React.FC<{at: number}> = ({at}) => {
  const {t} = useT();
  const k = interpolate(t, [at, at + 0.5], [0, 1], clamp);
  if (k <= 0 || k >= 1) return null;
  const x = interpolate(k, [0, 1], [-20, 120]);
  return (
    <div style={{position: 'absolute', top: 0, bottom: 0, left: `${x}%`, width: 6, background: C.teal, boxShadow: `0 0 60px 20px rgba(25,211,190,.45)`, opacity: 1 - k * 0.4}} />
  );
};

// Final call-to-action band
const Cta: React.FC = () => {
  const {t, f} = useT();
  const s0 = 36.65;
  if (t < s0) return null;
  const band = usePop(s0, {damping: 14, stiffness: 140, mass: 0.8});
  const bp = usePop(36.8, {damping: 9, stiffness: 130, mass: 0.8});
  const kp = usePop(38.1, {damping: 7, stiffness: 200, mass: 0.6});
  const pulse = 1 + Math.sin((t - s0) * 7) * 0.045;
  const ring = ((t - s0) * 1.1) % 1;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 880, background: 'linear-gradient(180deg, rgba(7,27,51,0), rgba(7,27,51,.92) 35%)', transform: `translateY(${(1 - band) * 300}px)`, opacity: band}} />
      <div style={{position: 'absolute', top: 360, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{position: 'relative', width: 300, height: 300, transform: `scale(${bp * pulse})`}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: '8px solid #25D366', transform: `scale(${1 + ring * 0.9})`, opacity: 1 - ring}} />
          <WhatsApp size={300} />
        </div>
      </div>
      <div style={{position: 'absolute', top: 730, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${kp}) rotate(${-4 * kp}deg)`, opacity: Math.min(1, kp * 2)}}>
        <div style={{background: C.gold, color: C.navy, fontFamily: FONT, fontWeight: 800, fontSize: 110, letterSpacing: 6, padding: '12px 64px', borderRadius: 26, boxShadow: '0 24px 70px rgba(0,0,0,.55)'}}>«ПРОТЕЗ»</div>
      </div>
      {f >= 0 && <Snow count={24} />}
    </AbsoluteFill>
  );
};

export const Clip: React.FC = () => {
  useFonts();
  const {t} = useT();
  const cap = (tl.captions as Cap[]).find((c) => t >= c.t[0] && t < c.t[1]);
  const prize = PRIZES.find((p) => t >= p.t0 && t < p.t1);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <OffthreadVideo src={staticFile('clip_clean.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <Shade />
      <Frame />
      <Progress />
      {tl.scenes.slice(1).map((s) => <Sweep key={s.id} at={s.start} />)}
      <Pill t0={4.5} t1={8.4} y={210} text="ПРОТЕЗ" />
      <Pill t0={21.9} t1={27.0} y={210} text="ЖАҢА ЖЫЛДЫҚ АКЦИЯ" />
      <Pill t0={27.05} t1={36.6} y={210} text="ЖҮЛДЕЛЕР" />
      {prize && <Pill key={prize.n} t0={prize.t0} t1={prize.t1} y={330} text={`${prize.n}. ${prize.big}`} bg="rgba(7,27,51,.85)" color={C.white} />}
      <Cta />
      {cap && <Subtitle key={cap.text + cap.t[0]} cap={cap} />}
      <Audio src={staticFile('voice.mp3')} />
    </AbsoluteFill>
  );
};
