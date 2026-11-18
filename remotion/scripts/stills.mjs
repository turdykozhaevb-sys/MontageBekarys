// Render several stills from one bundle (much faster than one CLI call per frame).
//   node scripts/stills.mjs out/stills 0 9 18 ...   [--scale=0.5]
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const args = process.argv.slice(2);
const outDir = args[0];
const scaleArg = args.find((a) => a.startsWith('--scale='));
const scale = scaleArg ? Number(scaleArg.split('=')[1]) : 0.5;
const frames = args.slice(1).filter((a) => !a.startsWith('--')).map(Number);
fs.mkdirSync(outDir, {recursive: true});

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const composition = await selectComposition({serveUrl, id: 'Reel', browserExecutable});
for (const frame of frames) {
  const output = path.join(outDir, `f${String(frame).padStart(4, '0')}.png`);
  await renderStill({composition, serveUrl, frame, output, scale, browserExecutable, imageFormat: 'png'});
  process.stdout.write(`${frame} `);
}
console.log('\ndone');
