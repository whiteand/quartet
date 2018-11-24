const validate = require('../validate')
module.exports = function not (schema) {
  validate.schema(schema)
  const isValid = this(schema)
  return (value, ...parents) => !isValid(value, ...parents)
}
