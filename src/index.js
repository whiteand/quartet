const validate = require('./validate')
const { isnt, is } = validate
const getDefaultRegisteredSchemas = require('./defaultSchemas')
const getDefaultMethods = require('./defaultMethods')

const { FIX_TREE } = require('./symbols')
const { fixTree, VALUE_KEY } = require('./fixTree')
const compile = require('./compile')

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
  context = function (schema, explanation, params) {
    if (schema === undefined) {
      return context.clearContext()
    }
    const useDefaultExplanation = !params || !params.withoutDefaultExplanation
    const withoutDefaultExplanation = settings.defaultExplanation === undefined || !useDefaultExplanation
    if (explanation === undefined && withoutDefaultExplanation) {
      validate.recursive(schema, 'schema must be not recursive data structure')
      return compile(schema, context)
    }
    return context.explain(schema, explanation || settings.defaultExplanation)
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
