// Editing timeline (frames @ 30 fps). Cuts sit on 120 BPM beats (15 frames per beat).
// Footage in public/graded.mp4 is already cut + graded by tools/grade_and_cut.sh.
export const FPS = 30;
export const TOTAL = 540;          // 18.0 s
export const FOOTAGE_END = 522;    // 17.4 s – end of usable footage
export const FADE_OUT_START = 510; // 17.0 s – picture fades to black on the final downbeat

export const HOOK = { from: 0, to: 75 };
// Word-by-word reveal synced to the transcript word starts.
export const HOOK_WORDS = [
  { at: 2, line: 0, text: "Бізге" },
  { at: 5, line: 1, text: "тапсырыс", accent: true },
  { at: 20, line: 2, text: "бергеннен кейін" },
  { at: 43, line: 3, text: "әрі қарай" },
  { at: 56, line: 3, text: "не болады" },
];
export const QMARK_AT = 60;

export const STEPS = [
  { n: 1, label: "Планировка", from: 75, to: 180 },
  { n: 2, label: "3D визуализация", from: 180, to: 255 },
  { n: 3, label: "Жөндеу жұмыстары", from: 255, to: 360 },
  { n: 4, label: "Соңына дейін бірге", from: 360, to: 472 },
];
export const NUMBER_DELAY = 8; // number reveals an 8th-note after the cut (matches tick SFX)
export const BRAND = { from: 472, to: TOTAL, name: "SEVENTEEN", sub: "командасы" };
