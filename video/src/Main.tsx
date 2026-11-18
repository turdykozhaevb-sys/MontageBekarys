import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig, delayRender, continueRender, Easing} from 'remotion';
import tl from './timeline.json';

const C = {navy: '#071B33', navy2: '#0D2F55', teal: '#19D3BE', gold: '#FFC93C', white: '#FFFFFF', red: '#F14635', green: '#22C55E', wa: '#25D366'};
const BLACK_BG = true;
const FONT = 'Inter, "Noto Sans", sans-serif';

// ---------- fonts ----------
const fonts = [
  ['Inter', 800, 'Inter-ExtraBold.otf'],
  ['Inter', 700, 'Inter-Bold.otf'],
  ['Inter', 500, 'Inter-Medium.otf'],
] as const;
const useFonts = () => {
  const [h] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => {
    Promise.all(
      fonts.map(([fam, w, file]) => {
        const f = new FontFace(fam, `url(${staticFile(file)})`, {weight: String(w)});
        return f.load().then((l) => document.fonts.add(l));
      }),
    )
      .catch(() => {})
      .finally(() => continueRender(h));
  }, [h]);
};

// ---------- helpers ----------
const useT = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {t: f / fps, f, fps};
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
/** spring that starts at absolute second t0 */
const usePop = (t0: number, cfg = {damping: 13, stiffness: 150, mass: 0.7}) => {
  const {f, fps} = useT();
  return spring({frame: f - Math.round(t0 * fps), fps, config: cfg});
};
const inRange = (t: number, a: number, b: number) => t >= a && t < b;

// ---------- icons (inline SVG) ----------
const Tooth: React.FC<{size?: number; color?: string}> = ({size = 64, color = C.white}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path d="M18 8c-8 0-13 7-11 17 1 6 4 10 5 17 1 7 3 14 7 14 5 0 4-12 8-12s3 12 8 12c4 0 6-7 7-14 1-7 4-11 5-17 2-10-3-17-11-17-5 0-7 3-10 3S23 8 18 8Z" fill={color} />
  </svg>
);
const Coin: React.FC<{size: number; spin: number}> = ({size, spin}) => (
  <div style={{width: size, height: size, transform: `scaleX(${Math.cos(spin)})`}}>
    <svg viewBox="0 0 200 200" width={size} height={size}>
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#FFE58A" />
          <stop offset="1" stopColor="#F0A500" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="94" fill="url(#g)" stroke="#fff3c4" strokeWidth="6" />
      <circle cx="100" cy="100" r="74" fill="none" stroke="#c98200" strokeWidth="5" opacity=".55" />
      <text x="100" y="138" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize="112" fill="#8a5a00">₸</text>
    </svg>
  </div>
);
const Hourglass: React.FC<{size: number; turn: number}> = ({size, turn}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{transform: `rotate(${turn}deg)`}}>
    <path d="M22 8h56M22 92h56M28 8c0 26 20 30 22 42-2 12-22 16-22 42M72 8c0 26-20 30-22 42 2 12 22 16 22 42" stroke={C.white} strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M36 16h28c-2 14-10 18-14 24-4-6-12-10-14-24Z" fill={C.gold} />
    <path d="M40 84c2-10 6-14 10-14s8 4 10 14Z" fill={C.gold} />
  </svg>
);
const Gift: React.FC<{size: number; lid: number}> = ({size, lid}) => (
  <svg width={size} height={size} viewBox="0 0 160 160">
    <rect x="22" y="70" width="116" height="78" rx="10" fill={C.red} />
    <rect x="72" y="70" width="16" height="78" fill={C.gold} />
    <g transform={`translate(0 ${-lid * 26}) rotate(${-lid * 10} 80 62)`}>
      <rect x="14" y="48" width="132" height="26" rx="9" fill="#ff6a58" />
      <rect x="72" y="48" width="16" height="26" fill={C.gold} />
      <path d="M80 48c-26-30-52-8-28 0h28Zm0 0c26-30 52-8 28 0H80Z" fill="none" stroke={C.gold} strokeWidth="9" strokeLinejoin="round" />
    </g>
  </svg>
);
const WhatsApp: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="32" fill={C.wa} />
    <path d="M32 13.5a18.4 18.4 0 0 0-15.8 27.8L13.6 50.5l9.4-2.5A18.4 18.4 0 1 0 32 13.5Z" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinejoin="round" />
    <path d="M26 24.2c-1 .6-2.2 1.9-2 4 .3 3.6 4.6 9.4 10.4 11.4 2.2.7 4.2.3 5.2-.9.6-.7.8-1.8.2-2.3l-2.7-1.6c-.6-.3-1.3-.2-1.7.3l-.8 1c-2.4-.9-5-3.4-5.8-5.7l.9-.9c.5-.5.6-1.2.3-1.7l-1.5-2.8c-.4-.6-1.2-.9-2-.7Z" fill="#fff" />
  </svg>
);
const Check: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill={C.teal} /><path d="M13 25l8 8 15-17" stroke={C.navy} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
);

// ---------- photo with Ken Burns ----------
const Photo: React.FC<{src: string; a: number; b: number; from: number; to: number; fx?: number; fy?: number; blur?: number; dim?: number; fade?: number; pos?: string}> = ({src, a, b, from, to, fx = 0, fy = 0, blur = 0, dim = 0, fade = 0.25, pos = '50% 50%'}) => {
  const {t} = useT();
  const k = interpolate(t, [from, to], [0, 1], clamp);
  const sc = a + (b - a) * k;
  const op = interpolate(t, [from, from + fade], [0, 1], clamp);
  if (BLACK_BG) return <AbsoluteFill style={{background: '#000'}} />;
  return (
    <AbsoluteFill style={{opacity: op, overflow: 'hidden'}}>
      <Img src={staticFile(`img/${src}`)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, transform: `scale(${sc}) translate(${fx * k}px, ${fy * k}px)`, filter: `blur(${blur}px) saturate(1.1)`}} />
      {dim > 0 && <AbsoluteFill style={{background: `rgba(7,27,51,${dim})`}} />}
    </AbsoluteFill>
  );
};

// brand wash + vignette applied to every scene
const Grade: React.FC = () => (
  <>
    <AbsoluteFill style={{background: 'transparent'}} />
    <AbsoluteFill style={{boxShadow: 'none'}} />
  </>
);

// ---------- chips / cards ----------
const Chip: React.FC<{t0: number; children: React.ReactNode; icon?: React.ReactNode; y: number; side?: 'l' | 'r' | 'c'; color?: string; textColor?: string; size?: number}> = ({t0, children, icon, y, side = 'c', color = C.white, textColor = C.navy, size = 56}) => {
  const p = usePop(t0);
  const dir = side === 'l' ? -1 : side === 'r' ? 1 : 0;
  return (
    <div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: side === 'l' ? 'flex-start' : side === 'r' ? 'flex-end' : 'center', padding: '0 56px'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, background: color, color: textColor, borderRadius: 999, padding: '22px 44px 22px 28px', fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: 1, boxShadow: '0 18px 50px rgba(0,0,0,.4)', transform: `translateX(${dir * (1 - p) * 700}px) scale(${0.85 + 0.15 * p})`, opacity: Math.min(1, p * 2)}}>
        {icon}
        <span>{children}</span>
      </div>
    </div>
  );
};

// ---------- scenes ----------
const SceneHook: React.FC = () => {
  const {t, f} = useT();
  const p = usePop(0.15, {damping: 9, stiffness: 120, mass: 0.8});
  const spin = (f / 30) * 5.2;
  const q = (i: number) => {
    const s = 0.7 + i * 0.28;
    const pp = usePop(s, {damping: 8, stiffness: 160, mass: 0.6});
    return (
      <div key={i} style={{position: 'absolute', left: 150 + i * 340 - (i === 1 ? 40 : 0), top: 330 + (i % 2) * 120 + Math.sin(f / 9 + i) * 14, fontFamily: FONT, fontWeight: 800, fontSize: 150 - i * 12, color: i === 1 ? C.gold : C.white, opacity: pp * 0.95, transform: `scale(${pp}) rotate(${(i - 1) * 12}deg)`, textShadow: '0 10px 40px rgba(0,0,0,.6)'}}>?</div>
    );
  };
  const hp = usePop(1.9);
  return (
    <>
      <Photo src="chair.jpg" a={1.12} b={1.32} from={0} to={3.9} fx={-30} fy={-20} dim={0.1} fade={0.01} />
      <Grade />
      {[0, 1, 2].map(q)}
      <div style={{position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.4 + 0.6 * p}) rotate(${(1 - p) * -25}deg)`, opacity: p, filter: 'drop-shadow(0 30px 40px rgba(0,0,0,.55))'}}>
        <Coin size={360} spin={spin} />
      </div>
      <div style={{position: 'absolute', top: 900, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${hp})`, opacity: hp}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(7,27,51,.8)', border: `3px solid ${C.gold}`, borderRadius: 999, padding: '14px 40px 14px 24px'}}>
          <Hourglass size={72} turn={(t - 1.9) * 120} />
          <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 50, color: C.gold, letterSpacing: 3}}>ЕРТЕҢГЕ ҚАЛДЫРМА</span>
        </div>
      </div>
    </>
  );
};

const SceneNeed: React.FC = () => {
  const {t} = useT();
  const s0 = 3.82, s1 = 8.62;
  const scan = interpolate((t - s0) % 2.4, [0, 2.4], [-10, 110]);
  return (
    <>
      <Photo src="xray.jpg" a={1.05} b={1.2} from={s0} to={s1} fx={-40} dim={0.28} pos="50% 50%" />
      <Grade />
      <AbsoluteFill style={{background: `linear-gradient(90deg, transparent ${scan - 7}%, rgba(25,211,190,.55) ${scan}%, transparent ${scan + 0.5}%)`, mixBlendMode: 'screen'}} />
      <Chip t0={4.5} y={330} side="l" icon={<Tooth size={64} color={C.teal} />}>ПРОТЕЗ ТҮРІ</Chip>
      <Chip t0={6.85} y={520} side="r" color={C.gold} icon={<span style={{fontSize: 64, lineHeight: 1}}>₸</span>}>ТОЛЫҚ ҚҰНЫ</Chip>
      <Chip t0={7.9} y={710} side="c" color={C.teal} textColor={C.navy} icon={<Check size={60} />} size={52}>АЙҚЫН БАҒА</Chip>
    </>
  );
};

const SceneClinic: React.FC = () => {
  const {t, f} = useT();
  const s0 = 8.62, s1 = 13.1;
  const lp = usePop(8.7, {damping: 11, stiffness: 120, mass: 0.9});
  const steps = [['01', 'ТЕКСЕРУ', 9.56], ['02', 'ТҮСІНДІРУ', 11.04], ['03', 'НҰСҚАЛАР', 12.18]] as const;
  return (
    <>
      <Photo src="exam.jpg" a={1.1} b={1.26} from={s0} to={s1} fx={-30} fy={10} dim={0.18} pos="40% 50%" />
      <Grade />
      <div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * lp})`, opacity: lp}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 26, background: 'linear-gradient(135deg,#0E3C6E,#0A2547)', border: `4px solid ${C.teal}`, borderRadius: 40, padding: '34px 56px', boxShadow: '0 0 0 12px rgba(25,211,190,.15), 0 30px 80px rgba(0,0,0,.5)'}}>
          <Tooth size={110} color={C.teal} />
          <div style={{fontFamily: FONT, color: C.white}}>
            <div style={{fontWeight: 800, fontSize: 84, lineHeight: 1}}>Dent-A</div>
            <div style={{fontWeight: 700, fontSize: 50, letterSpacing: 14, color: C.teal, marginTop: 6}}>CLINIC</div>
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', top: 640, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22}}>
        {steps.map(([n, label, t0]) => {
          const p = usePop(t0);
          return (
            <div key={n} style={{transform: `translateY(${(1 - p) * 80}px) scale(${0.8 + 0.2 * p})`, opacity: p, background: 'rgba(255,255,255,.95)', color: C.navy, borderRadius: 28, padding: '20px 26px', textAlign: 'center', fontFamily: FONT, boxShadow: '0 14px 40px rgba(0,0,0,.4)', minWidth: 290}}>
              <div style={{fontWeight: 800, fontSize: 40, color: C.teal}}>{n}</div>
              <div style={{fontWeight: 800, fontSize: 40, letterSpacing: 1}}>{label}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const StepCard: React.FC<{n: string; title: string; sub: string; a: number; b: number}> = ({n, title, sub, a, b}) => {
  const {t} = useT();
  const p = usePop(a);
  const out = interpolate(t, [b - 0.15, b], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: 280, left: 60, right: 60, opacity: Math.min(p, out), transform: `translateY(${(1 - p) * 120}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 30, background: 'rgba(7,27,51,.82)', borderLeft: `14px solid ${C.gold}`, borderRadius: 32, padding: '34px 44px', boxShadow: '0 24px 70px rgba(0,0,0,.5)'}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 150, lineHeight: 1, color: C.gold}}>{n}</div>
        <div style={{fontFamily: FONT, color: C.white}}>
          <div style={{fontWeight: 800, fontSize: 62, lineHeight: 1.05}}>{title}</div>
          <div style={{fontWeight: 500, fontSize: 40, color: C.teal, marginTop: 8}}>{sub}</div>
        </div>
      </div>
    </div>
  );
};

const SceneSteps: React.FC = () => {
  const {t, f} = useT();
  const s0 = 13.1, s1 = 18.04;
  const cards = [['01', 'СӘЙКЕС КЕЛЕДІ', 'қайсысы сізге?', 13.14, 15.18], ['02', 'ҚАЛАЙ ЖАСАЛАДЫ', 'технология', 15.18, 16.38], ['03', 'ҚАНША УАҚЫТТА', 'дайын болады', 16.38, 18.1]] as const;
  return (
    <>
      <Photo src="dentures.jpg" a={1.1} b={1.25} from={s0} to={15.2} fy={-30} dim={0.3} pos="50% 45%" />
      <Photo src="bridge.jpg" a={1.12} b={1.25} from={15.18} to={16.5} fx={-30} dim={0.2} fade={0.18} />
      <Photo src="implant.jpg" a={1.08} b={1.22} from={16.38} to={s1} fx={30} dim={0.1} fade={0.18} />
      <Grade />
      {cards.map(([n, title, sub, a, b]) => (inRange(t, a, b) ? <StepCard key={n} n={n} title={title} sub={sub} a={a} b={b} /> : null))}
      <div style={{position: 'absolute', top: 200, left: 60, right: 60, display: 'flex', gap: 12}}>
        {cards.map(([n, , , a, b]) => (
          <div key={n} style={{flex: 1, height: 10, borderRadius: 6, background: 'rgba(255,255,255,.3)', overflow: 'hidden'}}>
            <div style={{height: '100%', background: C.gold, width: `${interpolate(t, [a, b], [0, 100], clamp)}%`}} />
          </div>
        ))}
      </div>
    </>
  );
};

const PayCard: React.FC<{t0: number; y: number; bg: string; name: string; side: 1 | -1; tint?: string}> = ({t0, y, bg, name, side, tint}) => {
  const p = usePop(t0, {damping: 12, stiffness: 120, mass: 0.9});
  const {f} = useT();
  return (
    <div style={{position: 'absolute', top: y, left: 70, right: 70, transform: `translateX(${side * (1 - p) * 1100}px) rotate(${side * (1 - p) * 8}deg) translateY(${Math.sin(f / 25 + y) * 8}px)`}}>
      <div style={{background: bg, borderRadius: 44, padding: '46px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 30px 80px rgba(0,0,0,.5)', border: '3px solid rgba(255,255,255,.35)'}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 112, color: C.white, letterSpacing: -2}}>{name}</div>
        <svg width="130" height="90" viewBox="0 0 130 90"><rect x="2" y="2" width="126" height="86" rx="14" fill="none" stroke="#fff" strokeWidth="5" opacity=".8" /><rect x="2" y="22" width="126" height="16" fill="#fff" opacity=".8" /><rect x="14" y="58" width="40" height="12" rx="4" fill="#fff" opacity=".8" /></svg>
      </div>
    </div>
  );
};
const ScenePay: React.FC = () => {
  const {t} = useT();
  const s0 = 18.04, s1 = 21.8;
  const seg = (i: number) => interpolate(t, [20.08 + i * 0.28, 20.08 + i * 0.28 + 0.3], [0, 1], clamp);
  const dp = usePop(20.0);
  const r = 88, circ = 2 * Math.PI * r;
  return (
    <>
      <Photo src="smile1.jpg" a={1.1} b={1.22} from={s0} to={s1} blur={14} dim={0.45} />
      <Grade />
      <PayCard t0={18.1} y={240} bg="linear-gradient(135deg,#FF5A47,#D9301F)" name="Kaspi" side={-1} />
      <PayCard t0={19.1} y={540} bg="linear-gradient(135deg,#2BCB74,#0E9B4C)" name="Halyk" side={1} />
      <div style={{position: 'absolute', top: 860, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 36, transform: `scale(${dp})`, opacity: dp}}>
        <svg width="230" height="230" viewBox="0 0 230 230">
          <circle cx="115" cy="115" r={r} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="26" />
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx="115" cy="115" r={r} fill="none" stroke={[C.teal, C.gold, '#ffffff', C.teal][i]} strokeWidth="26" strokeDasharray={`${(circ / 4 - 8) * seg(i)} ${circ}`} transform={`rotate(${-90 + i * 90} 115 115)`} />
          ))}
          <text x="115" y="140" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize="80" fill="#fff">₸</text>
        </svg>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 76, lineHeight: 1.05, color: C.white}}>БӨЛІП<br /><span style={{color: C.gold}}>ТӨЛЕУ</span></div>
      </div>
    </>
  );
};

const Snow: React.FC<{count?: number}> = ({count = 70}) => {
  const {f} = useT();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: count}).map((_, i) => {
        const sp = 0.8 + random(`s${i}`) * 2.2;
        const x = random(`x${i}`) * 1080 + Math.sin(f / 30 + i) * 40;
        const y = ((random(`y${i}`) * 2000 + f * sp * 3) % 2100) - 100;
        const sz = 5 + random(`z${i}`) * 13;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: sz, height: sz, borderRadius: '50%', background: '#fff', opacity: 0.35 + random(`o${i}`) * 0.55, filter: sz > 12 ? 'blur(1.5px)' : undefined}} />;
      })}
    </AbsoluteFill>
  );
};

const ScenePromo: React.FC = () => {
  const {t, f} = useT();
  const s0 = 21.8, s1 = 27.05;
  const gp = usePop(21.9, {damping: 8, stiffness: 100, mass: 1});
  const lid = interpolate(t, [22.3, 22.8], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
  const stamp = usePop(23.5, {damping: 7, stiffness: 200, mass: 0.6});
  const l1 = usePop(24.84), l2 = usePop(25.2), l3 = usePop(25.7);
  return (
    <>
      <Photo src="smile2.jpg" a={1.08} b={1.2} from={s0} to={s1} blur={10} dim={0.55} pos="50% 30%" />
      <Grade />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 38%, rgba(255,201,60,.35), transparent 55%)'}} />
      <Snow />
      <div style={{position: 'absolute', top: 210, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - gp) * -300 + Math.sin(f / 10) * 8}px) scale(${0.5 + 0.5 * gp})`, opacity: gp}}>
        <Gift size={440} lid={lid} />
      </div>
      <div style={{position: 'absolute', top: 700, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${stamp}) rotate(${-6 * stamp}deg)`, opacity: Math.min(1, stamp * 2)}}>
        <div style={{background: C.red, color: C.white, fontFamily: FONT, fontWeight: 800, fontSize: 80, letterSpacing: 10, padding: '10px 54px', borderRadius: 18, border: '6px solid #fff', boxShadow: '0 20px 60px rgba(0,0,0,.5)'}}>АКЦИЯ</div>
      </div>
      <div style={{position: 'absolute', top: 880, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 800, color: C.white, textShadow: '0 8px 40px rgba(0,0,0,.6)'}}>
        <div style={{fontSize: 74, opacity: l1, transform: `translateY(${(1 - l1) * 40}px)`}}>ЖАҢА ЖЫЛДЫҚ</div>
        <div style={{fontSize: 140, lineHeight: 1.05, color: C.gold, opacity: l2, transform: `scale(${0.6 + 0.4 * l2})`}}>ҰТЫС</div>
      </div>
    </>
  );
};

const PRIZES = [
  {t0: 27.94, t1: 29.74, img: 'iphone.jpg', big: 'iPhone 18', sub: 'Pro Max', n: '1', pos: '8% 50%'},
  {t0: 29.74, t1: 30.92, img: 'dubai.jpg', big: 'ДУБАЙ', sub: 'саяхат', n: '2', pos: '50% 50%'},
  {t0: 30.92, t1: 32.72, img: 'aktau.jpg', big: 'Rixos Aktau', sub: 'жолдама', n: '3', pos: '50% 62%'},
  {t0: 32.72, t1: 35.08, img: 'implant.jpg', big: 'IZEN', sub: 'имплантация · 5 сертификат', n: '4', pos: '50% 50%'},
  {t0: 35.08, t1: 36.7, img: 'brush.jpg', big: '5 ИРРИГАТОР', sub: 'жүлдегер сыйлығы', n: '5', pos: '50% 50%'},
];
const PrizeCard: React.FC<{p: (typeof PRIZES)[number]}> = ({p}) => {
  const {t} = useT();
  const pp = usePop(p.t0, {damping: 11, stiffness: 150, mass: 0.7});
  const out = interpolate(t, [p.t1 - 0.12, p.t1], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: 420, left: 56, right: 56, opacity: Math.min(pp, out), transform: `translateY(${(1 - pp) * 140}px) scale(${0.9 + 0.1 * pp})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 28, background: 'rgba(7,27,51,.84)', border: `3px solid ${C.gold}`, borderRadius: 40, padding: '30px 40px', boxShadow: '0 30px 80px rgba(0,0,0,.55)'}}>
        <div style={{width: 120, height: 120, borderRadius: 60, background: C.gold, color: C.navy, fontFamily: FONT, fontWeight: 800, fontSize: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>{p.n}</div>
        <div style={{fontFamily: FONT, color: C.white, minWidth: 0}}>
          <div style={{fontWeight: 800, fontSize: p.big.length > 11 ? 74 : 90, lineHeight: 1.02}}>{p.big}</div>
          <div style={{fontWeight: 500, fontSize: 40, color: C.teal, marginTop: 8}}>{p.sub}</div>
        </div>
      </div>
    </div>
  );
};

const ScenePrizes: React.FC = () => {
  const {t} = useT();
  const hp = usePop(27.05, {damping: 10, stiffness: 140, mass: 0.8});
  const cur = PRIZES.find((p) => t >= p.t0 && t < p.t1);
  return (
    <>
      <Photo src="smile2.jpg" a={1.1} b={1.2} from={27.05} to={27.98} blur={12} dim={0.5} pos="50% 30%" fade={0.01} />
      {PRIZES.map((p, i) => (
        <Photo key={p.img} src={p.img} a={1.1} b={1.3} from={p.t0 - 0.02} to={p.t1 + 0.3} fx={i % 2 ? 40 : -40} fy={i % 2 ? -20 : 20} dim={0.12} fade={0.2} pos={p.pos} />
      ))}
      <Grade />
      <Snow count={40} />
      <div style={{position: 'absolute', top: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${hp})`, opacity: hp}}>
        <div style={{background: C.gold, color: C.navy, fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 8, padding: '14px 52px', borderRadius: 999, boxShadow: '0 16px 50px rgba(0,0,0,.45)'}}>ЖҮЛДЕЛЕР</div>
      </div>
      {PRIZES.map((p) => (inRange(t, p.t0, p.t1) ? <PrizeCard key={p.n} p={p} /> : null))}
      <div style={{position: 'absolute', top: 160, left: 60, right: 60, display: 'flex', gap: 10, opacity: 0}} />
      <div style={{position: 'absolute', top: 140, right: 60, display: 'flex', gap: 10}}>
        {PRIZES.map((p) => (
          <div key={p.n} style={{width: 54, height: 10, borderRadius: 6, background: cur && cur.n === p.n ? C.gold : 'rgba(255,255,255,.35)'}} />
        ))}
      </div>
    </>
  );
};

const SceneCta: React.FC = () => {
  const {t, f} = useT();
  const s0 = 36.65, s1 = 40.44;
  const bp = usePop(36.75, {damping: 9, stiffness: 130, mass: 0.8});
  const pulse = 1 + Math.sin((t - s0) * 7) * 0.045;
  const kp = usePop(38.1, {damping: 7, stiffness: 200, mass: 0.6});
  const ring = ((t - s0) * 1.1) % 1;
  const arrow = Math.sin(f / 5) * 18;
  return (
    <>
      <Photo src="smile1.jpg" a={1.1} b={1.25} from={s0} to={s1} dim={0.4} />
      <Grade />
      <Snow count={30} />
      <div style={{position: 'absolute', top: 360, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{position: 'relative', width: 320, height: 320, transform: `scale(${bp * pulse})`}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: `8px solid ${C.wa}`, transform: `scale(${1 + ring * 0.9})`, opacity: 1 - ring}} />
          <WhatsApp size={320} />
        </div>
      </div>
      <div style={{position: 'absolute', top: 750, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${kp}) rotate(${-4 * kp}deg)`, opacity: Math.min(1, kp * 2)}}>
        <div style={{background: C.gold, color: C.navy, fontFamily: FONT, fontWeight: 800, fontSize: 112, letterSpacing: 6, padding: '12px 64px', borderRadius: 26, boxShadow: '0 24px 70px rgba(0,0,0,.55)'}}>«ПРОТЕЗ»</div>
      </div>
      <div style={{position: 'absolute', top: 1030, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${arrow}px)`, opacity: interpolate(t, [38.6, 38.9], [0, 1], clamp)}}>
        <svg width="120" height="120" viewBox="0 0 120 120"><path d="M30 40l30 32 30-32" fill="none" stroke={C.wa} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" /><path d="M30 70l30 32 30-32" fill="none" stroke={C.white} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" opacity=".8" /></svg>
      </div>
    </>
  );
};

// ---------- subtitles ----------
type Cap = {t: [number, number]; text: string};
const Subtitle: React.FC<{cap: Cap}> = ({cap}) => {
  const {t, f, fps} = useT();
  const [a, b] = cap.t;
  const words = cap.text.split(' ');
  const total = words.reduce((s, w) => s + w.length + 1, 0);
  let acc = 0;
  const times = words.map((w) => {
    const s = a + ((b - a) * acc) / total;
    acc += w.length + 1;
    return [s, a + ((b - a) * acc) / total] as const;
  });
  const enter = spring({frame: f - Math.round(a * fps), fps, config: {damping: 14, stiffness: 220, mass: 0.5}});
  const exit = interpolate(t, [b - 0.02, b + 0.08], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, bottom: 330, display: 'flex', justifyContent: 'center', opacity: Math.min(1, enter * 1.4) * exit, transform: `translateY(${(1 - enter) * 40}px) scale(${0.9 + 0.1 * enter})`}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 30px', fontFamily: FONT, fontWeight: 800, fontSize: 92, lineHeight: 1.12, textAlign: 'center'}}>
        {words.map((w, i) => {
          const [ws, we] = times[i];
          const active = t >= ws && t < we;
          const past = t >= we;
          const wp = spring({frame: f - Math.round(ws * fps), fps, config: {damping: 10, stiffness: 260, mass: 0.4}});
          return (
            <span key={i} style={{display: 'inline-block', color: active ? C.gold : C.white, transform: `scale(${active ? 1 + 0.12 * Math.min(1, wp) : 1}) translateY(${active ? -6 : 0}px)`, opacity: past || active ? 1 : 0.92, WebkitTextStroke: '14px #06182E', paintOrder: 'stroke fill', textShadow: '0 8px 30px rgba(0,0,0,.55)'}}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ---------- chrome: wipe, progress, brand tag ----------
const Wipe: React.FC<{at: number}> = ({at}) => {
  const {t} = useT();
  const k = interpolate(t, [at - 0.12, at + 0.22], [0, 1], clamp);
  if (k <= 0 || k >= 1) return null;
  const x = interpolate(k, [0, 1], [-130, 130], {easing: Easing.inOut(Easing.cubic)});
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: -200, bottom: -200, width: '70%', left: `${x - 35}%`, transform: 'skewX(-14deg)', background: `linear-gradient(90deg, ${C.teal}, #7CF5E7)`, boxShadow: '0 0 120px rgba(25,211,190,.8)'}} />
    </AbsoluteFill>
  );
};

const Chrome: React.FC = () => {
  const {t} = useT();
  const bp = usePop(0.2);
  return (
    <>
      <div style={{position: 'absolute', top: 0, left: 0, height: 10, width: `${(t / tl.duration) * 100}%`, background: `linear-gradient(90deg, ${C.teal}, ${C.gold})`}} />
      <div style={{position: 'absolute', top: 70, left: 56, display: 'flex', alignItems: 'center', gap: 14, opacity: bp, transform: `translateX(${(1 - bp) * -200}px)`}}>
        <div style={{width: 64, height: 64, borderRadius: 18, background: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Tooth size={40} color={C.navy} /></div>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.white, textShadow: '0 4px 20px rgba(0,0,0,.6)'}}>Dent-A Clinic</div>
      </div>
    </>
  );
};

export const Main: React.FC<{subs: boolean}> = ({subs}) => {
  useFonts();
  const {t} = useT();
  const SC: Record<string, React.FC> = {hook: SceneHook, need: SceneNeed, clinic: SceneClinic, steps: SceneSteps, pay: ScenePay, promo: ScenePromo, prizes: ScenePrizes, cta: SceneCta};
  const scene = tl.scenes.find((s) => t >= s.start && t < s.end) ?? tl.scenes[tl.scenes.length - 1];
  const Sc = SC[scene.id];
  const cap = (tl.captions as Cap[]).find((c) => t >= c.t[0] && t < c.t[1]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile('voice.mp3')} />
      <Sc />
      {tl.scenes.slice(1).map((s) => (
        <Wipe key={s.id} at={s.start} />
      ))}
      <Chrome />
      {subs && cap && <Subtitle key={cap.text + cap.t[0]} cap={cap} />}
    </AbsoluteFill>
  );
};
