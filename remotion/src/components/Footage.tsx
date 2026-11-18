import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {FPS, HfrClip, TL} from '../lib/timeline';
import {pieceAt, sourceTimeAt} from '../lib/timeRemap';

/*
 * The picture, time-remapped. Each output frame shows the exact source moment given by
 * sourceTimeAt(): Freeze pins <OffthreadVideo> to that moment. In slow-motion pieces the
 * optical-flow clips (4x frames) are used so slow motion is smooth instead of stuttering.
 * Always muted: the voice comes from the lossless voice.wav in SoundTrack.
 *
 * No filters, no colour changes: the frames are shown exactly as in the source.
 */

const SOURCE = staticFile('media/source.mp4');
const SOURCE_FRAMES = 604;
const EPS = 0.01; // keeps on-grid times from landing a hair before their frame

const clipFor = (frame: number, src: number): HfrClip | null => {
  const p = pieceAt(frame);
  if (p.kind === 'speech') return null;
  const avg = (p.srcOut - p.srcIn) / (p.durationInFrames / FPS);
  if (avg >= 0.95) return null;
  return TL.hfr.find((c) => src >= c.startSec && src <= c.endSec - 1 / c.fps) ?? null;
};

const fill: React.CSSProperties = {width: '100%', height: '100%'};

export const Footage: React.FC = () => {
  const frame = useCurrentFrame(); // fractional inside motion-blur samples
  const src = sourceTimeAt(frame);
  const clip = clipFor(frame, src);
  if (clip) {
    const local = Math.max(0, src - clip.startSec);
    return (
      <AbsoluteFill>
        <Freeze frame={local * FPS + EPS}>
          <OffthreadVideo src={staticFile(clip.file)} muted style={fill} pauseWhenBuffering={false} />
        </Freeze>
      </AbsoluteFill>
    );
  }
  const f = Math.min(SOURCE_FRAMES - 1, Math.max(0, src * FPS));
  return (
    <AbsoluteFill>
      <Freeze frame={f + EPS}>
        <OffthreadVideo src={SOURCE} muted style={fill} pauseWhenBuffering={false} />
      </Freeze>
    </AbsoluteFill>
  );
};
