import { Observable } from 'rx';

// blissfuljs global
const { $ } = window;

let delayCount = 1;

// :: Url -> Observable ImageDomElement
export function imageEl(imgUrl) {
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

// :: (Url,  Coords) -> SpriteDomElement
export function comicEl(url, { x, y, w, h }) {
  return $.create('div', {
    className: 'comic',
    style: {
      backgroundImage: `url(${url})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: `-${x}px -${y}px`,
      height: `${h}px`,
      width: `${w}px`
    }
  });
}
