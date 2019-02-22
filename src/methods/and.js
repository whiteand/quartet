const validate = require('../validate')
const addMetaData = require('../addMetaData')
const TYPES = require('../types')

module.exports = function and(...schemas) {
  schemas.forEach(validate.schema)
  return addMetaData(
    (value, ...parents) => {
      return schemas.map(schema => this(schema)).every(f => f(value, ...parents))
    },
    TYPES.AND,
    { schema: schemas }
  )
}
