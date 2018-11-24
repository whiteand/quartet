const { isnt, getType } = require('../validate')
module.exports = function max (maxValue) {
  if (isnt(maxValue)('number')) {
    throw new TypeError('maxValue must be a number')
  }
  return value => {
    switch (getType(value)) {
      case 'string':
      case 'array':
        return value.length <= maxValue
      case 'number':
        return value <= maxValue
      default:
        return false
    }
  }
}
