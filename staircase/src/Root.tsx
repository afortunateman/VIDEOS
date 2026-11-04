import {Composition} from 'remotion';
import {Film} from './Film';
import {Insert} from './Insert';
import {FILM_FRAMES} from './timeline';

export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={FILM_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Insert" component={Insert} durationInFrames={90} fps={30} width={1920} height={1080} />
  </>
);
