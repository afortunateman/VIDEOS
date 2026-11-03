import {Config} from '@remotion/cli/config';

Config.setBrowserExecutable('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome');
// Software WebGL so renders work on machines without a GPU.
Config.setChromiumOpenGlRenderer('swangle');
Config.setConcurrency(1);
Config.setVideoImageFormat('png');
