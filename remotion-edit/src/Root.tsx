import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
export const FPS = 30;
export const Root: React.FC = () => (
  <Composition id="Main" component={Main} width={1080} height={1920} fps={FPS} durationInFrames={540} />
);
