const validate = require('../validate')
const { is, isnt } = validate
module.exports = function throwError (schema, getErrorMessage = 'Validation error') {
  validate.schema(schema)
  if (isnt(getErrorMessage)('string', 'function')) {
    throw new TypeError('getErrorMessage must be string|function(): string')
  }
  const isValid = this(schema)
  return (value, ...parents) => {
    while (is(getErrorMessage)('function')) {
      getErrorMessage = getErrorMessage(value, ...parents)
    }
    if (isnt(getErrorMessage)('string')) {
      throw new TypeError('Returned value of getErrorMessage is not a string')
    }
    if (!isValid(value, ...parents)) {
      throw new TypeError(getErrorMessage)
    }
    return value
  }
}
