import curry from 'ramda/src/curry';
import concat from 'ramda/src/concat';
import mergeWith from 'ramda/src/mergeWith';

/**
 * If two properties collide in our merging process then this function is
 * used to resolve what value should be returned.
 *
 * NOTE: If undefined is returned then the conflicted property is ignored.
 *
 * @param  {Any} a - The first objects conflicted property value.
 * @param  {Any} b - The second objects conflicted property value.
 *
 * @return {Any} The result.
 */
const conflictResolver = curry((a, b) => {
  /**
   * If the current property being merged is an Array then we just use
   * standard array concatonation.
   */
  if (Array.isArray(a)) {
    return concat(a, b);
  }

  /**
   * If the current property being merged is an Object then we will call
   * our deepMerge util again.  This recursiveness makes deepMerge do what
   * it says it does.
   */
  if (a instanceof Object) {
    return deepMerge(a, b); // eslint-disable-line no-use-before-define
  }

  return void 0;
});

/**
 * Provides a mechanism to do deep merging on two object trees.
 *
 * @param  {Object} l - The first object.
 * @param  {Object} r - The second object.
 * @return {Object} The merge result.
 */
export const deepMerge = (l, r) => {
  return mergeWith(conflictResolver, l, r);
};
