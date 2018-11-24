const { isnt } = require('../validate')
module.exports = function register (additionalRegistered) {
  if (isnt(additionalRegistered)('object')) {
    throw new TypeError('additionalRegistered must be an object')
  }
  if (!Object.values(additionalRegistered).every(schema => this.isValidSchema(schema))) {
    throw new TypeError('some of registered schemas is invalid')
  }
  return this.newCompiler({ allErrors: this.allErrors, registered: { ...this.registered, ...additionalRegistered } })
}
