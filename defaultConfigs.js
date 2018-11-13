const { getType } = require('./validate')
function isEmpty (value) {
  switch (getType(value)) {
    case 'array': return value.length === 0
    case 'null': return true
    default: return !value
  }
}

module.exports = () => ({
  string: x => typeof x === 'string',
  null: x => x === null,
  undefined: x => x === undefined,
  nil: x => x === null || x === undefined,
  number: x => typeof x === 'number',
  'safe-integer': x => Number.isSafeInteger(x),
  finite: x => Number.isFinite(x),
  positive: x => x > 0,
  negative: x => x < 0,
  'non-negative': x => x >= 0,
  'non-positive': x => x <= 0,
  object: x => typeof x === 'object',
  array: x => Array.isArray(x),
  'not-empty': x => !isEmpty(x),
  'object!': x => typeof x === 'object' && x !== null,
  boolean: x => typeof x === 'boolean',
  symbol: x => typeof x === 'symbol',
  function: x => typeof x === 'function',
  log: (value, ...parents) => {
    console.log({ value, parents })
    return true
  },
  required: (_, parentKeyValue) => {
    if (!parentKeyValue) {
      return true
    }
    const { key, parent } = parentKeyValue
    return Object.prototype.hasOwnProperty.call(parent, key)
  }
})
