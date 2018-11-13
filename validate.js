const getType = value => {
  if (Array.isArray(value)) {
    return 'array'
  }
  if (value === null) {
    return 'null'
  }
  return typeof value
}
const is = function isValueHasSomeOfTheseTypes (value) {
  return (...types) => types.includes(getType(value))
}
const isnt = function isValueHasNotAnyOfTheseTypes (value) {
  return (...types) => !types.includes(getType(value))
}

const validateConfig = function isConfigHasValidType (config) {
  if (isnt(config)('string', 'array', 'function', 'object', 'symbol')) {
    throw new TypeError('config must be string|symbol|array|function|object. JSON: ' + JSON.stringify(config))
  }
  return config
}

const validateRecursivity = (obj, errorMessage, history = []) => {
  if (isnt(obj)('object', 'array')) {
    return obj
  }

  if (history.includes(obj)) {
    throw new TypeError(errorMessage)
  }

  for (const v of Object.values(obj)) {
    validateRecursivity(v, errorMessage, [...history, obj])
  }

  return obj
}

module.exports = {
  getType,
  is,
  isnt,
  config: validateConfig,
  recursive: validateRecursivity
}
