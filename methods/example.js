const validate = require('../validate')
const { FIX_TREE } = require('../symbols')

module.exports = function example (schema, ...values) {
  validate.schema(schema)
  if (!values.length) {
    throw new TypeError('There is not any example')
  }
  const { explanation, [FIX_TREE]: fixTree } = this

  this()
  values.forEach(this.throwError(schema, `Examples don't match the schema`))
  this.explanation = explanation
  this[FIX_TREE] = fixTree
  return this(schema)
}
