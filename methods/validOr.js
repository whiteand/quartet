const validate = require('../validate')
module.exports = function validOr (schema, defaultValue) {
  validate.schema(schema)
  const isValid = this(schema)
  return (value, ...parents) => {
    if (!isValid(value, ...parents)) {
      return defaultValue
    }
    return value
  }
}
