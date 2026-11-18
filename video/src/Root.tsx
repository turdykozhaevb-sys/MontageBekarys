import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import tl from './timeline.json';

export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.ceil(tl.duration * tl.fps)} fps={tl.fps} width={tl.width} height={tl.height} defaultProps={{subs: true}} />
  </>
);
