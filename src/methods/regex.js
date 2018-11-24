module.exports = function regex (regex) {
  if (!(regex instanceof RegExp)) {
    throw new TypeError('regex can takes only RegExp instances')
  }
  return str => regex.test(str)
}
