import { Observable } from 'rx';

// :: Url -> Observable ImageDomElement
function imageEl(imgUrl) {
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
}

function getComics(grid$, spriteData$) {
  // Calculate how many sprites we will need to fill the grid.  We'll loop
  // over the available sprites until we are certain we will load enough
  // comics for the grid.  Of course a loop over the sprites implies some
  // duplication.
  const requiredSprites$ = Observable
    .combineLatest(
      [grid$, spriteData$],
      (grid, spriteData) => ({
        requiredComics: grid.cells.length,
        spriteComicCount: spriteData.imageCoords.length
      })
    )
    .map(x => Math.ceil(x.requiredComics / x.spriteComicCount) + 2);

  // We load the sprites by mounting them onto Image DOM Elements.
  const fetchedSprites$ = Observable
    .combineLatest(
      [spriteData$, requiredSprites$],
      (spriteData, requiredSprites) => {
        const { spriteUrls: urls } = spriteData;
        const enoughSprites = [];

        while (enoughSprites.length < requiredSprites) {
          for (let i = 0; i < urls.length; i++) {
            enoughSprites.push(urls[i]);
            if (enoughSprites.length === requiredSprites) {
              break;
            }
          }
        }

        return Observable.from(enoughSprites);
      }
    )
    .concatAll()
    // Fetch a sprite by creating in-memory Image elements.
    .flatMap(imageEl)
    // Return the url for the loaded sprite.
    .map(i => i.src);

  // Return back data representing each individual comic from each sprite,
  // containing it's sprite url info and the coordinates of the comic within
  // the sprite.
  return Observable
    .combineLatest(
      [spriteData$, fetchedSprites$],
      (spriteData, fetchedSprite) => ({
        spriteData,
        sprite: {
          url: fetchedSprite,
          dimension: spriteData.spriteDimension
        }
      })
    )
    .flatMap(x =>
      x.spriteData.imageCoords.map(imageCoord => ({
        sprite: x.sprite,
        image: {
          coord: imageCoord,
          dimension: x.spriteData.imageDimension
        }
      }))
    );
}

export default getComics;
