import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {FPS, TL, W} from '../lib/timeline';

/*
 * Sound: voice + score + sound design.
 *
 *  voice  : each speech piece plays its own slice of the original audio (lossless WAV) at 1.0x,
 *           at exactly the frames the picture uses, so lips and voice stay in sync.
 *  music  : audio/music.wav, composed to this cut by tools/score.py (already ducked under the voice).
 *  sfx    : cue sheet below. Each hit is placed where it should be HEARD:
 *           whooshes peak 9 frames (0.30 s) after their start, the swell ends 9 frames after it starts,
 *           the riser ends 37.5 frames after it starts, impacts / sparkle / ticks hit on their first frame.
 *           Levels were set in score.py relative to the voice peak (12-22 dB under it), so volume = 1.
 */

const PEAK = 9; // frames from file start to the whoosh / swell peak
const RISER_LEN = 37.5;

export type Cue = {file: string; from: number; volume?: number; why: string};

export const SFX: Cue[] = [
  {file: 'swell_in.wav', from: W.dostar - PEAK, why: 'reverse swell: tension into the first word'},
  {file: 'impact_hook.wav', from: W.dostar, why: 'hook hit on "Достар!" with the burst-out camera'},
  {file: 'tick.wav', from: W.zhanaozen, why: 'location chip lands'},
  {file: 'whoosh_push.wav', from: W.rovno - 5 - PEAK, why: 'push-in through the pause to "ровно бір жыл"'},
  {file: 'whoosh_whip.wav', from: W.kense - 4 - PEAK, why: 'whip pan: news -> invitation'},
  {file: 'tick.wav', from: W.ashyq, why: '"ашық есік күні" punch-in + title'},
  {file: 'riser.wav', from: Math.round(W.zhiyrma - RISER_LEN), why: 'riser through the music break / slow-down'},
  {file: 'impact_drop.wav', from: W.zhiyrma, why: 'drop on "21-ші қараша", impact cut out, date slams in'},
  {file: 'tick.wav', from: W.on_bes, why: '"15:00" lands'},
  {file: 'whoosh_pull.wav', from: W.keliniz - 3 - PEAK, why: 'pull-out with her open arms on "Келіңіздер"'},
  {file: 'sparkle.wav', from: W.tosyn, why: '"тосын сый" - the surprise'},
  {file: 'impact_end.wav', from: TL.endCardFrame, why: 'final hit: end card'},
];

export const SoundTrack: React.FC = () => (
  <>
    {TL.pieces
      .filter((p) => p.kind === 'speech')
      .map((p) => (
        <Sequence key={p.from} from={p.from} durationInFrames={p.durationInFrames} name={`voice · ${p.label}`} layout="none">
          <Audio src={staticFile('media/voice.wav')} trimBefore={Math.round(p.srcIn * FPS)} />
        </Sequence>
      ))}
    <Sequence name="music · score" layout="none">
      <Audio src={staticFile('audio/music.wav')} />
    </Sequence>
    {SFX.map((c) => (
      <Sequence key={`${c.file}-${c.from}`} from={c.from} name={`sfx · ${c.file} · ${c.why}`} layout="none">
        <Audio src={staticFile(`audio/sfx/${c.file}`)} volume={c.volume ?? 1} />
      </Sequence>
    ))}
  </>
);
