import { shuffle } from '../utils/array';
import { getRandomInt } from '../utils/math';

// blissfuljs global
const { $ } = window;

function generateCells(winDim, gridDef, cellDim) {
  const cells = [];

  const { dimension: gridDim, colCount, rowCount } = gridDef;

  // Calculate the offset coordinates for the grid based on its extended size.
  const rowLeftOffset = Math.round((gridDim.width - winDim.w) / 2) * -1;

  // Generate animation speed mods for each col.
  const colSpeedMods = [];
  for (let r = 0; r < colCount; r += 1) {
    const colSpeedMod = getRandomInt(1, 3) / 10;
    colSpeedMods.push(colSpeedMod);
  }

  for (let r = 0; r < rowCount; r += 1) {
    const ycoord = r * cellDim.h;

    for (let c = 0; c < colCount; c += 1) {
      const left = (c * cellDim.w);

      const cell = {
        html: $.create('div', {
          className: 'gridCell',
          style: {
            height: `${cellDim.h}px`,
            left: `${left + rowLeftOffset}px`,
            width: `${cellDim.w}px`
          }
        }),
        dimension: {
          height: cellDim.h,
          width: cellDim.w
        },
        animationState: {
          fadeDown: false,
          fadeDownCurrentOpacity: 1,
          top: ycoord,
          colSpeedMod: colSpeedMods[c]
        }
      };

      cells.push(cell);
    }
  }

  return cells;
}

/**
 * Generates a grid based on the given window dimensions and
 * individual comic dimensions.
 *
 * @param  {Object} winDim   The window dimensions.
 * @param  {Object} cellDim The desired cell dimensions.
 * @return {Object}          The grid specification.
 */
function grid(winDim, cellDim) {
  // We want our grid to take up the full display so we will add extra cols/rows
  // to the grid in order to ensure that there will be no whitespace.  As a
  // side effect of doing so we may need to negative offset our grid slightly
  // so that the content is nicely centered.

  // How many rows do we need?
  const rowCount = Math.round(winDim.h / cellDim.h)
      // we add an extra 2 rows always as it will help with any animation
      // transisitions
      + 2;

  // How may columns do we need?
  const colCount = Math.round(winDim.w / cellDim.w)
      // we add an extra column if there is a remainder on the column division.
      + ((winDim.w % cellDim.w > 0) ? 1 : 0);

  // Calculate the grid total dimensions.
  const gridDef = {
    dimension: {
      height: rowCount * cellDim.h,
      width: colCount * cellDim.w
    },
    rowCount,
    colCount
  };

  const cells = generateCells(winDim, gridDef, cellDim);

  return {
    rendered: false,
    cellsFull: false,
    cells: shuffle(cells),
    animationState: {
      halfPointInitialised: false,
      nextComicIndex: 0,
      nextCellIndex: 0
    },
    gridDef
  };
}

export default grid;
