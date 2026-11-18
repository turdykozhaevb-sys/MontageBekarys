// Renders preview stills of chosen frames: node tools/stills.mjs <outDir> <frame,frame,...>
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [outDir, frames] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "Montage" });
for (const f of frames.split(",").map(Number)) {
  await renderStill({ serveUrl, composition, frame: f, output: path.join(outDir, `f${String(f).padStart(3, "0")}.jpg`), imageFormat: "jpeg", jpegQuality: 92 });
  process.stdout.write(f + " ");
}
