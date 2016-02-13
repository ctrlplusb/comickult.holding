import classie from 'desandro-classie';
import { Observable } from 'rx';
import { shuffle } from './utils/array';

import './comics.css';

// blissfuljs global
const { $ } = window;

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimationFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function(callback, element){
              return window.setTimeout(callback, 1000 / 60);
          };
})();

window.cancelRequestAnimationFrame = (function(){
  return  window.cancelRequestAnimationFrame       ||
          window.webkitCancelRequestAnimationFrame ||
          window.mozCancelRequestAnimationFrame    ||
          window.oCancelRequestAnimationFrame      ||
          window.mscancelRequestAnimationFrame     ||
          window.clearTimeout
})();

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function paintGrid($container, grid, speed) {
  const { rows } = grid;

  grid.cells
    .filter(c => c.animationState.fadeDown)
    .forEach(c => {
      const newOpac = c.animationState.fadeDownCurrentOpacity - 0.01;
      c.html.children[0]._.set({ style: { opacity: newOpac } });

      if (newOpac <= 0.3) {
        c.animationState.fadeDown = false;
        c.animationState.fadeDownCurrentOpacity = 1;
      } else {
        c.animationState.fadeDownCurrentOpacity = newOpac;
      }
    })

  rows.forEach(r => {
    const height = r.dimension.height;

    r.state.top -= speed;

    if (r.state.top < (height * -1)) {
      r.state.top = ((rows.length - 1) * height);
    }
  });

  rows.forEach(r => { r.html.style.top = `${r.state.top}px`; });

  if (!grid.rendered) {
    console.log('rendering grid');
    $container.innerHTML = '';
    $container._.contents(rows.map(r => r.html));
    grid.rendered = true;
  }
}

let delayCount = 1;

// :: Url -> Observable ImageDomElement
function imageEl(imgUrl) {
  delayCount = delayCount * 2;

  return Observable.create((observer) => {
    const img = new Image();

    img.src = imgUrl;

    img.onload = () => {
      observer.onNext(img);
      observer.onCompleted();
    };

    img.onError = (err) => {
      observer.onError(err);
    };
  });
  // NOTE: for dev testing
  //.delay(new Date(Date.now() + (1000 * delayCount)));
}

function dimensions(win) {
  return {
    w: win.innerWidth
      || win.document.documentElement.clientWidth
      || win.document.body.clientWidth,
    h: win.innerHeight
      || win.document.documentElement.clientHeight
      || win.document.body.clientHeight
  };
}

/**
 * Adjusts sprites source data so that the dimensions and coordinates contained
 * within will be friendly to our target device pixel density.
 *
 * @param  {number} density The pixel density of the device.
 * @param  {Object} data    The sprite source data.
 * @return {Object}         The adjusted sprite source data.
 */
function adjustForPixelDensity(density, data) {
  // We need to adjust the sprite dimensions, image dimensions, and the
  // image coordinates to take into account any adjustments we make to the
  // sprite sources in order to serve our required pixel density.
  //
  // If we have a pixel density greater than 1, we are dealing with retina
  // generally, therefore we need to divide our source images by the given
  // pixel density so that we achieve an output that looks crisp.
  //
  // To make the adjustments to the data is simply a matter of applying the
  // pixel density division against each of the dimensions/coords.

  if (density === 1) {
    // No adjustments needed.
    return data;
  }

  const { spriteDimension, imageDimension, imageCoords } = data;

  const spriteDimensionPX = {
    w: spriteDimension.w / density,
    h: spriteDimension.h / density,
  };

  const imageDimensionPX = {
    w: imageDimension.w / density,
    h: imageDimension.h / density,
  };

  const imageCoordsPX = imageCoords.map(c => ({
    x: c.x / density,
    y: c.y / density,
  }));

  return Object.assign({}, data, {
    spriteDimension: spriteDimensionPX,
    imageDimension: imageDimensionPX,
    imageCoords: imageCoordsPX
  });
}

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
function generateGrid(winDim, cellDim) {
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

// :: (Url, Dimensions, Coords) -> SpriteDomElement
function comicEl(comicData) {
  const { w: sw, h: sh } = comicData.sprite.dimension;
  const { x, y } = comicData.image.coord;
  const { w, h } = comicData.image.dimension;

  return $.create('div', {
    className: 'comic',
    style: {
      backgroundImage: `url(${comicData.sprite.url})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: `-${x}px -${y}px`,
      backgroundSize: `${sw}px ${sh}px`,
      position: 'relative',
      height: `${h}px`,
      width: `${w}px`
    }
  });
}

function getComics(grid$, spriteData$) {
  function getRequiredSpritesCount(grid$, spriteData$) {
    return Observable
      .combineLatest(
        [grid$, spriteData$],
        (grid, spriteData) => ({
          requiredComics: grid.cells.length,
          spriteComicCount: spriteData.imageCoords.length
        })
      )
      .map(x => Math.ceil(x.requiredComics / x.spriteComicCount) + 2);
  }

  const requiredSprites$ = getRequiredSpritesCount(grid$, spriteData$);

  const fetchedSprites$ = Observable
    .combineLatest(
      [spriteData$, requiredSprites$],
      (spriteData, requiredSprites) => {
        const { spriteUrls: urls } = spriteData;
        const enoughSprites = [];

        while (enoughSprites.length < requiredSprites) {
          for (let i = 0; i < urls.length; i++) {
            enoughSprites.push(urls[i]);
            if (enoughSprites.length === requiredSprites) {
              break;
            }
          }
        }

        return Observable.from(enoughSprites);
      }
    )
    .concatAll()
    // Fetch a sprite by creating in-memory Image elements.
    .flatMap(imageEl)
    // Return the url for the loaded sprite.
    .map(i => i.src);

  return Observable
    .combineLatest(
      [spriteData$, fetchedSprites$],
      (spriteData, fetchedSprite) => ({
        spriteData,
        sprite: {
          url: fetchedSprite,
          dimension: spriteData.spriteDimension
        }
      })
    )
    .flatMap(x =>
      x.spriteData.imageCoords.map(imageCoord => ({
        sprite: x.sprite,
        image: {
          coord: imageCoord,
          dimension: x.spriteData.imageDimension
        }
      }))
    );
}

export default function AnimatedComicBackground(win, $container, pixelDensity) {
  const pixelDensity$ = Observable.from([pixelDensity]);

  const windowDimension$ = Observable.fromEvent(win, 'resize')
    .map(e => dimensions(e.target))
    .startWith(dimensions(win));

  const spriteData$ = pixelDensity$
    .map(p => {
      let jsonFileName;

      if (p > 1) {
        jsonFileName = 'comics@2x';
      } else {
        jsonFileName = 'comics';
      }

      return `/assets/sprites/${jsonFileName}.json`;
    })
    .flatMap(url => $.fetch(url, { responseType: 'json' }))
    .map(data => adjustForPixelDensity(pixelDensity, data.response))
    .share();

  const grid$ = Observable
    .combineLatest(
      [windowDimension$, spriteData$],
      (windowDimension, spriteData) => ({
        windowDimension,
        cellDimension: spriteData.imageDimension
      })
    )
    .map(x => generateGrid(x.windowDimension, x.cellDimension))
    .share();

  const comicsData$ = getComics(grid$, spriteData$);

  const bgData$ = Observable
    .combineLatest([grid$, comicsData$], (grid, comicData) => ({ grid, comicData }))
    .scan((acc, next) => {
      const { grid, comicData } = next;
      acc.grid = grid;
      acc.comicsData.push(comicData);
      return acc;
    }, { grid: null, comicsData: [] });

  let windowAnimationRequest = null;

  bgData$.subscribe(data => {
    const { grid, comicsData } = data;

    // We want to set 50% of the comics to be available before we render.  Then
    // we will render the grid.
    const totalGridCells = grid.cells.length;
    const halfPoint = Math.round(totalGridCells / 2);

    if (!grid.animationState.halfPointInitialised
       && comicsData.length >= halfPoint) {
      // Let's begin!

      for (let i = 0; i < halfPoint; i++) {
        const comicData = comicsData[i];
        const comic = comicEl(comicData);
        const cell = grid.cells[i];
        classie.add(comic, 'faded');
        cell.html._.contents(comic);

        grid.animationState.nextComicIndex++;
        grid.animationState.nextCellIndex++;
      }

      grid.animationState.halfPointInitialised = true;

      const startNewComicTimer = () => {
        setTimeout(() => {
          // first get the next comic
          let nextComicIndex = grid.animationState.nextComicIndex;
          if (nextComicIndex >= comicsData.length) {
            nextComicIndex = 0;
            grid.animationState.nextComicIndex = 0;
          }
          const comicData = comicsData[nextComicIndex];
          const comic = comicEl(comicData);

          // now get the next cell
          let nextCellIndex = grid.animationState.nextCellIndex;
          if (nextCellIndex >= grid.cells.length) {
            nextCellIndex = 0;
            grid.animationState.nextCellIndex = 0;
          }
          const cell = grid.cells[nextCellIndex];

          cell.html.innerHTML = '';
          cell.html._.contents(comic);
          cell.animationState.fadeDown = true;

          grid.animationState.nextComicIndex++;
          grid.animationState.nextCellIndex++;

          startNewComicTimer();
        }, getRandomInt(400, 800));
      };

      const randomTimeNewComic = () => {
        setTimeout(() => {
          startNewComicTimer();
        }, getRandomInt(100, 400));
      };

      for (let i = 0; i < 4; i++) {
        randomTimeNewComic();
      }

      /*
      if (!grid.cellsFull) {
        const emptyCells = grid.cells.filter(c => c.hasContent === false);

        if (emptyCells.length === 0) {
          grid.cellsFull = true;
        } else {
          emptyCells[0].html._.contents(comic);
          emptyCells[0].hasContent = true;
        }
      }
      */
    }

    const startAnimation = () => {
      const fps = 30;
      const interval = 1000 / fps;
      let then = new Date().getTime();
      let oldtime = 0;

      return (function loop(time) {
        windowAnimationRequest = requestAnimationFrame(loop);

        const now = new Date().getTime();
        const delta = now - then;

        if (delta > interval) {
          // update time stuffs
          then = now - (delta % interval);

          // calculate the frames per second
          const actualFPS = 1000 / (time - oldtime);
          oldtime = time;

          const speed = 1;
          paintGrid($container, grid, speed);
        }
      }(0));

      /*
      // Now, schedule in our animations
      const animationFrame = () => {
        const speed = 0.01;
        paintGrid($container, grid, speed);

        windowAnimationRequest = window.requestAnimationFrame(animationFrame);
      };

      windowAnimationRequest = window.requestAnimationFrame(animationFrame);
      */
    };

    if (!grid.animationState.animationStarted) {
      grid.animationState.animationStarted = true;

      // First cancel any animations, this could happen due to grid resize, so
      // a new grid would be passed in without the animationStarted flag set.
      if (windowAnimationRequest) {
        window.cancelAnimationFrame(windowAnimationRequest);

        setTimeout(() => {
          startAnimation();
        }, 1000);
      } else {
        startAnimation();
      }
    }
  });
}
