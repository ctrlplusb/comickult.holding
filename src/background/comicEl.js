// blissfuljs global
const { $ } = window;

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

export default comicEl;
