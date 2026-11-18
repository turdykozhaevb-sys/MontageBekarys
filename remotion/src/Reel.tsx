import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CameraLayer} from './components/CameraLayer';
import {EXTRA_BLUR, SHOTS} from './edit/shots';
import {SoundTrack} from './edit/sound';
import {Titles} from './edit/Titles';
import {ensureFonts} from './lib/fonts';

ensureFonts();

/**
 * The reel: time-remapped single take + virtual camera + titles + voice / score / sound design.
 * Edit decisions live in src/edit/* (camera, titles, sound) and src/data/timeline.json (the cut).
 */
export const Reel: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <CameraLayer shots={SHOTS} extraBlur={EXTRA_BLUR} />
    <Titles />
    <SoundTrack />
  </AbsoluteFill>
);
