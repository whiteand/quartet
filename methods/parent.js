const validate = require('../validate')

module.exports = function parent (schema) {
  validate.schema(schema)
  const isValid = this(schema)
  return (_, ...parents) => {
    if (parents.length === 0) {
      return false
    }
    const [{ parent }] = parents
    return isValid(parent, ...parents.slice(1))
  }
}
