const validate = require('../validate')

module.exports = function and (...schemas) {
  schemas.forEach(validate.schema)
  return (value, ...parents) => {
    return schemas.map(schema => this(schema)).every(f => f(value, ...parents))
  }
}
