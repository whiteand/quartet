const { default: defaultMethod } = require('./default')
const { enum: enumMethod } = require('./enum')
const addFix = require('./addFix')
const and = require('./and.js')
const arrayOf = require('./arrayOf')
const dictionaryOf = require('./dictionaryOf')
const example = require('./example')
const explain = require('./explain.js')
const filter = require('./filter')
const fix = require('./fix.js')
const fromConfig = require('./fromConfig')
const hasFixes = require('./hasFixes')
const isValidSchema = require('./isValidSchema.js')
const keys = require('./keys')
const max = require('./max')
const min = require('./min')
const not = require('./not')
const omitInvalidItems = require('./omitInvalidItems')
const omitInvalidProps = require('./omitInvalidProps')
const parent = require('./parent.js')
const regex = require('./regex')
const register = require('./register')
const required = require('./required')
const requiredIf = require('./requiredIf')
const rest = require('./rest')
const throwError = require('./throwError')
const validateSchema = require('./validateSchema')
const validOr = require('./validOr')
const withoutAdditionalProps = require('./withoutAdditionalProps')

module.exports = {
  addFix,
  and,
  arrayOf,
  default: defaultMethod,
  dictionaryOf,
  enum: enumMethod,
  example,
  explain,
  filter,
  fix,
  fromConfig,
  hasFixes,
  isValidSchema,
  keys,
  max,
  min,
  not,
  omitInvalidItems,
  omitInvalidProps,
  parent,
  regex,
  register,
  required,
  requiredIf,
  rest,
  throwError,
  validateSchema,
  validOr,
  withoutAdditionalProps
}
