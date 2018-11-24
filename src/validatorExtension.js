module.exports = validator => {
  validator.clearContext = function () {
    this.explanation = []
    return this
  }

  validator.clearContext()

  return validator.bind(validator)
}
