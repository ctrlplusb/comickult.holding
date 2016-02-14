// Polyfills
import './polyfills/requestAnimation';
import 'blissfuljs';
import background from './background';

import './main.css';

/**
 * Get the current window pixel density. We'll default it to a
 * density of 2 for browsers that don't support this property.
 *
 * NOTE: not IE safe.
 */
const pixelDensity = window.devicePixelRatio || 2;

// Initialise the animated background.
background(window, pixelDensity);
