// Libraries
import classie from 'desandro-classie';
import { Observable } from 'rx';

// Utils.
import { getRandomInt } from '../utils/math';
import { dimensions } from '../utils/window';

// Helpers.
import createGrid from './createGrid';
import getComics from './getComics';
import comicEl from './comicEl';

// Styles
import './styles.css';

import spriteData from './spriteData';

// blissfuljs global
const { $ } = window;

let windowAnimationRequest = null;
const comicLowOpacity = 0.3;

function updateGrid($container, grid, speed) {
  const { cells, gridDef } = grid;

  // Calculate the opacity
  cells
    .filter(c => c.animationState.fadeDown)
    .forEach((c) => {
      const newOpac = c.animationState.fadeDownCurrentOpacity - 0.01;
      c.html.children[0]._.set({ style: { opacity: newOpac } });

      if (newOpac <= comicLowOpacity) {
        c.animationState.fadeDown = false;
        c.animationState.fadeDownCurrentOpacity = 1;
      } else {
        c.animationState.fadeDownCurrentOpacity = newOpac;
      }
    });

  // Calculate new positions
  cells.forEach((c) => {
    c.animationState.top -= (speed - c.animationState.colSpeedMod);

    if (c.animationState.top < (c.dimension.height * -1)) {
      c.animationState.top = gridDef.dimension.height - c.dimension.height;
    }
  });

  cells.forEach((c) => {
    c.html.style.transform = `translateY(${c.animationState.top}px)`;
  });

  if (!grid.rendered) {
    $container.innerHTML = '';
    $container._.contents(cells.map(r => r.html));
    grid.rendered = true;
  }
}

function renderGrid(grid, comicsData, halfPoint) {
  const $gridContainer = $('.comicGrid');

  for (let i = 0; i < halfPoint; i += 1) {
    const comicData = comicsData[i];
    const comic = comicEl(comicData);
    const cell = grid.cells[i];
    comic._.set({ style: { opacity: comicLowOpacity } });
    cell.html._.contents(comic);
    cell.comic = comic;

    grid.animationState.nextComicIndex += 1;
    grid.animationState.nextCellIndex += 1;
  }

  grid.animationState.halfPointInitialised = true;

  classie.add($('.loading'), 'fade');

  const startNewComicTimer = () => {
    setTimeout(() => {
      // first get the next comic
      let nextComicIndex = grid.animationState.nextComicIndex;
      if (nextComicIndex >= comicsData.length) {
        nextComicIndex = 0;
        grid.animationState.nextComicIndex = 0;
      }
      const comicData = comicsData[nextComicIndex];

      // now get the next cell
      let nextCellIndex = grid.animationState.nextCellIndex;
      if (nextCellIndex >= grid.cells.length) {
        nextCellIndex = 0;
        grid.animationState.nextCellIndex = 0;
      }
      const cell = grid.cells[nextCellIndex];

      if (!cell.comic) {
        cell.html.innerHTML = '';
        const comic = comicEl(comicData);
        cell.html._.contents(comic);
      } else {
        cell.comic.style.backgroundImage = `url(${comicData.sprite.url})`;
      }

      cell.animationState.fadeDown = true;

      grid.animationState.nextComicIndex += 1;
      grid.animationState.nextCellIndex += 1;

      startNewComicTimer();
    }, getRandomInt(400, 1300));
  };

  const randomTimeNewComic = () => {
    setTimeout(() => {
      startNewComicTimer();
    }, getRandomInt(100, 800));
  };

  for (let i = 0; i < 4; i += 1) {
    randomTimeNewComic();
  }

  const startAnimation = () => {
    const fps = 60;
    const interval = 1000 / fps;
    let then = new Date().getTime();

    return (function loop() {
      windowAnimationRequest = requestAnimationFrame(loop);

      const now = new Date().getTime();
      const delta = now - then;

      if (delta > interval) {
        // update time stuffs
        then = now - (delta % interval);

        const speed = 0.5;
        updateGrid($gridContainer, grid, speed);
      }
    }(0));
  };

  if (!grid.animationState.animationStarted) {
    grid.animationState.animationStarted = true;

    // First cancel any animations, this could happen due to grid resize, so
    // a new grid would be passed in without the animationStarted flag set.
    if (windowAnimationRequest) {
      window.cancelAnimationFrame(windowAnimationRequest);

      setTimeout(() => {
        startAnimation();
      }, 1000);
    } else {
      startAnimation();
    }
  }
}

function background(win, pixelDensity) {
  const pixelDensity$ = Observable.from([pixelDensity]);

  const windowDimension$ = Observable.fromEvent(win, 'resize')
    .map(e => dimensions(e.target))
    .startWith(dimensions(win));

  const spriteData$ = pixelDensity$
    .map((p) => {
      let sd;

      if (p > 1) {
        sd = spriteData.find(x => x.pixelDensity === 2);
      } else {
        sd = spriteData.find(x => x.pixelDensity === 1);
      }

      return sd;
    })
    .share();

  const grid$ = Observable
    .combineLatest(
      [windowDimension$, spriteData$],
      (windowDimension, sd) => ({
        windowDimension,
        cellDimension: sd.imageDimension
      })
    )
    .map(x => createGrid(x.windowDimension, x.cellDimension))
    .share();

  const comicsData$ = getComics(grid$, spriteData$);

  const bgData$ = Observable
    .combineLatest([grid$, comicsData$], (grid, comicData) => ({ grid, comicData }))
    .scan((acc, next) => {
      const { grid, comicData } = next;
      acc.grid = grid;
      acc.comicsData.push(comicData);
      return acc;
    }, { grid: null, comicsData: [] });

  bgData$.subscribe((data) => {
    const { grid, comicsData } = data;

    // We want to set 50% of the comics to be available before we render.  Then
    // we will render the grid.
    const totalGridCells = grid.cells.length;
    const halfPoint = Math.round(totalGridCells / 2);

    // We only want to start the rendering after we have at least half the
    // available comics.
    if (!grid.animationState.halfPointInitialised && comicsData.length >= halfPoint) {
      // Let's begin!

      renderGrid(grid, comicsData, halfPoint);
    }
  });
}

export default background;
