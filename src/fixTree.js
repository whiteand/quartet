const clone = require('./clone')
const ParentKey = require('./ParentKey')
const FIX_TYPES = {
  DEFAULT: Symbol('FIX_TYPES.DEFAULT'),
  FUNCTION: Symbol('FIX_TYPES.FUNCTION'),
  FILTER: Symbol('FIX_TYPES.FILTER')
}

const VALUE_KEY = 'value'

const FIXERS = {
  [FIX_TYPES.DEFAULT]: ({ defaultValue }) => (value, { key, parent }, ...parents) => {
    parent[key] = defaultValue
  },
  [FIX_TYPES.FUNCTION]: ({ fixFunction }) => (value, ...parents) => {
    fixFunction(value, ...parents)
  },
  [FIX_TYPES.FILTER]: (input) => (value, ...parents) => {
    const { keys } = input
    const [numbers, props] = keys.reduce(([num, props], v) => {
      if (typeof v === 'number') {
        num.push(v)
      } else {
        props.push(v)
      }
      return [num, props]
    }, [[], []])
    numbers.sort((a, b) => b - a)
    for (const index of numbers) {
      value.splice(index, 1)
    }
    for (const key of props) {
      delete value[key]
    }
  }
}

function fixTree (fixes = null, children = {}) {
  return {
    fixes,
    children
  }
}
const RANGES = {
  [FIX_TYPES.FUNC]: 0,
  [FIX_TYPES.DEFAULT]: 0,
  [FIX_TYPES.FILTER]: 1
}
const TO_CHILDREN = {
  [FIX_TYPES.FILTER]: true
}
function getFixesToBeApplied (fixes) {
  const range = RANGES[fixes[0].type]
  const lastFix = [fixes[fixes.length - 1]]
  const isUniq = range === 0
  return isUniq
    ? lastFix
    : fixes
}
function _fixByTree (tree, value, ...parents) {
  if (!tree) return
  const { fixes, children } = tree
  if (!fixes && children) {
    for (const [key, child] of Object.entries(children)) {
      _fixByTree(child, value[key], new ParentKey(value, key), ...parents)
    }
    return
  }
  const fixesToBeApplied = getFixesToBeApplied(fixes)
  let toChild = fixesToBeApplied.every(fix => TO_CHILDREN[fix.type])
  if (toChild) {
    for (const [key, child] of Object.entries(children)) {
      _fixByTree(child, value[key], new ParentKey(value, key), ...parents)
    }
  }

  for (const fix of fixesToBeApplied) {
    FIXERS[fix.type](fix)(value, ...parents)
  }
}
function isEmptyTree (tree) {
  return !tree ||
    (
      tree.children[VALUE_KEY] === null &&
      !tree.fixes
    )
}
function fixByTree (tree, value) {
  if (isEmptyTree(tree)) return clone(value)
  const outerValue = {
    [VALUE_KEY]: clone(value)
  }
  _fixByTree(tree, outerValue)
  return outerValue[VALUE_KEY]
}

function getNodeAndParentByPath (path, tree) {
  let parents = []
  let currentNode = tree

  for (const key of path) {
    if (!currentNode.children[key]) {
      currentNode.children[key] = fixTree()
    }
    parents.push(currentNode)
    currentNode = currentNode.children[key]
  }

  return { node: currentNode, parents }
}
const insertByRange = (type, fixNode, node, parents, data) => {
  if (!node.fixes) {
    node.fixes = [fixNode]
    return true
  }
  if (node.fixes.some(e => RANGES[e.type] > RANGES[type])) {
    node.fixes = [fixNode]
    return true
  }
  return false
}
const appendTypeFix = {
  [FIX_TYPES.DEFAULT]: (node, parents, data) => {
    const fixNode = { type: FIX_TYPES.DEFAULT, ...data }
    if (insertByRange(FIX_TYPES.DEFAULT, fixNode, node, parents, data)) return

    node.fixes = node.fixes.filter(e => e.type !== FIX_TYPES.DEFAULT)
    node.fixes.push(fixNode)
  },
  [FIX_TYPES.FUNCTION]: (node, parents, data) => {
    const fixNode = { type: FIX_TYPES.FUNCTION, ...data }
    if (insertByRange(FIX_TYPES.FUNCTION, fixNode, node, parents, data)) return
    node.fixes = node.fixes.filter(e => e.type !== FIX_TYPES.FUNCTION)
    node.fixes.push(fixNode)
  },
  [FIX_TYPES.FILTER]: (node, parents, data) => {
    const fixNode = { type: FIX_TYPES.FILTER, keys: [data.key] }
    if (insertByRange(FIX_TYPES.FILTER, fixNode, node, parents, data)) return
    node.fixes[0].keys.push(data.key)
  }
}

function appendTree (path, type, data, tree) {
  const newTree = clone(tree)
  const { node, parents } = getNodeAndParentByPath(path, newTree)
  appendTypeFix[type](node, parents, data)
  return newTree
}

module.exports = {
  fixTree,
  fixByTree,
  appendTree,
  FIX_TYPES,
  VALUE_KEY,
  isEmptyTree
}
