const validate = require('../validate')
const { isnt } = validate
const ParentKey = require('../ParentKey')
module.exports = function dictionaryOf (schema) {
  validate.schema(schema)
  const isValidItem = this(schema)
  return (dict, ...parents) => {
    if (isnt(dict)('object')) return false
    if (!this.allErrors) {
      return Object.entries(dict)
        .every(([key, value]) => isValidItem(value, new ParentKey(dict, key), ...parents))
    }
    let isValidDict = true
    for (const [key, value] of Object.entries(dict)) {
      if (!isValidItem(value, new ParentKey(dict, key), ...parents)) {
        isValidDict = false
      }
    }
    return isValidDict
  }
}
