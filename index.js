const getType = x => {
  if (Array.isArray(x)) {
    return 'array'
  }
  if (x === null) {
    return 'null'
  }
  if (x instanceof Set) {
    return 'set'
  }
  if (x instanceof Map) {
    return 'map'
  }
  if (x instanceof Date) {
    return 'date'
  }
  return typeof x
}

const REST_PROPS = Symbol('REST_PROPS')

const is = value => (...types) => types.includes(getType(value))

const isnt = value => (...types) => !types.includes(getType(value))

const stringCheck = (configName, registered) => (obj, ...parents) => {
  const registeredConfig = registered[configName]
  if (!registeredConfig) {
    throw new TypeError(`Reference to not registered config: ${configName}`)
  }
  return where(registeredConfig, registered)(obj, ...parents)
}

const functionCheck = isValid => (obj, ...parents) => {
  return isValid(obj, ...parents)
}

const objectCheck = (configObj, registered) => (obj, ...parents) => {
  if (isnt(obj)('object')) {
    return false
  }
  let isValid = true
  const notChecked = new Set(Object.keys(obj))
  const checked = new Set()
  
  for (const [key, innerConfig] of Object.entries(configObj)) {
    checked.add(key)
    notChecked.delete(key)
    const value = obj[key]
    const isValidProperty = where(innerConfig, registered)(
      value,
      { key, parent: obj },
      ...parents
    )
    if (!isValidProperty) {
      isValid = false
    }
  }
  // If has no rest validation
  if (is(configObj[REST_PROPS])('undefined')) return isValid

  const restIsValid = where(configObj[REST_PROPS], registered)
  for (const key of notChecked) {
    const value = obj[key]
    const isValidRestValue = restIsValid(value, { key, parent: obj }, ...parents)
    if (!isValidRestValue) {
      isValid = false
    }
  }
  return isValid
}
// Or
const variantCheck = (variantsConfigs, registered) => (obj, ...parents) => {
  return variantsConfigs.some(config => {
    // And
    if (Array.isArray(config)) {
      return config.every(andVariant =>
        where(andVariant, registered)(obj, ...parents)
      )
    }
    return where(config, registered)(obj, ...parents)
  })
}
function validateConfig (config) {
  if (isnt(config)('string', 'function', 'object', 'array')) {
    throw new TypeError(
      'config must be either name of registered config, isValid function or object config'
    )
  }

  return true
}

const check = {
  string: stringCheck,
  function: functionCheck,
  object: objectCheck,
  array: variantCheck
}

function where (config, registered) {
  validateConfig(config)
  return check[getType(config)](config, registered)
}
function checkRecursivity (config, history = []) {
  if (history.includes(config)) {
    throw new TypeError('Config must be not recursive')
  }
  if (isnt(config)('object')) {
    return
  }
  for (const innerConfig of Object.values(config)) {
    checkRecursivity(innerConfig, [...history, config])
  }
}

function isEmpty (x) {
  switch (getType(x)) {
    case 'string':
      return x === ''
    case 'array':
      return x.length === 0
    case 'boolean':
      return x === false
    case 'null':
      return true
    case 'object':
      return false
    case 'number':
      return x === 0
    case 'set':
    case 'map':
      return x.size === 0
    case 'date':
      return false
    case 'undefined':
      return true
    default:
      return !x
  }
}

const getDefaultConfigs = () => ({
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

const newContext = registered => {
  function func (config, registered = func.registered) {
    if (config === undefined) {
      return resetExplanation()
    }
    checkRecursivity(config)
    return where(config, registered)
  }
  function resetExplanation () {
    func.explanation = []
    return func
  }
  resetExplanation()
  if (isnt(registered)('object', 'undefined')) {
    throw new TypeError(
      'registered must be an object { key1: config1, key2: config2, ...}'
    )
  }
  registered = registered || getDefaultConfigs()
  const methods = {
    registered,
    register (additionalRegistered) {
      if (isnt(additionalRegistered)('object')) {
        throw new TypeError('additionalRegistered must be an object')
      }
      for (const config of Object.values(additionalRegistered)) {
        checkRecursivity(config)
        validateConfig(config)
      }

      return newContext({ ...func.registered, ...additionalRegistered })
    },
    isValidConfig (config) {
      try {
        checkRecursivity(config)
        validateConfig(config)
        return true
      } catch (error) {
        return false
      }
    },
    validateConfig (config) {
      checkRecursivity(config)
      validateConfig(config)
    },
    required (...propNames) {
      return obj =>
        propNames.every(prop =>
          Object.prototype.hasOwnProperty.call(obj, prop)
        )
    },
    requiredIf (config) {
      const isRequired = is(config)('boolean') ? () => config : func(config)
      return (obj, ...parents) => {
        if (isRequired(obj, ...parents)) {
          return func('required')(obj, ...parents)
        }
        return true
      }
    },
    arrayOf (config) {
      const isValidElement = func(config)
      return function (arr, ...parents) {
        if (!Array.isArray(arr)) {
          return false
        }
        let isValid = true
        for (let i = 0; i < arr.length; i++) {
          const el = arr[i]
          if (!isValidElement(el, { key: i, parent: arr }, ...parents)) {
            isValid = false
          }
        }
        return isValid
      }
    },
    dictionaryOf (config) {
      const isValidElement = func(config)
      return function (obj, ...parents) {
        if (isnt(obj)('object')) {
          return false
        }
        let isValid = true
        for (const [key, value] of Object.entries(obj)) {
          const isValidValue = isValidElement(
            value,
            { key, parent: obj },
            ...parents
          )
          if (!isValidValue) {
            isValid = false
          }
        }
        return isValid
      }
    },
    keys (config) {
      const isValidKey = func(config)
      return obj => Object.keys(obj).every(isValidKey)
    },
    throwError (config, errorMessage = 'Validation error') {
      if (isnt(errorMessage)('string', 'function')) {
        throw new TypeError(
          'errorMessage must be a string, or function that returns string'
        )
      }
      const isValid = func(config)
      return (obj, ...parents) => {
        if (isValid(obj)) {
          return obj
        }
        if (is(errorMessage)('function')) {
          errorMessage = errorMessage(obj, ...parents)
          if (isnt(errorMessage)('string')) {
            throw new TypeError(
              'errorMessage must be a string, or function that returns string'
            )
          }
        }
        throw new TypeError(errorMessage)
      }
    },
    min (minValue) {
      if (isnt(minValue)('number')) {
        throw new TypeError('minValue must be a number')
      }
      return value => {
        switch (getType(value)) {
          case 'string':
          case 'array':
            return value.length >= minValue
          case 'number':
            return value >= minValue
          case 'set':
          case 'map':
            return value.size >= minValue
          default:
            return false
        }
      }
    },
    max (maxValue) {
      if (isnt(maxValue)('number')) {
        throw new TypeError('maxValue must be a number')
      }
      return value => {
        switch (getType(value)) {
          case 'string':
          case 'array':
            return value.length <= maxValue
          case 'number':
            return value <= maxValue
          case 'set':
          case 'map':
            return value.size <= maxValue
          default:
            return false
        }
      }
    },
    regex (regex) {
      if (!(regex instanceof RegExp)) {
        throw new TypeError('regex can takes only RegExp instances')
      }
      return str => regex.test(str)
    },
    explain (
      config,
      getExplanation = (value, ...parents) => ({ value, parents })
    ) {
      const isValid = func(config)
      function f (obj, ...parents) {
        if (isValid(obj, ...parents)) {
          return true
        }
        const explanation = is(getExplanation)('function')
          ? getExplanation(obj, ...parents)
          : getExplanation
        func.explanation.push(explanation)
        f.explanation.push(explanation)
        return false
      }
      function innerResetExplanation () {
        f.explanation = []
      }
      innerResetExplanation()
      f.resetExplanation = innerResetExplanation
      return f
    },
    not (config) {
      const isValid = func(config)
      return (obj, ...parents) => !isValid(obj, ...parents)
    },
    omitInvalidItems (config) {
      const isValid = func(config)

      return function (obj) {
        if (isnt(obj)('array', 'object')) {
          return obj
        }
        if (is(obj)('array')) {
          return obj.filter((value, i) =>
            isValid(value, { key: i, parent: obj })
          )
        }
        return Object.entries(obj)
          .filter(([key, value]) => isValid(value, { key, parent: obj }))
          .reduce((obj, [key, value]) => {
            obj[key] = value
            return obj
          }, {})
      }
    },
    omitInvalidProps (objConfig, settings = { omitUnchecked: true }) {
      if (isnt(settings)('object')) {
        throw new TypeError('settings must be object')
      }
      if (isnt(settings.omitUnchecked)('boolean', 'undefined')) {
        throw new TypeError(
          'settings.omitUnchecked must be boolean, or undefined'
        )
      }
      const { omitUnchecked: omitUnchecked = true } = settings

      while (isnt(objConfig)('object') && is(objConfig)('string')) {
        objConfig = func.registered[objConfig]
      }
      if (isnt(objConfig)('object')) {
        throw new TypeError('Wrong object config')
      }
      return function (obj) {
        if (isnt(obj)('object')) {
          return obj
        }
        if (!omitUnchecked) {
          const newObj = { ...obj }
          for (const [key, innerConfig] of Object.entries(objConfig)) {
            const isValidProp = func(innerConfig)
            if (!isValidProp(obj[key])) {
              delete newObj[key]
            }
          }
          return newObj
        }
        return Object.entries(objConfig)
          .filter(([key, config]) => {
            const value = obj[key]
            return func(config)(value)
          })
          .reduce((res, [key]) => {
            res[key] = obj[key]
            return res
          }, {})
      }
    },
    validOr (config, defaultValue) {
      validateConfig(config)
      return function (obj) {
        const isValid = func(config)
        if (!isValid(obj)) {
          return defaultValue
        }
        return obj
      }
    },
    enum (...primitive) {
      const elementSet = new Set(primitive)
      return function (value) {
        return elementSet.has(value)
      }
    },
    parent (config) {
      validateConfig(config)
      const isValid = func(config)
      return function (value, parentObj, ...parents) {
        if (!parentObj) return false
        const { parent } = parentObj
        return isValid(parent, ...parents)
      }
    },
    withoutAdditionalProps (objConfig) {
      while (is(objConfig)('string')) {
        objConfig = func.registered[objConfig]
      }
      if (isnt(objConfig)('object')) {
        throw new TypeError('objConfig must be object with required props')
      }
      const possibleProps = new Set(Object.keys(objConfig))
      return function (obj, ...parents) {
        if (isnt(obj)('object')) return false
        const objKeys = Object.keys(obj)
        if (objKeys.some(prop => !possibleProps.has(prop))) {
          return false
        }
        return func(objConfig)(obj, ...parents)
      } 
    },
    rest (config) {
      validateConfig(config)
      return {
        [REST_PROPS]: config
      }
    },
    newContext,
    resetExplanation
  }
  for (const [methodName, method] of Object.entries(methods)) {
    func[methodName] = method
  }
  return func
}

module.exports = newContext
