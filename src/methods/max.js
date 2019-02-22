const { isnt, getType } = require('../validate')
const addMetaData = require('../addMetaData')
const TYPES = require('../types')
module.exports = function max(maxValue) {
  if (isnt(maxValue)('number')) {
    throw new TypeError('maxValue must be a number')
  }
  return addMetaData(
    value => {
      switch (getType(value)) {
        case 'string':
        case 'array':
          return value.length <= maxValue
        case 'number':
          return value <= maxValue
        default:
          return false
      }
    },
    TYPES.MAX,
    { schema: maxValue }
  )
}
