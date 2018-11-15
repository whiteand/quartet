const { is, isnt } = require('./validate')
const _clone = (value, history, keyHistory, recursivePaths) => {
  if (isnt(value)('object', 'array')) return value
  const previousIndex = history.indexOf(value)
  if (previousIndex >= 0) {
    const shortPath = keyHistory.slice(0, previousIndex + 1)
    const longPath = [...keyHistory]
    recursivePaths.push({
      shortPath,
      longPath
    })
    return value
  }

  if (is(value)('array')) {
    return value.map((v, i) => _clone(v, [...history, value], [...keyHistory, i], recursivePaths))
  }
  return Object.entries(value)
    .reduce((dict, [key, v]) => {
      dict[key] = _clone(v, [...history, value], [...keyHistory, key], recursivePaths)
      return dict
    }, {})
}
const path = path => obj => {
  if (path.length === 0) return obj
  let curObj = obj
  for (const key of path) {
    if (!curObj) return curObj
    curObj = curObj[key]
  }
  return curObj
}
const replaceWithRightReference = (obj, { shortPath, longPath }) => {
  const shortValue = path(shortPath.slice(0, -1))(obj)
  const innerValue = path(longPath.slice(0, -1))(obj)
  innerValue[longPath[longPath.length - 1]] = shortValue
  return obj
}

const fixRecursivity = (clonned, recursivityInfo) => {
  return recursivityInfo.reduce(replaceWithRightReference, clonned)
}

const clone = value => {
  const recursivityInfo = []
  const clonned = _clone(value, [], [], recursivityInfo)

  return fixRecursivity(clonned, recursivityInfo)
}
module.exports = clone
