const clone = require('./clone')
const ParentKey = require('./ParentKey')
const NODE_TYPES = {
  EMPTY: Symbol('NODE_TYPES.EMPTY'),
  DEFAULT: Symbol('NODE_TYPES.DEFAULT'),
  FUNCTION: Symbol('NODE_TYPES.FUNCTION'),
  FILTER: Symbol('NODE_TYPES.FILTER')
}

const VALUE_KEY = 'value'

const IS_APPENDABLE = {
  [NODE_TYPES.FILTER]: true
}

const FIXERS = {
  [NODE_TYPES.DEFAULT]: ({ defaultValue }) => (value, { key, parent }, ...parents) => {
    parent[key] = defaultValue
  },
  [NODE_TYPES.FUNCTION]: ({ fixFunction }) => (value, ...parents) => {
    fixFunction(value, ...parents)
  },
  [NODE_TYPES.FILTER]: (elements) => (value, ...parents) => {
    const keysToBeRemoved = elements.map(({ key }) => key)
    const [numbers, keys] = keysToBeRemoved.reduce(([num, keys], v) => {
      if (typeof v === 'number') {
        num.push(v)
      } else {
        keys.push(v)
      }
      return [num, keys]
    }, [[], []])
    numbers.sort((a, b) => b - a)
    for (const index of numbers) {
      value.splice(index, 1)
    }
    for (const key of keys) {
      delete value[key]
    }
  }
}

function fixTree (fix = null, type = NODE_TYPES.EMPTY, children = {}) {
  return {
    type,
    fix,
    children
  }
}

function _fixByTree (tree, value, ...parents) {
  if (tree.fix === null) {
    for (const [key, child] of Object.entries(tree.children)) {
      _fixByTree(child, value[key], new ParentKey(value, key), ...parents)
    }
    return
  }
  FIXERS[tree.type](tree.fix)(value, ...parents)
}
function isEmptyTree (tree) {
  return tree.children[VALUE_KEY] === null
}
function fixByTree (tree, value) {
  if (isEmptyTree(tree)) {
    return value
  }
  const valueContext = { [VALUE_KEY]: value }
  _fixByTree(tree, valueContext)
  return valueContext.value
}

function appendTree (path, type, data, tree) {
  const newTree = clone(tree)
  let currentNode = newTree
  for (const key of path) {
    if (currentNode.fix !== null) return newTree
    if (currentNode.children[key]) {
      currentNode = currentNode.children[key]
      continue
    }
    currentNode.children[key] = fixTree()
    currentNode = currentNode.children[key]
  }
  if (currentNode.type === type) {
    if (IS_APPENDABLE[type]) {
      currentNode.fix.push(data)
    } else {
      currentNode.fix = data
    }
    return newTree
  }
  currentNode.type = type
  currentNode.fix = IS_APPENDABLE[type] ? [data] : data
  currentNode.children = {}
  return newTree
}

module.exports = {
  fixTree,
  fixByTree,
  appendTree,
  NODE_TYPES,
  VALUE_KEY,
  isEmptyTree
}
