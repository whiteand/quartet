const clone = require('./clone')
const NODE_TYPES = {
  EMPTY: Symbol('NODE_TYPES.EMPTY'),
  DEFAULT: Symbol('NODE_TYPES.DEFAULT')
}

function fixTree (fix = null, children = {}) {
  return {
    fix,
    children
  }
}

function fixByTree (tree, value) {
  return value
}

function appendTree (path, type, data, tree) {
  const newTree = clone(tree)
  let currentNode = newTree
  for (const key of path) {
    if (currentNode.children[key]) {
      currentNode = currentNode.children[key]
      continue
    }
    currentNode.children[key] = fixTree()
    currentNode = currentNode.children[key]
  }
  currentNode.fix = { type, ...data }
  return newTree
}

module.exports = {
  fixTree,
  fixByTree,
  appendTree,
  NODE_TYPES
}