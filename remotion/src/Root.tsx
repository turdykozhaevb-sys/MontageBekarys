import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {TL} from './lib/timeline';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    durationInFrames={TL.durationInFrames}
    fps={TL.fps}
    width={TL.width}
    height={TL.height}
  />
);
