import 'normalize.css';
import 'blissfuljs';
import comics from './comics';

// The blissfuljs mounted global.
const { $ } = window;

/**
 * Get the current window pixel density. We'll default it to a
 * density of 2 for browsers that don't support this property.
 *
 * NOTE: not IE safe.
 */
const pixelDensity = window.devicePixelRatio || 2;

comics(window, $('.comicGrid'), pixelDensity);
