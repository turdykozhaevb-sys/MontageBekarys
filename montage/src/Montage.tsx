import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, Easing } from "remotion";
import { SANS, SCRIPT } from "./fonts";
import { BRAND, FADE_OUT_START, FOOTAGE_END, HOOK, HOOK_WORDS, NUMBER_DELAY, QMARK_AT, STEPS } from "./timeline";

const YELLOW = "#F3E24A";
const SHADOW = "0 2px 14px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.25)";
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const LABEL_Y = 1270; // chest height across all shots, clear of faces

// Soft "focus-in" reveal used by every text element (opacity + rise + defocus), like the reference.
const reveal = (f: number, at: number, dur = 7, rise = 18) => {
  const p = interpolate(f, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return { opacity: p, transform: `translateY(${(1 - p) * rise}px)`, filter: `blur(${(1 - p) * 8}px)` };
};

const sans: React.CSSProperties = { fontFamily: SANS, fontWeight: 800, color: "white", letterSpacing: "-0.035em", textShadow: SHADOW, lineHeight: 0.92, whiteSpace: "nowrap" };

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const lines = [0, 1, 2, 3].map((l) => HOOK_WORDS.filter((w) => w.line === l));
  const q = interpolate(f, [QMARK_AT, QMARK_AT + 6, QMARK_AT + 10], [0, 1.12, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 930 }}>
      {/* big translucent question mark behind the script word, as in the reference */}
      <div style={{ position: "absolute", left: 250, top: 250, fontFamily: SANS, fontWeight: 800, fontSize: 300, color: "rgba(255,255,255,0.78)",
        transform: `scale(${q}) rotate(-8deg)`, transformOrigin: "50% 80%", opacity: Math.min(1, q * 1.4), textShadow: SHADOW, lineHeight: 1 }}>?</div>
      {lines.map((ws, li) => (
        <div key={li} style={{ display: "flex", gap: 18, justifyContent: "center", marginTop: li === 1 ? -26 : li === 2 ? -30 : -2, position: "relative" }}>
          {ws.map((w) => (
            <span key={w.text} style={{ ...(w.accent
              ? { fontFamily: SCRIPT, fontSize: 132, color: YELLOW, letterSpacing: "-0.01em", lineHeight: 1, textShadow: "0 2px 16px rgba(0,0,0,0.3)", transform: "rotate(-4deg)" }
              : { ...sans, fontSize: 74 }), display: "inline-block" }}>
              <span style={{ display: "inline-block", ...reveal(f, w.at, w.accent ? 9 : 7) }}>{w.text}</span>
            </span>
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
};

const Step: React.FC<{ n: number; label: string; len: number; last: boolean }> = ({ n, label, len, last }) => {
  const f = useCurrentFrame();
  // label lands on the cut (3-frame snap), number follows an 8th-note later; number clears just before the next cut
  const lab = reveal(f, 0, 4, 10);
  const num = reveal(f, NUMBER_DELAY, 8, 26);
  const out = interpolate(f, [len - 7, len - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // final step dissolves its label into the brand reveal instead of hard-cutting
  const labOut = last ? interpolate(f, [len - 8, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", width: "100%", top: LABEL_Y - 178, textAlign: "center", ...sans, fontSize: 210, color: "rgba(255,255,255,0.6)", ...num, opacity: (num.opacity as number) * out }}>{n}</div>
      <div style={{ position: "absolute", width: "100%", top: LABEL_Y, textAlign: "center", ...sans, fontSize: 64, ...lab, opacity: (lab.opacity as number) * labOut }}>{label}</div>
    </AbsoluteFill>
  );
};

const Brand: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 16], [0, 1], { extrapolateRight: "clamp", easing: ease });
  const outro = interpolate(f, [BRAND.to - BRAND.from - 10, BRAND.to - BRAND.from - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: outro }}>
      <div style={{ position: "absolute", width: "100%", top: LABEL_Y - 60, textAlign: "center", ...sans, fontSize: 104,
        letterSpacing: `${0.5 - 0.42 * p}em`, opacity: p, filter: `blur(${(1 - p) * 10}px)`, paddingLeft: `${0.5 - 0.42 * p}em` }}>{BRAND.name}</div>
      <div style={{ position: "absolute", width: "100%", top: LABEL_Y + 40, textAlign: "center", fontFamily: SCRIPT, fontSize: 92, color: YELLOW,
        textShadow: "0 2px 16px rgba(0,0,0,0.3)", transform: "rotate(-4deg)" }}>
        <span style={{ display: "inline-block", ...reveal(f, 8, 10) }}>{BRAND.sub}</span>
      </div>
    </AbsoluteFill>
  );
};

export const Montage: React.FC = () => {
  const f = useCurrentFrame();
  const picture = interpolate(f, [FADE_OUT_START, FOOTAGE_END], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Sequence durationInFrames={FOOTAGE_END}>
        <AbsoluteFill style={{ opacity: picture }}>
          <OffthreadVideo src={staticFile("graded.mp4")} muted style={{ width: "100%", height: "100%" }} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={HOOK.from} durationInFrames={HOOK.to - HOOK.from}><Hook /></Sequence>
      {STEPS.map((s, i) => (
        <Sequence key={s.n} from={s.from} durationInFrames={s.to - s.from}>
          <Step n={s.n} label={s.label} len={s.to - s.from} last={i === STEPS.length - 1} />
        </Sequence>
      ))}
      <Sequence from={BRAND.from} durationInFrames={BRAND.to - BRAND.from}><Brand /></Sequence>
      <Audio src={staticFile("mix.wav")} />
    </AbsoluteFill>
  );
};
