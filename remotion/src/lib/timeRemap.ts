import {FPS, Piece, TL} from './timeline';

/*
 * Time remapping: output frame -> source seconds.
 *
 *  speech : exactly 1.0x (voice and lips untouched)
 *  gap    : silent pause between phrases. Cubic Hermite curve whose slope is 1.0x at both ends,
 *           so the picture leaves the phrase at real speed, rushes (or slows) through the pause,
 *           and is back at exactly 1.0x on the first syllable of the next phrase. No jump cut.
 *  lead   : pre-roll before "Достар!". Starts fast (~3.5x) and decelerates into 1.0x.
 *  tail   : the smile after the last word. Leaves at 1.0x and eases out towards a stop
 *           (slow motion from optical-flow frames, see Footage.tsx).
 *
 * The output frame may be fractional (motion-blur sub-samples), so everything is continuous.
 */

const hermite = (u: number, p0: number, p1: number, m0: number, m1: number) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1;
};

export const pieceAt = (frame: number): Piece => {
  const ps = TL.pieces;
  if (frame < ps[0].from) return ps[0];
  for (const p of ps) {
    if (frame >= p.from && frame < p.from + p.durationInFrames) return p;
  }
  return ps[ps.length - 1];
};

export const sourceTimeAt = (frame: number): number => {
  const p = pieceAt(frame);
  const D = p.durationInFrames / FPS; // output seconds
  const S = p.srcOut - p.srcIn; // source seconds
  const u = Math.min(1, Math.max(0, (frame - p.from) / p.durationInFrames));
  switch (p.kind) {
    case 'speech':
      return p.srcIn + (frame - p.from) / FPS;
    case 'gap':
      return hermite(u, p.srcIn, p.srcOut, D, D);
    case 'lead':
      return hermite(u, p.srcIn, p.srcOut, Math.max(D, 2 * S - D), D);
    case 'tail': {
      // s(u) = S * (1 - (1-u)^k), k = D/S  => speed 1.0x at u=0, smoothly to 0 at u=1
      const k = D / S;
      return p.srcIn + S * (1 - Math.pow(1 - u, k));
    }
  }
};

/** Playback speed (source seconds per output second) around a frame. */
export const speedAt = (frame: number) => (sourceTimeAt(frame + 0.25) - sourceTimeAt(frame - 0.25)) * FPS * 2;
