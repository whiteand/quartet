
module.exports = (expect, test) => {
  expect.extend({
    toBeTrueValueOf (received, isValid, validatorName) {
      const pass = isValid(received) === true
      const message = () =>
        `expected ${validatorName}(${JSON.stringify(received)}) to be true`
      return {
        pass,
        message
      }
    },
    toBeFalseValueOf (received, isValid, validatorName) {
      const pass = isValid(received) === false
      const message = () =>
        `expected ${validatorName}(${JSON.stringify(received)}) to be false`
      return { pass, message }
    }
  })

  return ({
    caption,
    isValid,
    trueValues,
    falseValues,
    validatorName = 'isValid'
  }) => {
    test(caption, () => {
      for (const trueValue of trueValues) {
        expect(trueValue).toBeTrueValueOf(isValid, validatorName)
      }
      for (const falseValue of falseValues) {
        expect(falseValue).toBeFalseValueOf(isValid, validatorName)
      }
    })
  }
}
