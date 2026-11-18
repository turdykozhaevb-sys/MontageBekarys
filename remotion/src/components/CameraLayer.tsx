import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {blurWindows, cameraAt, Shot} from '../lib/camera';
import {Footage} from './Footage';

/*
 * Applies the virtual camera (uniform scale + translate only: proportions are never changed)
 * and real motion blur. Motion blur is only switched on inside planned windows (camera moves,
 * whip, fast ramps), never on frames next to a hard cut, so nothing ghosts across a cut.
 * Inside a window, CameraMotionBlur renders the rig at sub-frame times: camera AND footage
 * are re-evaluated per sample, so fast time-ramps get true frame blending too.
 */

const Rig: React.FC<{shots: Shot[]}> = ({shots}) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(shots, frame);
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#000'}}>
      <AbsoluteFill
        style={{
          transformOrigin: '0 0',
          transform: `translate(${540 - cam.cx * cam.z}px, ${960 - cam.cy * cam.z}px) scale(${cam.z})`,
        }}
      >
        <Footage />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const CameraLayer: React.FC<{shots: Shot[]; extraBlur: [number, number][]}> = ({shots, extraBlur}) => {
  const frame = useCurrentFrame();
  const windows = [...blurWindows(shots), ...extraBlur];
  const active = windows.some(([a, b]) => frame >= a && frame < b);
  if (!active) return <Rig shots={shots} />;
  return (
    <CameraMotionBlur shutterAngle={180} samples={10}>
      <Rig shots={shots} />
    </CameraMotionBlur>
  );
};
