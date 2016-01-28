import { Observable } from 'rx';
import { DOM } from 'rx-dom';

// blissfuljs global
const { $ } = window;

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

export default function comicElements(pixelDensity) {
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
    .flatMap(url => DOM.getJSON(url));

  const spriteUrl$ = spritesSourceData$
    // Get the sprite urls.
    .flatMap(data => data.spriteUrls)
    // Pre-load each image by creating in-memory Image elements.
    .flatMap(imageEl)
    // Return the url for each of the loaded images.
    .map(i => i.src);

  const spriteDimension$ = spritesSourceData$
    .map(data => data.spriteDimension);

  const imageCoords$ = spritesSourceData$
    // get the image coordinates
    .flatMap(data => data.imageCoords)
    // convert the image coordinates to an array single observable result.
    .toArray();

  return Observable
    .combineLatest(
      [spriteUrl$, spriteDimension$, imageCoords$, pixelDensity$],
      (url, dim, coords, density) => {
        // We need to adjust the sprite dimensions as well as the coordinates
        // of each of the images within the sprite to be respective of our
        // target pixel density.

        let dxDim;
        let dxCoords;

        if (density > 1) {
          dxDim = {
            w: dim.w / density,
            h: dim.h / density,
          };
          dxCoords = coords.map(c => ({
            w: c.w / density,
            h: c.h / density,
            x: c.x / density,
            y: c.y / density,
          }));
        } else {
          dxDim = dim;
          dxCoords = coords;
        }

        // Now, using our density adjusted dimensions and coordinates we can
        // create a comic element.
        return dxCoords.map(dxCoord => comicEl(url, dxDim, dxCoord));
      });
}
