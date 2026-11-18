import type {Shot} from '../lib/camera';
import {W} from '../lib/timeline';

/*
 * The camera plan. Every change has a reason (right-hand comments).
 * Frames are output frames; most are tied to spoken words (W.*) from the planner, so if the
 * cut is re-planned the camera follows automatically.
 *
 * Shot sizes on a 1080p vertical source (zoom margin ~x1.4 before softness shows):
 *   WIDE 1.0 · MEDIUM ~1.14 · MEDIUM-CLOSE ~1.27 · CLOSE ~1.38
 */
export const SHOTS: Shot[] = [
  {
    name: 'hook-tight',
    from: 0,
    framing: {z: 1.4, faceY: 620},
    to: {z: 1.46},
    enter: {type: 'cut'}, // opens tight on her face while the pre-roll ramps in fast (the "inhale")
  },
  {
    name: 'hook-reveal',
    from: W.dostar + 17,
    framing: {z: 1.0},
    to: {z: 1.025},
    enter: {type: 'move', frames: 17, ease: 'out'}, // on "Достар!" the camera bursts out as her arms open: the gesture opens the frame
  },
  {
    name: 'medium-studio',
    from: W.dostar + 47,
    framing: {z: 1.14, faceY: 610},
    to: {z: 1.19},
    enter: {type: 'cut'}, // arms are back down: hard cut in to medium for the information line, slow push
  },
  {
    name: 'wide-gesture',
    from: W.dostar + 103,
    framing: {z: 1.0},
    to: {z: 1.035},
    enter: {type: 'cut'}, // "ашылғанына": she opens her arms again, cut wide so the gesture is not cropped
  },
  {
    name: 'close-one-year',
    from: W.rovno,
    framing: {z: 1.36, faceY: 590},
    to: {z: 1.41},
    enter: {type: 'move', frames: 11, ease: 'inOut'}, // push in through the (ramped) pause, lands on "ровно бір жыл" on the beat
  },
  {
    name: 'medium-invitation',
    from: W.kense - 4,
    framing: {z: 1.12, faceY: 620},
    to: {z: 1.16},
    enter: {type: 'whip', frames: 8, dir: 1}, // section change (news -> invitation): whip pan inside the pause
  },
  {
    name: 'punch-open-house',
    from: W.ashyq - 1,
    framing: {z: 1.26, faceY: 600},
    to: {z: 1.3},
    enter: {type: 'cut'}, // hard punch-in on "ашық есік күні", the event itself
  },
  {
    name: 'payoff-push',
    from: W.zhiyrma - 16,
    framing: {z: 1.3, faceY: 600},
    to: {z: 1.5, faceY: 610},
    enter: {type: 'cut'}, // seamless: continues the shot, then leans in while time slows (the music breaks)
  },
  {
    name: 'date',
    from: W.zhiyrma,
    framing: {z: 1.06, faceY: 640},
    to: {z: 1.14, faceY: 620},
    enter: {type: 'cut'}, // impact cut OUT on "21-ші қараша": the reverse move makes room for the big date
  },
  {
    name: 'welcome-wide',
    from: W.keliniz + 7,
    framing: {z: 1.0},
    to: {z: 1.03},
    enter: {type: 'move', frames: 15, ease: 'out'}, // "Келіңіздер": pull out with her open arms (bookends the opening)
  },
  {
    name: 'tail-hold',
    from: W.last_voice + 1,
    framing: {z: 1.03, faceY: 640},
    to: {z: 1.22, faceY: 600},
    enter: {type: 'cut'}, // seamless: slow push on the smile as time slows to a stop under the end card
  },
];

/** Extra motion-blur windows that are not camera moves: the fast pre-roll ramp and the payoff push. */
export const EXTRA_BLUR: [number, number][] = [
  [0, W.dostar - 1],
  [W.zhiyrma - 10, W.zhiyrma - 1],
];
