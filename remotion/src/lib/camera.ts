import {Easing} from 'remotion';
import {faceAt} from './timeline';
import {sourceTimeAt} from './timeRemap';

/*
 * Virtual camera over the 1080x1920 source.
 * A camera is {z, cx, cy}: zoom and the SOURCE point shown at the frame centre.
 * A source point (x, y) lands on screen at ((x - cx) * z + 540, (y - cy) * z + 960).
 * The camera is clamped so a frame edge is never revealed (no black borders, no distortion:
 * the scale is always uniform).
 */
export type Cam = {z: number; cx: number; cy: number};

export type Framing = {
  z: number;
  /** where the face centre sits on screen (y px); default 600 = upper third */
  faceY?: number;
  /** 0..1, how much the camera follows the face horizontally (operator feel); default 0.85 */
  follow?: number;
  /** extra horizontal offset in source px */
  dx?: number;
};

export type Transition =
  | {type: 'cut'}
  /** animated move from the previous shot; ends at the shot's `from` */
  | {type: 'move'; frames: number; ease?: 'in' | 'out' | 'inOut'}
  /** fast whip pan (with a zoom bump) centred on the shot's `from` */
  | {type: 'whip'; frames: number; dir: 1 | -1};

export type Shot = {
  name: string;
  from: number;
  framing: Framing;
  /** framing reached at the end of the shot (slow drift / push), interpolated with ease-in-out */
  to?: Partial<Framing>;
  /** how this shot is entered */
  enter: Transition;
};

const W = 1080;
const H = 1920;

export const clampCam = (c: Cam): Cam => {
  const z = Math.max(1, c.z);
  const hx = W / 2 / z;
  const hy = H / 2 / z;
  return {
    z,
    cx: Math.min(W - hx, Math.max(hx, c.cx)),
    cy: Math.min(H - hy, Math.max(hy, c.cy)),
  };
};

const framingCam = (f: Framing, srcSec: number): Cam => {
  const face = faceAt(srcSec);
  const follow = f.follow ?? 0.85;
  const faceY = f.faceY ?? 600;
  const cx = W / 2 + (face.cx - W / 2) * follow + (f.dx ?? 0);
  const cy = face.cy - (faceY - H / 2) / f.z;
  return clampCam({z: f.z, cx, cy});
};

const mix = (a: Cam, b: Cam, t: number): Cam => ({
  // zoom interpolated in log space so the push feels linear to the eye
  z: Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * t),
  cx: a.cx + (b.cx - a.cx) * t,
  cy: a.cy + (b.cy - a.cy) * t,
});

const EASE = {
  in: Easing.in(Easing.cubic),
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
};

const framingAtShot = (shots: Shot[], i: number, frame: number): Framing => {
  const s = shots[i];
  if (!s.to) return s.framing;
  const end = i + 1 < shots.length ? shots[i + 1].from : s.from + 90;
  const t = Easing.inOut(Easing.sin)(Math.min(1, Math.max(0, (frame - s.from) / Math.max(1, end - s.from))));
  const a = s.framing;
  const b = {...a, ...s.to};
  return {
    z: a.z + (b.z - a.z) * t,
    faceY: (a.faceY ?? 600) + ((b.faceY ?? 600) - (a.faceY ?? 600)) * t,
    follow: a.follow ?? 0.85,
    dx: (a.dx ?? 0) + ((b.dx ?? 0) - (a.dx ?? 0)) * t,
  };
};

const shotIndexAt = (shots: Shot[], frame: number) => {
  let i = 0;
  for (let k = 0; k < shots.length; k++) if (frame >= shots[k].from) i = k;
  return i;
};

/** Camera at a (possibly fractional) output frame. */
export const cameraAt = (shots: Shot[], frame: number): Cam => {
  const src = sourceTimeAt(frame);
  // a whip is centred on the next shot's start: look ahead
  for (let k = 1; k < shots.length; k++) {
    const e = shots[k].enter;
    if (e.type === 'whip') {
      const half = e.frames / 2;
      if (frame >= shots[k].from - half && frame < shots[k].from + half) {
        const p = (frame - (shots[k].from - half)) / e.frames; // 0..1
        const a = framingCam(framingAtShot(shots, k - 1, shots[k].from - half), src);
        const b = framingCam(framingAtShot(shots, k, shots[k].from + half), src);
        const base = mix(a, b, Easing.inOut(Easing.cubic)(p));
        const bump = 0.16 * Math.sin(Math.PI * p); // the lens "leans in" during the whip
        const throwPx = 150; // source px
        const off = p < 0.5 ? throwPx * Easing.in(Easing.quad)(p * 2) : -throwPx * Easing.out(Easing.quad)((1 - p) * 2);
        return clampCam({z: base.z + bump, cx: base.cx + e.dir * off, cy: base.cy});
      }
    }
  }
  const i = shotIndexAt(shots, frame);
  const here = framingCam(framingAtShot(shots, i, frame), src);
  // a move ends at the next shot's `from`: inside [from - frames, from) blend this -> next
  const next = shots[i + 1];
  if (next && next.enter.type === 'move') {
    const start = next.from - next.enter.frames;
    if (frame >= start) {
      const t = (frame - start) / next.enter.frames;
      const target = framingCam(framingAtShot(shots, i + 1, next.from), src);
      return mix(here, target, EASE[next.enter.ease ?? 'inOut'](Math.min(1, t)));
    }
  }
  return here;
};

/** Frames where the camera (or the time remap) moves fast enough to need motion blur. */
export const blurWindows = (shots: Shot[]): [number, number][] => {
  const w: [number, number][] = [];
  shots.forEach((s) => {
    if (s.enter.type === 'move') w.push([s.from - s.enter.frames, s.from]);
    if (s.enter.type === 'whip') w.push([s.from - s.enter.frames / 2 - 1, s.from + s.enter.frames / 2 + 1]);
  });
  return w;
};
