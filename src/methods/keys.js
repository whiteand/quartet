const validate = require('../validate')
module.exports = function keys (schema) {
  validate.schema(schema)
  const isValidKey = this(schema)
  return dict => {
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
  }
}
