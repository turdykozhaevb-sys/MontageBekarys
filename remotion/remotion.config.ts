import {Config} from '@remotion/cli/config';

// Highest-quality output for social delivery (1080x1920, 30 fps, H.264 High).
// PNG intermediate frames: lossless between Chromium and the encoder.
Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setCrf(12);
Config.setX264Preset('slow');
Config.setPixelFormat('yuv420p');
// Tag and encode as BT.709 so the colours of the source are kept exactly.
Config.setColorSpace('bt709');
Config.setAudioCodec('aac');
Config.setAudioBitrate('320k');
Config.setOverwriteOutput(true);

// Use a locally installed Chrome Headless Shell if one is given (e.g. in CI / cloud containers):
//   REMOTION_BROWSER=/path/to/chrome-headless-shell npx remotion render Reel
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
