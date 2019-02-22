const addMetaData = require('../addMetaData')
const TYPES = require('../types')
const isRegularExpression = regularExpression => regularExpression && typeof regularExpression.test === 'function'
module.exports = function regex (regularExpression) {
  if (!isRegularExpression(regularExpression)) {
    throw new TypeError('regex can takes only RegExp instances')
  }
  return addMetaData(
    str => regularExpression.test(str),
    TYPES.REGEX,
    { schema: regularExpression }
  )
}
