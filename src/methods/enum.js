const addMetaData = require('../addMetaData')
const TYPES = require('../types')
module.exports = {
  enum (...values) {
    const valuesSet = new Set(values)
    return addMetaData(
      value => valuesSet.has(value),
      TYPES.ENUM,
      { schema: values }
    )
  }
}
