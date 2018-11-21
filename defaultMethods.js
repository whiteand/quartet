const validate = require('./validate')
const { is, getType, isnt } = validate
const { REST_PROPS, FIX_TREE } = require('./symbols')
const ParentKey = require('./ParentKey.js')
const clone = require('./clone')
const { fixByTree, appendTree, NODE_TYPES, VALUE_KEY, isEmptyTree } = require('./fixTree')
const fromConfig = require('./fromConfig.js')

const addExtension = require('./validatorExtension')

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
    if (!Object.values(additionalRegistered).every(schema => this.isValidSchema(schema))) {
      throw new TypeError('some of registered schemas is invalid')
    }
    return this.newCompiler({ allErrors: this.allErrors, registered: { ...this.registered, ...additionalRegistered } })
  },
  isValidSchema (schema) {
    try {
      validate.recursive(schema, 'array schema must be not recursive data structure')
    } catch (e) {
      return false
    }
    const t = getType(schema)
    switch (t) {
      case 'array':
        return schema.every(innerSchema => this.isValidSchema(innerSchema))
      case 'object': {
        const isCheckedPropsschemasValid = Object.keys(schema).length === 0 ||
          Object.values(schema).every(innerSchema => this.isValidSchema(innerSchema))
        const isRestPropsValid = schema[REST_PROPS]
          ? this.isValidSchema(schema[REST_PROPS])
          : true
        return isCheckedPropsschemasValid && isRestPropsValid
      }
      case 'function': return true
      case 'string': return this.isValidSchema(this.registered[schema])
      default: return false
    }
  },
  validateSchema (schema) {
    validate.recursive(schema, 'Schema must be not recursive')
    if (!this.isValidSchema(schema)) {
      throw new TypeError('schema must be string|symbol|array|function|object')
    }
    return schema
  },
  and (...schemas) {
    schemas.forEach(validate.schema)
    return (value, ...parents) => {
      return schemas.map(schema => this(schema)).every(f => f(value, ...parents))
    }
  },
  explain (
    schema,
    getExplanation = (value, ...parents) => ({ value, parents })
  ) {
    const isValid = this(schema)
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
  parent (schema) {
    validate.schema(schema)
    const isValid = this(schema)
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
  requiredIf (schema) {
    if (is(schema)('boolean')) {
      return schema
        ? requiredValidator
        : () => true
    }
    validate.schema(schema)
    const isValid = this(schema)
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
  arrayOf (schema) {
    validate.schema(schema)
    const isValidElem = this(schema)
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
  dictionaryOf (schema) {
    validate.schema(schema)
    const isValidItem = this(schema)
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
  keys (schema) {
    validate.schema(schema)
    const isValidKey = this(schema)
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
  not (schema) {
    validate.schema(schema)
    const isValid = this(schema)
    return (value, ...parents) => !isValid(value, ...parents)
  },
  rest (schema) {
    validate.schema(schema)
    return {
      [REST_PROPS]: schema
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
  throwError (schema, getErrorMessage = 'Validation error') {
    validate.schema(schema)
    if (isnt(getErrorMessage)('string', 'function')) {
      throw new TypeError('getErrorMessage must be string|function(): string')
    }
    const isValid = this(schema)
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
  validOr (schema, defaultValue) {
    validate.schema(schema)
    const isValid = this(schema)
    return (value, ...parents) => {
      if (!isValid(value, ...parents)) {
        return defaultValue
      }
      return value
    }
  },
  omitInvalidProps (objSchema, settings = { omitUnchecked: true }) {
    if (isnt(settings)('object')) {
      throw new TypeError('settings must be object')
    }
    if (isnt(settings.omitUnchecked)('boolean', 'undefined')) {
      throw new TypeError(
        'settings.omitUnchecked must be boolean, or undefined'
      )
    }
    const { omitUnchecked: omitUnchecked = true } = settings

    while (isnt(objSchema)('object') && is(objSchema)('string')) {
      objSchema = this.registered[objSchema]
    }
    if (isnt(objSchema)('object')) {
      throw new TypeError('Wrong object schema')
    }

    const restValidator = objSchema[REST_PROPS]
      ? this(objSchema[REST_PROPS])
      : null
    return (obj, ...parents) => {
      if (isnt(obj)('object')) {
        return obj
      }

      if (!omitUnchecked || restValidator) {
        const newObj = { ...obj }
        for (const [key, innerSchema] of Object.entries(objSchema)) {
          const isValidProp = this(innerSchema)
          if (!isValidProp(obj[key], new ParentKey(obj, key), ...parents)) {
            delete newObj[key]
          }
        }

        if (!restValidator) return newObj

        const checkedProps = new Set(Object.keys(objSchema))
        const notCheckedProps = Object.entries(newObj).filter(([propName]) => !checkedProps.has(propName))

        for (const [key, value] of notCheckedProps) {
          if (!restValidator(value, new ParentKey(obj, key), ...parents)) {
            delete newObj[key]
          }
        }

        return newObj
      }
      return Object.entries(objSchema)
        .filter(([key, schema]) => {
          const value = obj[key]
          return this(schema)(value, new ParentKey(obj, key), ...parents)
        })
        .reduce((res, [key]) => {
          res[key] = obj[key]
          return res
        }, {})
    }
  },
  omitInvalidItems (schema) {
    const isValid = this(schema)

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
  withoutAdditionalProps (schema) {
    while (is(schema)('string', 'symbol')) {
      schema = this.registered[schema]
    }
    if (isnt(schema)('object')) {
      throw new TypeError('Schema must be an object schema')
    }
    return this({ ...schema, ...this.rest(() => false) })
  },
  fix (value) {
    const initialValue = clone(value)
    return fixByTree(this[FIX_TREE], initialValue)
  },
  default (schema, defaultValue) {
    validate.schema(schema)

    const isValid = this(schema)
    const that = this
    return addExtension(function (value, ...parents) {
      if (isValid(value, ...parents)) {
        return true
      }

      const keys = [VALUE_KEY, ...parents.map(e => e.key).reverse()]

      const actualDefaultValue = is(defaultValue)('function')
        ? defaultValue(value, ...parents)
        : defaultValue

      that[FIX_TREE] = appendTree(keys, NODE_TYPES.DEFAULT, {
        defaultValue: actualDefaultValue
      }, that[FIX_TREE])
      return false
    })
  },
  addFix (schema, fixFunction) {
    validate.schema(schema)
    this.throwError('function', 'fixFunction must be a function')(fixFunction)

    const isValid = this(schema)
    const that = this
    return addExtension(function (value, ...parents) {
      if (isValid(value, ...parents)) {
        return true
      }

      const keys = [VALUE_KEY, ...parents.map(e => e.key).reverse()]

      that[FIX_TREE] = appendTree(keys, NODE_TYPES.FUNCTION, {
        fixFunction
      }, that[FIX_TREE])

      return false
    })
  },
  filter (schema) {
    validate.schema(schema)
    const isValid = this(schema)
    const that = this
    return addExtension(function (value, ...parents) {
      if (isValid(value, ...parents)) {
        return true
      }

      const keys = [VALUE_KEY, ...parents.map(e => e.key).reverse()]

      that[FIX_TREE] = appendTree(keys.slice(0, -1), NODE_TYPES.FILTER, {
        key: keys[keys.length - 1]
      }, that[FIX_TREE])

      return false
    })
  },
  hasFixes () {
    return !isEmptyTree(this[FIX_TREE])
  },
  fromConfig,
  example (schema, ...values) {
    validate.schema(schema)
    if (!values.length) {
      throw new TypeError('There is not any example')
    }
    values.forEach(this.throwError(schema, `Examples don't match the schema`))
    return this(schema)
  }
})
