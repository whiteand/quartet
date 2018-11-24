const validate = require('../validate')
const addExtension = require('../validatorExtension')
const { VALUE_KEY, appendTree, FIX_TYPES } = require('../fixTree')
const { FIX_TREE } = require('../symbols')
module.exports = function addFix (schema, fixFunction) {
  validate.schema(schema)
  this.throwError('function', 'fixFunction must be a function')(fixFunction)

  const isValid = this(schema)
  const that = this
  return addExtension(function (value, ...parents) {
    if (isValid(value, ...parents)) {
      return true
    }

    const keys = [VALUE_KEY, ...parents.map(e => e.key).reverse()]

    that[FIX_TREE] = appendTree(keys, FIX_TYPES.FUNCTION, {
      fixFunction
    }, that[FIX_TREE])

    return false
  })
}
