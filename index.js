const validate = require('./validate')
const { getType, isnt, is } = validate
const getDefaultRegisteredSchemas = require('./defaultSchemas')
const getDefaultMethods = require('./defaultMethods')
const ParentKey = require('./ParentKey')

const { REST_PROPS, FIX_TREE } = require('./symbols')
const { fixTree, VALUE_KEY } = require('./fixTree')

const compileFunction = (f, ctx) => {
  const bindedF = f.bind(ctx)
  return (value, ...parents) => bindedF(value, ...parents)
}

const compileString = (name, ctx) => {
  const { registered } = ctx
  const isRegistered = registered[name]
  if (!isRegistered) {
    throw new TypeError(`'${name}' is not a registered schema`)
  }
  return compile(registered[name], ctx)
}

const compileOr = (arr, ctx) => {
  arr.forEach(validate.schema)
  return (value, ...parents) => arr.some(schema => compile(schema, ctx)(value, ...parents))
}
const validateObjectToFirstInvalid = (ctx, objSchema, obj, ...parents) => {
  for (const [key, innerSchema] of Object.entries(objSchema)) {
    const innerValue = obj[key]
    const isInnerValueValid = compile(innerSchema, ctx)(innerValue, new ParentKey(obj, key), ...parents)
    if (!isInnerValueValid) return false
  }

  if (is(objSchema[REST_PROPS])('undefined')) return true

  const checkedPropsSet = new Set(Object.keys(objSchema))

  const isValidRest = compile(objSchema[REST_PROPS], ctx)

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
      const isInnerValueValid = compile(innerSchema, ctx)(innerValue, new ParentKey(obj, key), ...parents)
      if (!isInnerValueValid) {
        objValid = false
      }
    }

    if (is(objSchema[REST_PROPS])('undefined')) return objValid

    const checkedPropsSet = new Set(Object.keys(objSchema))

    const isValidRest = compile(objSchema[REST_PROPS], ctx)
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

const getDefaultSettings = () => ({
  registered: getDefaultRegisteredSchemas(),
  allErrors: true,
  ...getDefaultMethods()
})

function newCompiler (settings) {
  if (!settings) {
    settings = getDefaultSettings()
  } else {
    if (isnt(settings)('object')) {
      throw new TypeError('settings must be an object')
    }
    const _default = getDefaultSettings()
    settings = { ..._default, ...settings }
  }
  let context
  context = function (schema, explanation) {
    if (schema === undefined) {
      return context.clearContext()
    }
    if (explanation === undefined) {
      validate.recursive(schema, 'schema must be not recursive data structure')
      return compile(schema, context)
    }
    return context.explain(schema, explanation)
  }
  for (const [key, value] of Object.entries(settings)) {
    context[key] = is(value)('function')
      ? value.bind(context)
      : value
  }
  context.newCompiler = newCompiler
  context.clearContext = () => {
    context.explanation = []
    context[FIX_TREE] = fixTree(null, { [VALUE_KEY]: null })
    return context
  }
  context.clearContext()
  return context
}

module.exports = newCompiler
