const validate = require('./validate')
const { getType, isnt, is } = validate
const getDefaultRegisteredConfigs = require('./defaultConfigs')
const getDefaultMethods = require('./defaultMethods')
const ParentKey = require('./ParentKey')

const { REST_PROPS } = require('./symbols')

const compileFunction = (f, ctx) => {
  const bindedF = f.bind(ctx)
  return (value, ...parents) => bindedF(value, ...parents)
}

const compileString = (name, ctx) => {
  const { registered } = ctx
  const isRegistered = registered[name]
  if (!isRegistered) {
    throw new TypeError(`'${name}' is not a registered config`)
  }
  return compile(registered[name], ctx)
}

const compileOr = (arr, ctx) => {
  arr.forEach(validate.config)
  return (value, ...parents) => arr.some(config => compile(config, ctx)(value, ...parents))
}

const compileObj = (objConfig, ctx) => {
  return (obj, ...parents) => {
    if (!obj) {
      return false
    }
    if (!ctx.allErrors) {
      for (const [key, innerConfig] of Object.entries(objConfig)) {
        const innerValue = obj[key]
        const isInnerValueValid = compile(innerConfig, ctx)(innerValue, new ParentKey(obj, key), ...parents)
        if (!isInnerValueValid) return false
      }

      if (is(objConfig[REST_PROPS])('undefined')) return true

      const checkedPropsSet = new Set(Object.keys(objConfig))

      const isValidRest = compile(objConfig[REST_PROPS], ctx)

      return Object.entries(obj)
        .filter(([prop]) => !checkedPropsSet.has(prop))
        .every(([key, value]) => isValidRest(value, new ParentKey(obj, key), ...parents))
    }
    let objValid = true
    for (const [key, innerConfig] of Object.entries(objConfig)) {
      const innerValue = obj[key]
      const isInnerValueValid = compile(innerConfig, ctx)(innerValue, new ParentKey(obj, key), ...parents)
      if (!isInnerValueValid) {
        objValid = false
      }
    }

    if (is(objConfig[REST_PROPS])('undefined')) return objValid

    const checkedPropsSet = new Set(Object.keys(objConfig))

    const isValidRest = compile(objConfig[REST_PROPS], ctx)
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

function compile (config, ctx) {
  validate.config(config)
  return compilers[getType(config)](config, ctx)
}

const getDefaultSettings = () => ({
  registered: getDefaultRegisteredConfigs(),
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
  context = function (config) {
    if (config === undefined) {
      return context.resetExplanation()
    }
    validate.recursive(config, 'config must be not recursive data structure')
    return compile(config, context)
  }
  for (const [key, value] of Object.entries(settings)) {
    context[key] = is(value)('function')
      ? value.bind(context)
      : value
  }
  context.newCompiler = newCompiler
  context.resetExplanation = () => {
    context.explanation = []
    return context
  }
  context.resetExplanation()
  return context
}

module.exports = newCompiler
