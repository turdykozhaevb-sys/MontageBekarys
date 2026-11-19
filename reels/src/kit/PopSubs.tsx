// Pop subtitles: big uppercase words that spring in on their own word, the spoken word flashes in a bright color,
// no outline, no shadow, no plate.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions, buildChunks } from "./Subtitles";

const COLORS = ["#FFE600", "#FF2D75"];

export const PopSubs: React.FC<{ captions: Captions; font: string; top: number }> = ({ captions, font, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const chunks = React.useMemo(() => buildChunks(captions.words, 2, 18), [captions]);
  const c = chunks.find((k) => t >= k.start - 0.02 && t < k.end);
  if (!c) return null;
  const fadeOut = interpolate(t, [c.end - 0.12, c.end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const longest = Math.max(...c.words.map((w) => w.text.replace(/[,.]$/, "").length));
  const size = Math.min(96, Math.floor(820 / (longest * 0.82)));
  const lastIdx = c.words.reduce((a, w, i) => (t >= w.start ? i : a), -1);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, display: "flex", flexWrap: "wrap", justifyContent: "center",
      gap: "0 34px", opacity: fadeOut, transform: "rotate(-3deg)", fontFamily: font }}>
      {c.words.map((w, i) => {
        if (t < w.start - 0.02) return null;
        const p = spring({ frame: frame - Math.round(w.start * fps), fps, config: { damping: 11, stiffness: 220, mass: 0.6 } });
        const active = i === lastIdx;
        const colorIdx = captions.words.indexOf(w) % 2;
        return (
          <span key={i} style={{ display: "inline-block", fontSize: size, fontWeight: 900, lineHeight: 1.1, textTransform: "uppercase",
            letterSpacing: -1, color: active ? COLORS[colorIdx] : "#FFFFFF", transform: `scale(${0.55 + 0.45 * p + (active ? 0.1 : 0)}) translateY(${(1 - p) * 30}px)` }}>
            {w.text.replace(/[,.]$/, "")}
          </span>
        );
      })}
    </div>
  );
};
