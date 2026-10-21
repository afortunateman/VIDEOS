import '@fontsource/eb-garamond/400.css';
import '@fontsource/eb-garamond/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import {continueRender, delayRender} from 'remotion';

// Block rendering until the bundled fonts are ready, so frame 0 never shows a fallback face.
const handle = delayRender('Loading fonts');
Promise.all([
  document.fonts.load('400 40px "EB Garamond"'),
  document.fonts.load('600 40px "EB Garamond"'),
  document.fonts.load('400 40px "Inter"'),
  document.fonts.load('500 40px "Inter"'),
])
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
