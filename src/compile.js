const validate = require('./validate')
const { getType, is } = validate
const ParentKey = require('./ParentKey')
const addMetaData = require('./addMetaData')
const TYPES = require('./types')
const { REST_PROPS } = require('./symbols')

function compileFunction(f, ctx) {
  const bindedF = f.bind(ctx)
  return addMetaData(
    (value, ...parents) => bindedF(value, ...parents),
    TYPES.FUNCTION,
    { schema: f, ctx }
  )
}

function compileString(name, ctx) {
  const { registered } = ctx
  const isRegistered = registered[name]
  if (!isRegistered) {
    throw new TypeError(`'${name}' is not a registered schema`)
  }
  return addMetaData(
    ctx(registered[name]),
    TYPES.REGISTERED,
    { schema: name, ctx }
  )
}

const compileOr = (arr, ctx) => {
  arr.forEach(validate.schema)
  return addMetaData(
    (value, ...parents) => arr.some(schema => ctx(schema)(value, ...parents)),
    TYPES.ALTERNATIVE,
    { schema: arr, ctx }
  )
}
const validateObjectToFirstInvalid = (ctx, objSchema, obj, ...parents) => {
  for (const [key, innerSchema] of Object.entries(objSchema)) {
    const innerValue = obj[key]
    const isInnerValueValid = ctx(innerSchema)(innerValue, new ParentKey(obj, key), ...parents)
    if (!isInnerValueValid) return false
  }

  if (is(objSchema[REST_PROPS])('undefined')) return true

  const checkedPropsSet = new Set(Object.keys(objSchema))

  const isValidRest = ctx(objSchema[REST_PROPS])

  return Object.entries(obj)
    .filter(([prop]) => !checkedPropsSet.has(prop))
    .every(([key, value]) => isValidRest(value, new ParentKey(obj, key), ...parents))
}
const compileObj = (objSchema, ctx) => {
  const validator = (obj, ...parents) => {
    if (!obj) {
      return false
    }
    if (!ctx.allErrors) {
      return validateObjectToFirstInvalid(ctx, objSchema, obj, ...parents)
    }
    let objValid = true
    for (const [key, innerSchema] of Object.entries(objSchema)) {
      const innerValue = obj[key]
      const isInnerValueValid = ctx(innerSchema)(innerValue, new ParentKey(obj, key), ...parents)
      if (!isInnerValueValid) {
        objValid = false
      }
    }

    if (is(objSchema[REST_PROPS])('undefined')) return objValid

    const checkedPropsSet = new Set(Object.keys(objSchema))

    const isValidRest = ctx(objSchema[REST_PROPS])
    for (const [key, value] of Object.entries(obj)) {
      if (checkedPropsSet.has(key)) continue
      const isInnerValueValid = isValidRest(value, new ParentKey(obj, key), ...parents)
      if (!isInnerValueValid) {
        objValid = false
      }
    }
    return objValid
  }
  return addMetaData(
    validator,
    TYPES.OBJECT,
    { schema: objSchema }
  )
}

const compilers = {
  string: compileString,
  symbol: compileString,
  array: compileOr,
  object: compileObj,
  function: compileFunction
}

function compile (schema, ctx) {
  validate.schema(schema)
  return compilers[getType(schema)](schema, ctx)
}

module.exports = compile
