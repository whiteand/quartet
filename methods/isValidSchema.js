const validate = require('../validate')
const { getType } = validate
const { REST_PROPS } = require('../symbols')
module.exports = function isValidSchema (schema) {
  try {
    validate.recursive(schema, 'array schema must be not recursive data structure')
  } catch (e) {
    return false
  }
  const t = getType(schema)
  switch (t) {
    case 'array':
      return schema.every(innerSchema => this.isValidSchema(innerSchema))
    case 'object': {
      const isCheckedPropsschemasValid = Object.keys(schema).length === 0 ||
        Object.values(schema).every(innerSchema => this.isValidSchema(innerSchema))
      const isRestPropsValid = schema[REST_PROPS]
        ? this.isValidSchema(schema[REST_PROPS])
        : true
      return isCheckedPropsschemasValid && isRestPropsValid
    }
    case 'function': return true
    case 'string': return this.isValidSchema(this.registered[schema])
    default: return false
  }
}
