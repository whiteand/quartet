const validate = require('../validate')
const { is } = validate

const requiredValidator = (_, parentAndKey) => {
  if (!parentAndKey) {
    return true
  }
  return Object.prototype.hasOwnProperty.call(parentAndKey.parent, parentAndKey.key)
}

module.exports = function requiredIf (schema) {
  if (is(schema)('boolean')) {
    return schema
      ? requiredValidator
      : () => true
  }
  validate.schema(schema)
  const isValid = this(schema)
  return (value, ...parents) => {
    const isRequired = isValid(value, ...parents)
    return isRequired
      ? requiredValidator(value, ...parents)
      : true
  }
}
