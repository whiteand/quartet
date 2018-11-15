// This clone function was taken from ramda.
function type (val) {
  return val === null
    ? 'Null'
    : val === undefined
      ? 'Undefined'
      : Object.prototype.toString.call(val).slice(8, -1)
}
const keys = {
  global: 'g',
  ignoreCase: 'i',
  multiline: 'm',
  sticky: 'y',
  unicode: 'u'
}
function getRegexKeys (pattern) {
  return Object.entries(keys)
    .map(([key, text]) => pattern[key] ? text : '')
    .reduce((res, key) => res + key, '')
}
function _cloneRegExp (pattern) {
  return new RegExp(pattern.source, getRegexKeys(pattern))
}
function _clone (value, refFrom, refTo) {
  var copy = function copy (copiedValue) {
    var len = refFrom.length
    var idx = 0
    while (idx < len) {
      if (value === refFrom[idx]) {
        return refTo[idx]
      }
      idx += 1
    }
    refFrom[idx + 1] = value
    refTo[idx + 1] = copiedValue
    for (var key in value) {
      copiedValue[key] = _clone(value[key], refFrom, refTo)
    }
    return copiedValue
  }
  switch (type(value)) {
    case 'Object': return copy({})
    case 'Array': return copy([])
    case 'Date': return new Date(value.valueOf())
    case 'RegExp': return _cloneRegExp(value)
    default: return value
  }
}
function clone (value) {
  return _clone(value, [], [])
}

module.exports = clone
