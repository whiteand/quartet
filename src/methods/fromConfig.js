const validate = require('../validate')
const addExtension = require('../validatorExtension')
const { isnt } = validate
const addMetaData = require('../addMetaData')
const TYPES = require('../types')

const VALIDATOR_PROP_NAME = 'validator'

const REDUCERS = {
  explanation: explanation => (v, validator) => v.explain(validator, explanation),
  default: defaultValue => (v, validator) => v.default(validator, defaultValue),
  filter: (isFiltered) => (v, validator) => isFiltered
    ? v.filter(validator)
    : validator,
  fix: fix => (v, validator) => v.addFix(validator, fix),
  examples: examples => (v, validator) => v.example(validator, ...examples)
}

const DECORATOR_PROPS = new Set([
  'explanation',
  'default',
  'filter',
  'fix',
  'examples'
])

const getValidatorAndDecorators = function (config) {
  const decorators = []
  let validatorSchema = null
  for (const pair of Object.entries(config)) {
    if (pair[0] === VALIDATOR_PROP_NAME) {
      validatorSchema = pair[1]
      continue
    }
    if (DECORATOR_PROPS.has(pair[0])) {
      decorators.push(pair)
      continue
    }
    throw new TypeError(`Wrong field in config: '${pair[0]}'`)
  }
  return { decorators, validatorSchema }
}

const fromConfig = function (config) {
  if (isnt(config)('object')) {
    throw new TypeError('config must be an object')
  }

  let { validatorSchema, decorators } = getValidatorAndDecorators(config)

  if (isnt(validatorSchema)('object', 'array', 'string', 'function')) {
    throw new TypeError('config.validator must be a valid validator schema(function, registered validator name, array, object)')
  }
  let validator = this(validatorSchema)
  for (const [decoratorName, params] of decorators) {
    validator = REDUCERS[decoratorName](params)(this, validator)
  }

  return addExtension(validator)
}

module.exports = function (...configs) {
  const validations = configs.map(fromConfig.bind(this))
  return addMetaData(
    (value, ...parents) => {
      return validations.every(f => f(value, ...parents))
    },
    TYPES.FROM_CONFIG,
    { schema: configs }
  )
}
