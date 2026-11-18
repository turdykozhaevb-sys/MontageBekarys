import {Config} from '@remotion/cli/config';
Config.setBrowserExecutable('/opt/pw-browsers/chromium');
Config.setChromiumOpenGlRenderer('angle');
Config.setConcurrency(4);
