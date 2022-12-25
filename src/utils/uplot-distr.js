// distribute bars evenly
// https://github.com/leeoniya/uPlot/blob/master/demos/lib/distr.js

function roundDec(val, dec) {
  return Math.round(val * (dec = 10**dec)) / dec;
}

const SPACE_BETWEEN = 1;
const SPACE_AROUND  = 2;
const SPACE_EVENLY  = 3;

export { SPACE_BETWEEN, SPACE_AROUND, SPACE_EVENLY };

const coord = (i, offs, iwid, gap) => roundDec(offs + i * (iwid + gap), 6);

export default function distr(numItems, sizeFactor, justify, onlyIdx, each) {
  let space = 1 - sizeFactor;

  let gap =  (
      justify == SPACE_BETWEEN ? space / (numItems - 1) :
      justify == SPACE_AROUND  ? space / (numItems    ) :
      justify == SPACE_EVENLY  ? space / (numItems + 1) : 0
  );

  if (isNaN(gap) || gap == Infinity)
      gap = 0;

  let offs = (
      justify == SPACE_BETWEEN ? 0       :
      justify == SPACE_AROUND  ? gap / 2 :
      justify == SPACE_EVENLY  ? gap     : 0
  );

  let iwid = sizeFactor / numItems;
  let _iwid = roundDec(iwid, 6);

  if (onlyIdx == null) {
      for (let i = 0; i < numItems; i++)
          each(i, coord(i, offs, iwid, gap), _iwid);
  }
  else
      each(onlyIdx, coord(onlyIdx, offs, iwid, gap), _iwid);
}

