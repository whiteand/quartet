const { is, isnt } = require('../validate')
const ParentKey = require('../ParentKey')
const addMetaData = require('../addMetaData')
const TYPES = require('../types')
module.exports = function omitInvalidItems(schema) {
  const isValid = this(schema)

  return addMetaData(
    (obj, ...parents) => {
      if (isnt(obj)('array', 'object')) {
        return obj
      }
      if (is(obj)('array')) {
        return obj.filter((value, i) =>
          isValid(value, new ParentKey(obj, i), ...parents)
        )
      }
      return Object.entries(obj)
        .filter(([key, value]) => isValid(value, new ParentKey(obj, key), ...parents))
        .reduce((obj, [key, value]) => {
          obj[key] = value
          return obj
        }, {})
    },
    TYPES.OMIT_INVALID_ITEMS,
    { schema }
  )
}
