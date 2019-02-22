const validate = require('../validate')
const addMetaData = require('../addMetaData')
const TYPES = require('../types')
module.exports = function not(schema) {
  validate.schema(schema)
  const isValid = this(schema)
  return addMetaData(
    (value, ...parents) => !isValid(value, ...parents),
    TYPES.NOT,
    { schema }
  )
}
