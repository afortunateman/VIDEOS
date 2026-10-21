import {S1} from '../../timeline/timeline';
import {typeSchedule} from '../../utils/typewriter';

// One timestamp per character of the typed line. A small hesitation before "God".
const GOD_INDEX = S1.typedLine.indexOf('God');

export const S1_KEY_TIMES = typeSchedule(S1.typedLine, S1.typeCps, S1.typeStart, {
  seed: 31,
  endBy: S1.lineComplete - 0.15,
  holdBefore: {[GOD_INDEX]: 0.45},
});
