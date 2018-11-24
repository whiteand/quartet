const validate = require('../validate')
const { VALUE_KEY, FIX_TYPES, appendTree } = require('../fixTree')
const { FIX_TREE } = require('../symbols')
const addExtension = require('../validatorExtension')

module.exports = function filter (schema) {
  validate.schema(schema)
  const isValid = this(schema)
  const that = this
  return addExtension(function (value, ...parents) {
    if (isValid(value, ...parents)) {
      return true
    }

    const keys = [VALUE_KEY, ...parents.map(e => e.key).reverse()]

    that[FIX_TREE] = appendTree(keys.slice(0, -1), FIX_TYPES.FILTER, {
      key: keys[keys.length - 1]
    }, that[FIX_TREE])

    return false
  })
}
