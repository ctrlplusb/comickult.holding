import 'blissfuljs';
import comicElements from './dom/comicElements';
import { DOM as DOMEvents } from 'rx-dom-events';

// The blissfuljs mounted global.
const { $ } = window;

// Ensure our styles are bundled with the app.
import 'normalize.css';
import './styles.css';

// The mounting point of our application.
const $holding = $('.holding-app');

// Side Effects!
function appendChildren($parent, children) {
  $parent._.contents(children);
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

const windowDimension$ = DOMEvents.resize(window)
  .map(e => dimensions(e.target))
  .startWith(dimensions(window));

windowDimension$.subscribe(x => console.log(x));

/**
 * Get the current window pixel density. We'll default it to a
 * density of 2 for browsers that don't support this property.
 *
 * NOTE: not IE safe.
 */
const pixelDensity = window.devicePixelRatio || 2;

const comicElement$ = comicElements(pixelDensity);

comicElement$.subscribe(x => appendChildren($holding, x));
