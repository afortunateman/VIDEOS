import {Composition} from 'remotion';
import {TestFrame} from './TestFrame';

export const Root: React.FC = () => (
  <>
    <Composition id="TestFrame" component={TestFrame} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
