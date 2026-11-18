import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {COLORS} from '../theme';

/*
 * A title plate: solid black card, rose-gold marker bar, lines that arrive on their own
 * spoken word. The card grows downward as lines arrive (nothing already on screen moves).
 *
 * Motion language (one per video): entrances decelerate (ease-out cubic, 10-14 frames) with a
 * short motion-blur settle; exits are faster (8 frames) and slide out.
 */

export type PlateLine = {
  /** output frame the line appears (its word) */
  at: number;
  /** line box height in px (fixed, so the card can grow without measuring) */
  h: number;
  node: React.ReactNode;
  /** gap above this line in px */
  gap?: number;
  /** the node animates itself (Slam / inline Reveal); skip the default line reveal */
  raw?: boolean;
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = Easing.out(Easing.cubic);
const easeIn = Easing.in(Easing.cubic);

export const PLATE_PAD = {x: 40, top: 30, bottom: 32, bar: 8};

export const Plate: React.FC<{
  left: number;
  top: number;
  exit: number;
  lines: PlateLine[];
}> = ({left, top, exit, lines}) => {
  const frame = useCurrentFrame();
  const enter = lines[0].at;
  if (frame < enter || frame >= exit) return null;

  // horizontal wipe in, then the card grows downward line by line
  const wipe = easeOut(clamp01((frame - enter) / 11));
  let revealed = 0;
  lines.forEach((l, i) => {
    const t = i === 0 ? 1 : easeOut(clamp01((frame - l.at) / 10));
    revealed += ((l.gap ?? 0) + l.h) * t;
  });
  const out = easeIn(clamp01((frame - (exit - 8)) / 8));
  const bar = easeOut(clamp01((frame - enter) / 14));

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        transform: `translateX(${-28 * out}px)`,
        opacity: 1 - out,
        clipPath: `inset(0 ${(1 - wipe) * 100}% 0 ${out * 100}%)`,
      }}
    >
      <div style={{position: 'relative', display: 'inline-block'}}>
        {/* card background, height follows the revealed lines */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: PLATE_PAD.top + revealed + PLATE_PAD.bottom,
            backgroundColor: COLORS.plate,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: PLATE_PAD.bar,
            height: (PLATE_PAD.top + revealed + PLATE_PAD.bottom) * bar,
            backgroundColor: COLORS.accent,
          }}
        />
        {/* layout box: all lines take their space, so the card width fits the longest line */}
        <div
          style={{
            position: 'relative',
            padding: `${PLATE_PAD.top}px ${PLATE_PAD.x}px ${PLATE_PAD.bottom}px ${PLATE_PAD.x + PLATE_PAD.bar}px`,
          }}
        >
          {lines.map((l, i) => (
            <div key={i} style={{height: l.h, marginTop: l.gap ?? 0, position: 'relative', whiteSpace: 'nowrap'}}>
              {l.raw ? l.node : <Reveal at={l.at}>{l.node}</Reveal>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** A line (or part of a line) arriving: rises 34 px, fades in, motion blur settles. */
export const Reveal: React.FC<{at: number; children: React.ReactNode; inline?: boolean}> = ({at, children, inline}) => {
  const frame = useCurrentFrame();
  const t = clamp01((frame - at) / 12);
  if (frame < at) return inline ? <span style={{opacity: 0}}>{children}</span> : <div style={{opacity: 0}}>{children}</div>;
  const e = easeOut(t);
  const style: React.CSSProperties = {
    display: inline ? 'inline-block' : 'block',
    opacity: interpolate(t, [0, 0.55], [0, 1], {extrapolateRight: 'clamp'}),
    transform: `translateY(${(1 - e) * 34}px)`,
    filter: t < 1 ? `blur(${(1 - e) * 9}px)` : undefined,
  };
  return inline ? <span style={style}>{children}</span> : <div style={style}>{children}</div>;
};

/** A big numeral landing on a hit: scales down from 1.2 with a motion-blur settle. */
export const Slam: React.FC<{at: number; children: React.ReactNode}> = ({at, children}) => {
  const frame = useCurrentFrame();
  const t = clamp01((frame - at) / 12);
  if (frame < at) return <span style={{opacity: 0, display: 'inline-block'}}>{children}</span>;
  const e = easeOut(t);
  return (
    <span
      style={{
        display: 'inline-block',
        transformOrigin: '0% 80%',
        transform: `scale(${1.2 - 0.2 * e})`,
        opacity: interpolate(t, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
        filter: t < 1 ? `blur(${(1 - e) * 12}px)` : undefined,
      }}
    >
      {children}
    </span>
  );
};
