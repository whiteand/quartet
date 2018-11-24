const validate = require('../validate')
const { is } = validate
module.exports = function explain (
  schema,
  getExplanation = (value, ...parents) => ({ value, parents })
) {
  const isValid = this(schema)
  const f = (obj, ...parents) => {
    if (isValid(obj, ...parents)) {
      return true
    }
    const explanation = is(getExplanation)('function')
      ? getExplanation(obj, ...parents)
      : getExplanation

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
