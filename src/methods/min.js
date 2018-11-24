const { isnt, getType } = require('../validate')
module.exports = function min (minValue) {
  if (isnt(minValue)('number')) {
    throw new TypeError('minValue must be a number')
  }
  return value => {
    switch (getType(value)) {
      case 'string':
      case 'array':
        return value.length >= minValue
      case 'number':
        return value >= minValue
      default:
        return false
    }
  }
}
