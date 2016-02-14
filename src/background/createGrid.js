import { shuffle } from '../utils/array';

// blissfuljs global
const { $ } = window;

function generateRowsAndCells(winDim, gridDef, cellDim) {
  const rows = [];

  const { dimension: gridDim, colCount, rowCount } = gridDef;

  // Calculate the offset coordinates for the grid based on its extended size.
  const rowLeftOffset = Math.round((gridDim.width - winDim.w) / 2) * -1;

  // The top/y-coord of a row.
  let rowY = 0;

  for (let r = 0; r < rowCount; r++) {
    // Generate the cells for the row.
    const rowCells = [];

    for (let c = 0; c < colCount; c++) {
      const left = (c * cellDim.w);

      const cell = {
        html: $.create('div', {
          className: 'gridCell',
          style: {
            height: `${cellDim.h}px`,
            left: `${left}px`,
            width: `${cellDim.w}px`
          }
        }),
        animationState: {
          fadeDown: false,
          fadeDownCurrentOpacity: 1
        }
      };

      rowCells.push(cell);
    }

    const row = {
      id: `row${r}`,
      cells: rowCells,
      html: $.create('div', {
        className: 'gridRow',
        style: {
          height: `${cellDim.h}px`,
          left: `${rowLeftOffset}px`,
          width: `${gridDim.width}px`,
        },
        contents: rowCells.map(rc => rc.html)
      }),
      dimension: {
        height: cellDim.h,
        width: gridDim.width
      },
      state: {
        top: rowY
      }
    };

    rows.push(row);

    // increment the  y-coord for next row
    rowY += cellDim.h;
  }

  return rows;
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

  const rows = generateRowsAndCells(winDim, gridDef, cellDim);

  const allCells = rows.reduce((prev, cur) => {
    cur.cells.forEach(c => prev.push(c));
    return prev;
  }, []);

  return {
    rendered: false,
    cellsFull: false,
    cells: shuffle(allCells),
    rows,
    animationState: {
      halfPointInitialised: false,
      nextComicIndex: 0,
      nextCellIndex: 0
    }
  };
}

export default grid;
