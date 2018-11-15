const validate = require('./validate')
const { is, getType, isnt } = validate
const { REST_PROPS, FIX_TREE } = require('./symbols')
const ParentKey = require('./ParentKey.js')
const clone = require('./clone')
const { fixByTree, appendTree, NODE_TYPES } = require('./fixTree')

const requiredValidator = (_, parentAndKey) => {
  if (!parentAndKey) {
    return true
  }
  return Object.prototype.hasOwnProperty.call(parentAndKey.parent, parentAndKey.key)
}

module.exports = () => ({
  register (additionalRegistered) {
    if (isnt(additionalRegistered)('object')) {
      throw new TypeError('additionalRegistered must be an object')
    }
    if (!Object.values(additionalRegistered).every(config => this.isValidConfig(config))) {
      throw new TypeError('some of registered configs is invalid')
    }
    return this.newCompiler({ allErrors: this.allErrors, registered: { ...this.registered, ...additionalRegistered } })
  },
  isValidConfig (config) {
    try {
      validate.recursive(config, 'array config must be not recursive data structure')
    } catch (e) {
      return false
    }
    const t = getType(config)
    switch (t) {
      case 'array':
        return config.every(innerConfig => this.isValidConfig(innerConfig))
      case 'object': {
        const isCheckedPropsConfigsValid = Object.keys(config).length === 0 ||
          Object.values(config).every(innerConfig => this.isValidConfig(innerConfig))
        const isRestPropsValid = config[REST_PROPS]
          ? this.isValidConfig(config[REST_PROPS])
          : true
        return isCheckedPropsConfigsValid && isRestPropsValid
      }
      case 'function': return true
      case 'string': return this.isValidConfig(this.registered[config])
      default: return false
    }
  },
  validateConfig (config) {
    validate.recursive(config, 'Config must be not recursive')
    if (!this.isValidConfig(config)) {
      throw new TypeError('config must be string|symbol|array|function|object')
    }
    return config
  },
  and (...configs) {
    configs.forEach(validate.config)
    return (value, ...parents) => {
      return configs.map(config => this(config)).every(f => f(value, ...parents))
    }
  },
  explain (
    config,
    getExplanation = (value, ...parents) => ({ value, parents })
  ) {
    const isValid = this(config)
    const f = (obj, ...parents) => {
      if (isValid(obj, ...parents)) {
        return true
      }
      const explanation = is(getExplanation)('function')
        ? getExplanation(obj, ...parents)
        : getExplanation
      this.explanation.push(explanation)
      f.explanation.push(explanation)
      return false
    }
    function innerResetExplanation () {
      f.explanation = []
      return f
    }
    innerResetExplanation()
    f.resetExplanation = innerResetExplanation
    return f
  },
  regex (regex) {
    if (!(regex instanceof RegExp)) {
      throw new TypeError('regex can takes only RegExp instances')
    }
    return str => regex.test(str)
  },
  parent (config) {
    validate.config(config)
    const isValid = this(config)
    return (value, ...parents) => {
      if (parents.length === 0) {
        return false
      }
      const [{ parent }] = parents
      return isValid(parent, ...parents.slice(1))
    }
  },
  required (...props) {
    return obj => {
      return props.every(prop => Object.prototype.hasOwnProperty.call(obj, prop))
    }
  },
  requiredIf (config) {
    if (is(config)('boolean')) {
      return config
        ? requiredValidator
        : () => true
    }
    validate.config(config)
    const isValid = this(config)
    return (value, ...parents) => {
      const isRequired = isValid(value, ...parents)
      return isRequired
        ? requiredValidator(value, ...parents)
        : true
    }
  },
  enum (...values) {
    const valuesSet = new Set(values)
    return value => valuesSet.has(value)
  },
  arrayOf (config) {
    validate.config(config)
    const isValidElem = this(config)
    return (arr, ...parents) => {
      if (!Array.isArray(arr)) {
        return false
      }
      if (!this.allErrors) {
        return arr.every((el, i) => isValidElem(el, new ParentKey(arr, i), ...parents))
      }
      let isValidArr = true
      for (let i = 0; i < arr.length; i++) {
        const innerValidationResult = isValidElem(arr[i], new ParentKey(arr, i), ...parents)
        if (!innerValidationResult) {
          isValidArr = false
        }
      }
      return isValidArr
    }
  },
  dictionaryOf (config) {
    validate.config(config)
    const isValidItem = this(config)
    return (dict, ...parents) => {
      if (isnt(dict)('object')) return false
      if (!this.allErrors) {
        return Object.entries(dict)
          .every(([key, value]) => isValidItem(value, new ParentKey(dict, key), ...parents))
      }
      let isValidDict = true
      for (const [key, value] of Object.entries(dict)) {
        if (!isValidItem(value, new ParentKey(dict, key), ...parents)) {
          isValidDict = false
        }
      }
      return isValidDict
    }
  },
  keys (config) {
    validate.config(config)
    const isValidKey = this(config)
    return dict => {
      if (!this.allErrors) {
        return Object.keys(dict).every(isValidKey)
      }
      let isValidKeys = true
      for (const key of Object.keys(dict)) {
        if (!isValidKey(key)) {
          isValidKeys = false
        }
      }
      return isValidKeys
    }
  },
  not (config) {
    validate.config(config)
    const isValid = this(config)
    return (value, ...parents) => !isValid(value, ...parents)
  },
  rest (config) {
    validate.config(config)
    return {
      [REST_PROPS]: config
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
        default:
          return false
      }
    }
  },
  throwError (config, getErrorMessage = 'Validation error') {
    validate.config(config)
    if (isnt(getErrorMessage)('string', 'function')) {
      throw new TypeError('getErrorMessage must be string|function(): string')
    }
    const isValid = this(config)
    return (value, ...parents) => {
      while (is(getErrorMessage)('function')) {
        getErrorMessage = getErrorMessage(value, ...parents)
      }
      if (isnt(getErrorMessage)('string')) {
        throw new TypeError('Returned value of getErrorMessage is not a string')
      }
      if (!isValid(value, ...parents)) {
        throw new TypeError(getErrorMessage)
      }
      return value
    }
  },
  validOr (config, defaultValue) {
    validate.config(config)
    const isValid = this(config)
    return (value, ...parents) => {
      if (!isValid(value, ...parents)) {
        return defaultValue
      }
      return value
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
      objConfig = this.registered[objConfig]
    }
    if (isnt(objConfig)('object')) {
      throw new TypeError('Wrong object config')
    }

    const restValidator = objConfig[REST_PROPS]
      ? this(objConfig[REST_PROPS])
      : null
    return (obj, ...parents) => {
      if (isnt(obj)('object')) {
        return obj
      }

      if (!omitUnchecked || restValidator) {
        const newObj = { ...obj }
        for (const [key, innerConfig] of Object.entries(objConfig)) {
          const isValidProp = this(innerConfig)
          if (!isValidProp(obj[key], new ParentKey(obj, key), ...parents)) {
            delete newObj[key]
          }
        }

        if (!restValidator) return newObj

        const checkedProps = new Set(Object.keys(objConfig))
        const notCheckedProps = Object.entries(newObj).filter(([propName]) => !checkedProps.has(propName))

        for (const [key, value] of notCheckedProps) {
          if (!restValidator(value, new ParentKey(obj, key), ...parents)) {
            delete newObj[key]
          }
        }

        return newObj
      }
      return Object.entries(objConfig)
        .filter(([key, config]) => {
          const value = obj[key]
          return this(config)(value, new ParentKey(obj, key), ...parents)
        })
        .reduce((res, [key]) => {
          res[key] = obj[key]
          return res
        }, {})
    }
  },
  omitInvalidItems (config) {
    const isValid = this(config)

    return (obj, ...parents) => {
      if (isnt(obj)('array', 'object')) {
        return obj
      }
      if (is(obj)('array')) {
        return obj.filter((value, i) =>
          isValid(value, new ParentKey(obj, i), ...parents)
        )
      }
      return Object.entries(obj)
        .filter(([key, value]) => isValid(value, new ParentKey(obj, key), ...parents))
        .reduce((obj, [key, value]) => {
          obj[key] = value
          return obj
        }, {})
    }
  },
  withoutAdditionalProps (config) {
    while (is(config)('string', 'symbol')) {
      config = this.registered[config]
    }
    if (isnt(config)('object')) {
      throw new TypeError('Config must be an object config')
    }
    return this({ ...config, ...this.rest(() => false) })
  },
  fix (value) {
    const initialValue = clone(value)
    return fixByTree(this[FIX_TREE], initialValue)
  },
  default (config, defaultValue) {
    validate.config(config)

    const isValid = this(config)
    return (value, ...parents) => {
      if (isValid(value, ...parents)) {
        return true
      }

      const keys = parents.map(e => e.key).reverse()

      const actualDefaultValue = is(defaultValue)('function')
        ? defaultValue(value, ...parents)
        : defaultValue

      this[FIX_TREE] = appendTree(keys, NODE_TYPES.DEFAULT, {
        defaultValue: actualDefaultValue
      }, this[FIX_TREE])
      return false
    }
  }
})
