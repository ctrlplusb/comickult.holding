import { Observable } from 'rx';
import { DOM } from 'rx-dom';
import { DOM as DOMEvents } from 'rx-dom-events';
import { shuffle } from './utils/array';

import './comics.css';

// blissfuljs global
const { $ } = window;

function appendChildren($parent, children) {
  $parent._.contents(children);

  return $parent;
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

// :: (Url, Dimensions, Coords) -> SpriteDomElement
function comicEl(spriteUrl, spriteDimension, cellDimension, imageCoords) {
  const { w: sw, h: sh } = spriteDimension;
  const { x, y } = imageCoords;
  const { w, h } = cellDimension;

  return $.create('div', {
    className: 'comic',
    style: {
      backgroundImage: `url(${spriteUrl})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: `-${x}px -${y}px`,
      backgroundSize: `${sw}px ${sh}px`,
      height: `${h}px`,
      width: `${w}px`
    }
  });
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
  }) ;
}

/**
 * Generates a grid specification based on the given window dimensions and
 * individual comic dimensions.
 *
 * @param  {Object} winDim   The window dimensions.
 * @param  {Object} cellDim The desired cell dimensions.
 * @return {Object}          The grid specification.
 */
function fullScreenGridSpec(winDim, cellDim) {
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

  // Calculate and return the grid total dimensions.
  const dimensions = {
    height: rowCount * cellDim.h,
    width: colCount * cellDim.w
  };

  // Calculate the offset coordinates for the grid based on its extended size.
  const offset = {
    left: Math.round((dimensions.width - winDim.w) / 2) * -1,
    top: Math.round((dimensions.height - winDim.h) / 2) * -1,
  }

  return {
    dimensions,
    offset,
    cells: {
      count: rowCount * colCount,
      rowCount,
      colCount,
      dimensions: {
        width: cellDim.w,
        height: cellDim.h
      }
    }
  };
}

// :: GridDefinition -> Observable [GridNodeElement]
function gridCells(gridSpec) {
  const {
    offset: {
      left: offsetLeft,
      top: offsetTop
    },
    cells: {
      rowCount,
      colCount,
      dimensions: {
        width,
        height
      }
    }
  } = gridSpec;

  const gridElements = [];

  for (let r = 0; r < rowCount; r++)
  for (let c = 0; c < colCount; c++) {
    const left = (c * width) + offsetLeft;
    const top = (r * height) + offsetTop;

    gridElements.push($.create('div', {
      className: 'comicCell',
      style: {
        height: `${height}px`,
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`
      }
    }));
  }

  // We return a shuffled set of the grid elements as this will allow us
  // to mount the images in a "random" manner.
  return Observable.from(shuffle(gridElements));
}

function getEnoughSpriteUrls(spritesSourceData, requiredSpritesCount) {
  const { spriteUrls: urls } = spritesSourceData;
  const required = [];

  while (required.length < requiredSpritesCount) {
    for (let i = 0; i < urls.length; i++) {
      required.push(urls[i]);
      if (required.length === requiredSpritesCount) {
        break;
      }
    }
  }

  return Observable.from(required);
}

export default function comics(win, $container, pixelDensity) {
  const pixelDensity$ = Observable.from([pixelDensity]);

  const spritesSourceData$ = pixelDensity$
    .map(p => {
      let jsonFileName;

      if (p > 1) {
        jsonFileName = 'comics@2x';
      } else {
        jsonFileName = 'comics';
      }

      return `/assets/sprites/${jsonFileName}.json`;
    })
    .flatMap(url => DOM.getJSON(url))
    .map(data => adjustForPixelDensity(pixelDensity, data))
    .share();

  const windowDimension$ = DOMEvents.resize(win)
    .map(e => dimensions(e.target))
    .startWith(dimensions(win));

  const gridSpec$ = Observable
    .combineLatest(
      [ windowDimension$, spritesSourceData$ ],
      (windowDimension, spritesSourceData) => ({
        windowDimension,
        cellDimension: spritesSourceData.imageDimension
      })
    )
    .map(x => fullScreenGridSpec(x.windowDimension, x.cellDimension))
    .share();

  const requiredSpritesCount$ = Observable
    .combineLatest(
      [gridSpec$, spritesSourceData$],
      (gridSpec, spriteSourceData) => ({
        requiredComics: gridSpec.cells.count,
        comicsPerSprite: spriteSourceData.imageCoords.length
      })
    )
    .map(x => {
      return Math.round(x.requiredComics / x.comicsPerSprite)
          // We add an extra sprite sheet if there is a remainder to make
          // sure we will request enough sprite sheets.
          + ((x.requiredComics % x.comicsPerSprite > 0) ? 1 : 0);
    });

  const loadedSpriteUrl$ = Observable
    .combineLatest(
      [ spritesSourceData$, requiredSpritesCount$ ],
      getEnoughSpriteUrls
    )
    .concatAll()
    // Fetch a sprite by creating in-memory Image elements.
    .flatMap(imageEl)
    // Return the url for the loaded sprite.
    .map(i => i.src);

  const comic$ = Observable
    .combineLatest(
      [spritesSourceData$, gridSpec$, loadedSpriteUrl$],
      (spritesSourceData, gridSpec, spriteUrl) => ({
        spriteUrl,
        spriteDimension: spritesSourceData.spriteDimension,
        cellDimension: spritesSourceData.imageDimension,
        imageCoords: spritesSourceData.imageCoords
      })
    )
    .flatMap(x =>
      x.imageCoords.map(ic =>
        comicEl(x.spriteUrl, x.spriteDimension, x.cellDimension, ic))
    )
    .do(x => console.dir(x));

  const gridCell$ = gridSpec$
    .flatMap(gridCells);

  const comicCell$ = Observable
    .zip(
      [gridCell$, comic$],
      (gridCell, comic) => {
        const result = appendChildren(gridCell, comic);
        return result;
      })
    .do(x => console.dir(x));

  comicCell$.subscribe(comicCell => {
      $container._.contents(comicCell);
    });
}
