const { FIX_TREE } = require('../symbols')
const { isEmptyTree } = require('../fixTree')
module.exports = function hasFixes () {
  return !isEmptyTree(this[FIX_TREE])
}
