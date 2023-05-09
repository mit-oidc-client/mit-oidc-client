/**
 * Check if two sets contain the same elements
 * 
 * Taken from: https://stackoverflow.com/questions/31128855/comparing-ecma6-sets-for-equality
 * @param xs a set
 * @param ys other set
 * @returns whether they contain same elements
 */
function eqSet (xs: Set<String>, ys: Set<String>) {
    return xs.size === ys.size &&
    [...xs].every((x) => ys.has(x));
}

export {eqSet}
