import {Composition} from 'remotion';
import {Film} from './Film';
import {Insert} from './Insert';
import {TITLE_FRAMES, TitleCard} from './TitleCard';
import {FILM_FRAMES} from './timeline';

export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={FILM_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Insert" component={Insert} defaultProps={{which: 'determined'}} durationInFrames={90} fps={30} width={1920} height={1080} />
    <Composition id="InsertTop" component={Insert} defaultProps={{which: 'top'}} durationInFrames={60} fps={30} width={1920} height={1080} />
    <Composition id="InsertWide" component={Insert} defaultProps={{which: 'wide'}} durationInFrames={90} fps={30} width={1920} height={1080} />
    <Composition id="InsertHold" component={Insert} defaultProps={{which: 'hold'}} durationInFrames={246} fps={30} width={1920} height={1080} />
    <Composition id="TitleCard" component={TitleCard} durationInFrames={TITLE_FRAMES} fps={30} width={1920} height={1080} />
    {/* The same shot held on after the camera settles: the backdrop for the title card. */}
    <Composition id="InsertWideLong" component={Insert} defaultProps={{which: 'wide'}} durationInFrames={220} fps={30} width={1920} height={1080} />
    <Composition id="InsertStairs" component={Insert} defaultProps={{which: 'stairs'}} durationInFrames={60} fps={30} width={1920} height={1080} />
    <Composition id="InsertElder" component={Insert} defaultProps={{which: 'elder'}} durationInFrames={90} fps={30} width={1920} height={1080} />
  </>
);
