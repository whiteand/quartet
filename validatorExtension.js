module.exports = validator => {
  validator.resetExplanation = function () {
    this.explanation = []
    return this
  }

  validator.resetExplanation()

  return validator.bind(validator)
}
