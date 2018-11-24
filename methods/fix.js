const { fixByTree } = require('../fixTree')
const { FIX_TREE } = require('../symbols')
const clone = require('../clone')

module.exports = function fix (value) {
  const initialValue = clone(value)
  const fixedValue = fixByTree(this[FIX_TREE], initialValue)
  return fixedValue
}
