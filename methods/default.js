const validate = require('../validate')
const { VALUE_KEY, FIX_TYPES, appendTree } = require('../fixTree')
const { FIX_TREE } = require('../symbols')
const addExtension = require('../validatorExtension')
const { is } = validate
module.exports = {
  default: function (schema, defaultValue) {
    validate.schema(schema)

    const isValid = this(schema)
    const that = this
    return addExtension(function (value, ...parents) {
      if (isValid(value, ...parents)) {
        return true
      }

      const keys = [VALUE_KEY, ...parents.map(e => e.key).reverse()]

      const actualDefaultValue = is(defaultValue)('function')
        ? defaultValue(value, ...parents)
        : defaultValue

      that[FIX_TREE] = appendTree(keys, FIX_TYPES.DEFAULT, {
        defaultValue: actualDefaultValue
      }, that[FIX_TREE])
      return false
    })
  }
}
