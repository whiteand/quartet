const validate = require('../validate')
const { REST_PROPS } = require('../symbols')
module.exports = function rest (schema) {
  validate.schema(schema)
  return {
    [REST_PROPS]: schema
  }
}
