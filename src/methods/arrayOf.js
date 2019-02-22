const validate = require('../validate')
const ParentKey = require('../ParentKey')
const addMetaData = require('../addMetaData')
const TYPES = require('../types')

module.exports = function arrayOf (schema) {
  validate.schema(schema)
  const isValidElem = this(schema)
  return addMetaData(
    (arr, ...parents) => {
      if (!Array.isArray(arr)) {
        return false
      }
      if (!this.allErrors) {
        return arr.every((el, i) => isValidElem(el, new ParentKey(arr, i), ...parents))
      }
      let isValidArr = true
      for (let i = 0; i < arr.length; i++) {
        const innerValidationResult = isValidElem(arr[i], new ParentKey(arr, i), ...parents)
        if (!innerValidationResult) {
          isValidArr = false
        }
      }
      return isValidArr
    },
    TYPES.ARRAY_OF,
    { schema }
  )
}
