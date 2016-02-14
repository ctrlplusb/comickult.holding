// http://paulirish.com/2011/requestanimationframe-for-smart-animating/

window.requestAnimationFrame = (() =>
  window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.oRequestAnimationFrame
    || window.msRequestAnimationFrame
    || ((callback) => window.setTimeout(callback, 1000 / 60))
)();

window.cancelRequestAnimationFrame = (() =>
  window.cancelRequestAnimationFrame
    || window.webkitCancelRequestAnimationFrame
    || window.mozCancelRequestAnimationFrame
    || window.oCancelRequestAnimationFrame
    || window.mscancelRequestAnimationFrame
    || window.clearTimeout
)();
