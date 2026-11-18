import React from 'react';
import {Plate, Reveal, Slam} from '../components/Plate';
import {TL, W} from '../lib/timeline';
import {COLORS, FONTS, KICKER, SAFE} from '../theme';

/*
 * On-screen text. Every word comes from the speaker (no invented facts), in Kazakh, and each
 * element enters on the frame its word is spoken (W.*, from the transcript + speech envelope).
 * Placement: lower part of the frame, left edge, always below her chin (+60 px) in the shot
 * that is live at that moment, and inside the social-UI safe area (x 72-960, y 220-1500).
 * At most one title on screen at a time.
 */

const serif = (size: number, color = COLORS.ink, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: FONTS.display,
  fontWeight: 500,
  fontSize: size,
  lineHeight: 1,
  color,
  letterSpacing: '-0.01em',
  ...extra,
});

const Kicker: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) => (
  <span style={{...KICKER, ...(color ? {color} : {})}}>{children}</span>
);

const Pin: React.FC = () => (
  <svg width={30} height={39} viewBox="0 0 26 34" style={{marginRight: 18, verticalAlign: '-6px'}}>
    <path d="M13 1C6.4 1 1 6.3 1 12.9 1 21.8 13 33 13 33s12-11.2 12-20.1C25 6.3 19.6 1 13 1z" fill="none" stroke={COLORS.accent} strokeWidth={2.4} />
    <circle cx={13} cy={13} r={4.2} fill={COLORS.accent} />
  </svg>
);

export const Titles: React.FC = () => (
  <>
    {/* HOOK (first 2 s): "We are 1 year old" - her news, stated before she gets to it */}
    <Plate
      left={SAFE.left}
      top={1040}
      exit={W.dostar + 63}
      lines={[
        {at: W.dostar, h: 38, node: <Kicker>Бізге</Kicker>},
        {
          at: W.dostar + 3,
          h: 290,
          gap: 8,
          raw: true,
          node: (
            <span style={{display: 'inline-flex', alignItems: 'baseline'}}>
              <Slam at={W.dostar + 3}>
                <span style={serif(300, COLORS.accent, {fontWeight: 600})}>1</span>
              </Slam>
              <Reveal inline at={W.dostar + 7}>
                <span style={serif(156, COLORS.ink, {marginLeft: 30})}>жыл</span>
              </Reveal>
            </span>
          ),
        },
      ]}
    />

    {/* "...Жаңаөзен қаласында" - where */}
    <Plate
      left={SAFE.left}
      top={1300}
      exit={W.rovno - 14}
      lines={[
        {
          at: W.zhanaozen,
          h: 36,
          node: (
            <span style={{display: 'inline-flex', alignItems: 'center'}}>
              <Pin />
              <Kicker color={COLORS.ink}>Жаңаөзен</Kicker>
            </span>
          ),
        },
      ]}
    />

    {/* "...клиенттерге арналған ашық есік күні" - what */}
    <Plate
      left={SAFE.left}
      top={1190}
      exit={W.zhiyrma - 16}
      lines={[
        {at: W.ashyq, h: 38, node: <Kicker color={COLORS.accent}>Клиенттерге арналған</Kicker>},
        {at: W.ashyq + 2, h: 112, gap: 14, node: <span style={serif(104)}>Ашық есік күні</span>},
      ]}
    />

    {/* "21-ші қараша, сағат он бес нөл нөлде" - when: the payoff, biggest type in the film */}
    <Plate
      left={SAFE.left}
      top={1000}
      exit={W.keliniz - 6}
      lines={[
        {
          at: W.zhiyrma,
          h: 236,
          raw: true,
          node: (
            <span style={{display: 'inline-flex', alignItems: 'baseline'}}>
              <Slam at={W.zhiyrma}>
                <span style={serif(250, COLORS.accent, {fontWeight: 600, letterSpacing: '-0.03em'})}>21</span>
              </Slam>
              <Reveal inline at={W.qarasha}>
                <span style={serif(112, COLORS.ink, {marginLeft: 28})}>қараша</span>
              </Reveal>
            </span>
          ),
        },
        {
          at: W.sagat,
          h: 104,
          gap: 18,
          raw: true,
          node: (
            <span style={{display: 'inline-flex', alignItems: 'baseline'}}>
              <Reveal inline at={W.sagat}>
                <Kicker>Сағат</Kicker>
              </Reveal>
              <Reveal inline at={W.on_bes}>
                <span style={serif(104, COLORS.ink, {marginLeft: 26, fontVariantNumeric: 'lining-nums'})}>15:00</span>
              </Reveal>
            </span>
          ),
        },
      ]}
    />

    {/* "Келіңіздер, сіздерді тосын сый күтеді" - the surprise, verbatim, word by word */}
    <Plate
      left={SAFE.left}
      top={1150}
      exit={TL.endCardFrame - 4}
      lines={[
        {at: W.sizderdi, h: 38, node: <Kicker>Сіздерді</Kicker>},
        {
          at: W.tosyn,
          h: 128,
          gap: 12,
          node: <span style={serif(120, COLORS.accent, {fontStyle: 'italic'})}>тосын сый</span>,
        },
        {at: W.kutedi, h: 38, gap: 10, node: <Kicker>күтеді</Kicker>},
      ]}
    />

    {/* END CARD on the final hit: the invitation in one glance (screenshot-able) */}
    <Plate
      left={SAFE.left}
      top={1050}
      exit={TL.durationInFrames + 30}
      lines={[
        {at: TL.endCardFrame, h: 38, node: <Kicker color={COLORS.accent}>Ашық есік күні</Kicker>},
        {
          at: TL.endCardFrame + 3,
          h: 132,
          gap: 16,
          node: (
            <span style={{display: 'inline-flex', alignItems: 'baseline'}}>
              <span style={serif(140, COLORS.accent, {fontWeight: 600, letterSpacing: '-0.03em'})}>21</span>
              <span style={serif(104, COLORS.ink, {marginLeft: 22})}>қараша</span>
            </span>
          ),
        },
        {
          at: TL.endCardFrame + 7,
          h: 38,
          gap: 22,
          node: <Kicker color={COLORS.ink}>Сағат 15:00 · Жаңаөзен</Kicker>,
        },
        {
          at: TL.endCardFrame + 12,
          h: 70,
          gap: 22,
          node: <span style={serif(64, COLORS.ink, {fontStyle: 'italic'})}>Келіңіздер!</span>,
        },
      ]}
    />
  </>
);
