import React from 'react';
import {AbsoluteFill, Easing, Sequence, OffthreadVideo, staticFile, useCurrentFrame, interpolate, delayRender, continueRender} from 'remotion';
import captions from './captions.json';

const FPS = 30;
const f = (s: number) => Math.round(s * FPS);

// Per-glyph fallback across Fontsource Cyrillic subsets (Kazakh letters live in "ext").
const FACES: [string, string, string, string][] = [
  ['Mont', 'montserrat-cyrillic-ext-800-normal.woff2', '800', 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F'],
  ['Mont', 'montserrat-cyrillic-800-normal.woff2', '800', 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'],
  ['Script', 'marck-script-cyrillic-400-normal.woff2', '400', 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'],
];
const useFonts = () => {
  const [h] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => {
    Promise.all(FACES.map(([fam, file, w, range]) => {
      const ff = new FontFace(fam, `url(${staticFile('fonts/' + file)}) format('woff2')`, {weight: w, unicodeRange: range});
      document.fonts.add(ff);
      return ff.load();
    })).then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
};

const shadow = '0 3px 18px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.5)';
const ease = Easing.bezier(0.22, 1, 0.36, 1);

// word fades in (opacity + 14px rise), like the reference's word-by-word reveal
const Word: React.FC<{text: string; at: number; accent?: boolean; size: number}> = ({text, at, accent, size}) => {
  const fr = useCurrentFrame();
  const p = interpolate(fr, [at, at + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  if (accent) {
    return (
      <span style={{display: 'inline-block', fontFamily: 'Script, cursive', fontWeight: 400, color: '#ffe020', fontSize: size * 1.35,
        transform: `rotate(-5deg) scale(${0.8 + 0.2 * p}) translateY(${(1 - p) * 14}px)`, opacity: p, textShadow: shadow, margin: '0 10px', lineHeight: 1}}>{text}</span>
    );
  }
  return (
    <span style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 14}px)`, margin: '0 10px'}}>{text}</span>
  );
};

const Hook: React.FC = () => {
  const fr = useCurrentFrame();
  const {hook} = captions;
  const dur = f(hook.endSec);
  const out = interpolate(fr, [dur - 6, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  let idx = 0;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', top: '58%', opacity: out}}>
      <div style={{fontFamily: 'Mont, sans-serif', fontWeight: 800, fontSize: 84, lineHeight: 1.12, color: '#fff', textAlign: 'center', textShadow: shadow, width: 960}}>
        {hook.lines.map((line, li) => (
          <div key={li}>
            {line.map((w) => {
              const at = f(hook.startSec) + Math.round(idx++ * hook.wordGapSec * FPS);
              return <Word key={w + li} text={w} at={at} size={84} accent={w === hook.accent} />;
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Step: React.FC<{n: number; title: string; len: number}> = ({n, title, len}) => {
  const fr = useCurrentFrame();
  const inP = interpolate(fr, [4, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const out = interpolate(fr, [len - 4, len], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const words = title.split(' ');
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', top: '66%', opacity: out}}>
      <div style={{fontFamily: 'Mont, sans-serif', fontWeight: 800, fontSize: 230, lineHeight: 1, color: 'rgba(255,255,255,0.62)', textShadow: shadow,
        opacity: inP, transform: `translateY(${(1 - inP) * 24}px) scale(${0.9 + 0.1 * inP})`}}>{n}</div>
      <div style={{fontFamily: 'Mont, sans-serif', fontWeight: 800, fontSize: 70, color: '#fff', textShadow: shadow, textAlign: 'center', marginTop: -8, width: 940}}>
        {words.map((w, i) => <Word key={i} text={w} at={6 + i * 4} size={70} />)}
      </div>
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* original footage, graded + audio-mastered by scripts/prep.sh; no crop, no scale */}
      <OffthreadVideo src={staticFile('graded.mp4')} style={{width: 1080, height: 1920, objectFit: 'fill'}} />
      <Sequence from={0} durationInFrames={f(captions.hook.endSec)}><Hook /></Sequence>
      {captions.steps.map((s) => {
        const from = f(s.startSec) + 3; // enters just after the cut
        const len = f(s.endSec) - from;
        return <Sequence key={s.n} from={from} durationInFrames={len}><Step n={s.n} title={s.title} len={len} /></Sequence>;
      })}
    </AbsoluteFill>
  );
};
