import { Observable } from 'rx';
import { DOM } from 'rx-dom';
import { DOM as DOMEvents } from 'rx-dom-events';
import { shuffle } from './utils/array';

import './comics.css';

// blissfuljs global
const { $ } = window;

function appendChildren($parent, children) {
  $parent._.contents(children);
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
  })
  .delay(new Date(Date.now() + (1000 * delayCount)));
}

// :: (Url, Dimensions, Coords) -> SpriteDomElement
function comicEl(spriteUrl, spriteDimensions, imageCoords) {
  const { w: sw, h: sh } = spriteDimensions;
  const { x, y, w, h } = imageCoords;

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

function calculateComicElements(url, dim, coords, density) {
  return dxCoords.map(dxCoord => comicEl(url, dxDim, dxCoord));
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
      className: 'comic',
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
    .do(x => console.dir(x))
    .share();

  const sprite$ = spritesSourceData$
    // Get the sprite urls.
    .flatMap(data => data.spriteUrls)
    // Fetch a sprite by creating in-memory Image elements.
    .flatMap(imageEl)
    // Return the url for the loaded sprite.
    .map(i => i.src);

  const spriteDimension$ = spritesSourceData$
    .map(data => data.spriteDimension);

  const imageDimension$ = spritesSourceData$
    .map(data => data.imageDimension);

  const imageCoords$ = spritesSourceData$
    // get the image coordinates
    .flatMap(data => data.imageCoords)
    // convert the image coordinates to an array single observable result.
    .toArray();

  const windowDimension$ = DOMEvents.resize(win)
    .map(e => dimensions(e.target))
    .startWith(dimensions(win));

  const comicContainer$ = Observable
    .combineLatest(
      [ windowDimension$, imageDimension$ ],
      fullScreenGridSpec
    )
    .flatMap(gridCells)
    .do(x => console.dir(x));

  /*
  const animatedComicBackground = Observable
    .combineLatest(
      [ comicContainer$ ],
      (comicContainer) => ({
        comicContainer
      })
    )
  */

  comicContainer$.subscribe(comicContainer => {
      $container._.contents(comicContainer);
    });

  /*
  const comicElement$ = Observable
    .combineLatest(
      [spriteUrl$, spriteDimension$, imageCoords$, pixelDensity$],
      calculateComicElements
    );

  comicElement$.subscribe(x => appendChildren($holding, x));
  */
}
