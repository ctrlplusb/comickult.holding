/**
 * Performs an optimal shuffle on the given array.
 *
 * WARN: This is not a pure function. It modifies the given array in place, and
 * returns the given array back.
 *
 * @param  {Array} array The array to shuffle.
 *
 * @return {Array}       The shuffled array.
 */
export function shuffle(array) {
  let counter = array.length;

  // While there are elements in the array
  while (counter > 0) {
    // Pick a random index
    let index = Math.floor(Math.random() * counter);

    // Decrease counter by 1
    counter--;

    // And swap the last element with it
    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
}
