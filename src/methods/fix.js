const { fixByTree } = require('../fixTree')
const { FIX_TREE } = require('../symbols')
const clone = require('../clone')

module.exports = function fix (value) {
  const initialValue = clone(value)
  return fixByTree(this[FIX_TREE], initialValue)
}
