import {continueRender, cancelRender, delayRender, staticFile} from 'remotion';

// Local font files (public/fonts, SIL Open Font License): no network needed at render time.
// Kazakh letters are split across the cyrillic and cyrillic-ext subsets, so each weight
// is declared per subset with its unicode-range, exactly like the upstream fontsource CSS.
const RANGES = {
  latin:
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
  'cyrillic-ext': 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F',
} as const;

const FACES: {family: string; slug: string; weight: number; style: 'normal' | 'italic'}[] = [
  {family: 'Noto Serif Display', slug: 'noto-serif-display', weight: 500, style: 'normal'},
  {family: 'Noto Serif Display', slug: 'noto-serif-display', weight: 600, style: 'normal'},
  {family: 'Noto Serif Display', slug: 'noto-serif-display', weight: 500, style: 'italic'},
  {family: 'Inter Tight', slug: 'inter-tight', weight: 500, style: 'normal'},
  {family: 'Inter Tight', slug: 'inter-tight', weight: 600, style: 'normal'},
];

const css = FACES.flatMap((f) =>
  (Object.keys(RANGES) as (keyof typeof RANGES)[]).map(
    (sub) => `@font-face{font-family:"${f.family}";font-style:${f.style};font-weight:${f.weight};font-display:block;` +
      `src:url("${staticFile(`fonts/${f.slug}-${sub}-${f.weight}-${f.style}.woff2`)}") format("woff2");unicode-range:${RANGES[sub]};}`,
  ),
).join('\n');

// Every Kazakh-specific letter plus digits, so all needed subsets are fetched before frame 0.
const PROBE = 'ӘҒҚҢӨҰҮҺІәғқңөұүһі АБВабв 0123456789:·';

let started = false;
export const ensureFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const handle = delayRender('Loading Kazakh-capable fonts');
  Promise.all(
    FACES.map((f) => document.fonts.load(`${f.style} ${f.weight} 64px "${f.family}"`, PROBE)),
  )
    .then((loaded) => {
      const missing = FACES.filter((_, i) => loaded[i].length === 0);
      if (missing.length) {
        cancelRender(new Error(`Fonts failed to load: ${missing.map((m) => `${m.family} ${m.weight} ${m.style}`).join(', ')}`));
        return;
      }
      continueRender(handle);
    })
    .catch((err) => cancelRender(err));
};
