// Self-hosted fonts (public/fonts) so renders are offline and reproducible.
// Montserrat 700/800 (Cyrillic + Cyrillic-ext covers Kazakh letters) and Marck Script for the yellow accent word.
import { continueRender, delayRender, staticFile } from "remotion";
export const SANS = "Montserrat";
export const SCRIPT = "Marck Script";

const faces: [string, string, string, string][] = [];
for (const subset of ["cyrillic", "cyrillic-ext", "latin"]) for (const w of ["700", "800"]) faces.push([SANS, w, subset, `Montserrat-${w}-${subset}.woff2`]);
for (const subset of ["cyrillic", "latin"]) faces.push([SCRIPT, "400", subset, `MarckScript-400-${subset}.woff2`]);

if (typeof document !== "undefined") {
  const handle = delayRender("fonts");
  Promise.all(
    faces.map(([family, weight, , file]) => {
      const ff = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format("woff2")`, { weight });
      document.fonts.add(ff);
      return ff.load();
    }),
  ).then(() => continueRender(handle)).catch((e) => { console.error(e); continueRender(handle); });
}
