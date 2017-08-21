/* Utils functions */

// Deeply copy an object
module.exports.deepCopy = obj => JSON.parse(JSON.stringify(obj))

// Get the maximum value in an array
module.exports.max = array => Math.max.apply(null, array)

// Takes an array of arrays and concats them
module.exports.concat = arrays => Array.prototype.concat.apply([], arrays)
