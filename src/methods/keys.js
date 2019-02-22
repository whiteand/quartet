const validate = require('../validate')
const addMetaData = require('../addMetaData')
const TYPES = require('../types')
module.exports = function keys(schema) {
  validate.schema(schema)
  const isValidKey = this(schema)
  return addMetaData(
    dict => {
      if (!this.allErrors) {
        return Object.keys(dict).every(isValidKey)
      }
      let isValidKeys = true
      for (const key of Object.keys(dict)) {
        if (!isValidKey(key)) {
          isValidKeys = false
        }
      }
      return isValidKeys
    },
    TYPES.KEYS,
    { schema }
  )
}
