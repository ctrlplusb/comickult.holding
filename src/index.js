// import 'babel-polyfill';
import 'blissfuljs';
import { Observable } from 'rx';
import { DOM } from 'rx-dom';
import { comicEl, imageEl } from './dom';

// blissfuljs global
const { $ } = window;

// The mounting point of our application.
const $holding = $('.holding-app');

// Side Effects!
function appendChildren($parent, children) {
  $parent._.contents(children);
}

/**
 * Get the current window pixel density. We'll default it to a
 * density of 2 for browsers that don't support this property.
 *
 * NOTE: not IE safe.
 */
const pixelDensity$ = Observable.from([window.devicePixelRatio || 2]);

const spritesSourceDataUrl$ = pixelDensity$
  .map(p => {
    let jsonFileName;

    if (p > 1) {
      jsonFileName = 'comics@2x';
    } else {
      jsonFileName = 'comics';
    }

    return `/assets/sprites/${jsonFileName}.json`;
  });

const spritesSourceData$ = spritesSourceDataUrl$
  .flatMap(url => DOM.getJSON(url));

const spriteUrl$ = spritesSourceData$
  // Get the sprite urls.
  .flatMap(data => data.spriteUrls)
  // Pre-load each image by creating in-memory Image elements.
  .flatMap(imageEl)
  // Return the url for each of the loaded images.
  .map(i => i.src);

const imageCoords$ = spritesSourceData$
  // get the image coordinates
  .flatMap(data => data.imageCoords)
  // convert the image coordinates to an array single observable result.
  .toArray();

const comicElement$ = Observable
  .combineLatest(
    [spriteUrl$, imageCoords$],
    (url, coords) =>
      coords.map(coord => comicEl(url, coord)));

comicElement$.subscribe(x => appendChildren($holding, x));
spriteUrl$.subscribe(x => console.dir(x));
// imageCoords$.subscribe(x => console.dir(x));
