const validate = require('../validate')
const addMetaData = require('../addMetaData')
const TYPES = require('../types')

module.exports = function parent(schema) {
  validate.schema(schema)
  const isValid = this(schema)
  return addMetaData(
    (_, ...parents) => {
      if (parents.length === 0) {
        return false
      }
      const [{ parent }] = parents
      return isValid(parent, ...parents.slice(1))
    },
    TYPES.PARENT,
    { schema }
  )
}
