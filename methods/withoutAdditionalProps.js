const { is, isnt } = require('../validate')
module.exports = function withoutAdditionalProps (schema) {
  while (is(schema)('string', 'symbol')) {
    schema = this.registered[schema]
  }
  if (isnt(schema)('object')) {
    throw new TypeError('Schema must be an object schema')
  }
  return this({ ...schema, ...this.rest(() => false) })
}
