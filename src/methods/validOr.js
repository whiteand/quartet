const validate = require('../validate')
const addMetaData = require('../addMetaData')
const TYPES = require('../types')
module.exports = function validOr(schema, defaultValue) {
  validate.schema(schema)
  const isValid = this(schema)
  return addMetaData(
    (value, ...parents) => {
      if (!isValid(value, ...parents)) {
        return defaultValue
      }
      return value
    },
    TYPES.VALID_OR,
    { schema, defaultValue }
  )
}
