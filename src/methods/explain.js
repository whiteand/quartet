const validate = require('../validate')
const { is } = validate
module.exports = function explain (
  schema,
  getExplanation = (value, schema, ...parents) => ({ value, parents, schema })
) {
  const isValid = this(schema, undefined, { withoutDefaultExplanation: true })
  const f = (obj, ...parents) => {
    if (isValid(obj, ...parents)) {
      return true
    }
    const explanation = is(getExplanation)('function')
      ? getExplanation(obj, schema, ...parents)
      : getExplanation

    if (explanation === undefined) return false

    this.explanation.push(explanation)
    f.explanation.push(explanation)
    return false
  }
  function innerClearContext () {
    f.explanation = []
    return f
  }
  innerClearContext()
  f.clearContext = innerClearContext
  return f
}
