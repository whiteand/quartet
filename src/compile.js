const validate = require('./validate')
const { getType, is } = validate
const ParentKey = require('./ParentKey')

const { REST_PROPS } = require('./symbols')

function compileFunction(f, ctx) {
  const bindedF = f.bind(ctx)
  return (value, ...parents) => bindedF(value, ...parents)
}

function compileString(name, ctx) {
  const { registered } = ctx
  const isRegistered = registered[name]
  if (!isRegistered) {
    throw new TypeError(`'${name}' is not a registered schema`)
  }
  return ctx(registered[name])
}

const compileOr = (arr, ctx) => {
  arr.forEach(validate.schema)
  return (value, ...parents) => arr.some(schema => ctx(schema)(value, ...parents))
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
  return (obj, ...parents) => {
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
