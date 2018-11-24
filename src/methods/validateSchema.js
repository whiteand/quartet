const validate = require('../validate')
module.exports = function validateSchema (schema) {
  validate.recursive(schema, 'Schema must be not recursive')
  if (!this.isValidSchema(schema)) {
    throw new TypeError('schema must be string|symbol|array|function|object')
  }
  return schema
}
