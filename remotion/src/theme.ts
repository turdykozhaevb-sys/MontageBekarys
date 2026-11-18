// One typography system and one accent colour for the whole video.

export const COLORS = {
  // Rose gold sampled from the studio's own window logo in the footage (#CC947C core, #E7CAAF highlight).
  accent: '#E2B48C',
  plate: '#0C0C0C',
  ink: '#FFFFFF',
  inkSoft: 'rgba(255,255,255,0.78)',
};

export const FONTS = {
  // Both families cover every Kazakh letter (Ә Ғ Қ Ң Ө Ұ Ү Һ І), checked in the font files.
  display: '"Noto Serif Display", serif',
  text: '"Inter Tight", sans-serif',
};

// 1080x1920 grid: social UI zones stay free of anything important.
export const SAFE = {
  left: 72,
  right: 960, // likes / comments column starts here
  top: 220,
  bottom: 1500, // caption, buttons, username below this line
};

export const KICKER = {
  fontFamily: FONTS.text,
  fontWeight: 600,
  fontSize: 34,
  letterSpacing: '0.24em',
  textTransform: 'uppercase' as const,
  color: COLORS.inkSoft,
  lineHeight: 1,
};
