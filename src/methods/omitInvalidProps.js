const { isnt, is } = require('../validate')
const { REST_PROPS } = require('../symbols')
const ParentKey = require('../ParentKey')
const addMetaData = require('../addMetaData')
const TYPES = require('../types')

function validateParams(objSchema, settings) {
  if (isnt(settings)('object')) {
    throw new TypeError('settings must be object')
  }
  if (isnt(settings.omitUnchecked)('boolean', 'undefined')) {
    throw new TypeError(
      'settings.omitUnchecked must be boolean, or undefined'
    )
  }
}
function getFinalObjectSchema(objSchema, that) {
  while (isnt(objSchema)('object') && is(objSchema)('string')) {
    objSchema = that.registered[objSchema]
  }
  if (isnt(objSchema)('object')) {
    throw new TypeError('Wrong object schema')
  }
  return objSchema
}

function omitUncheckedOrUncheckedEmpty(obj, parents, finalObjSchema) {
  const restValidator = finalObjSchema[REST_PROPS]
    ? this(finalObjSchema[REST_PROPS])
    : null
  const newObj = { ...obj }
  for (const [key, innerSchema] of Object.entries(finalObjSchema)) {
    const isValidProp = this(innerSchema)
    if (!isValidProp(obj[key], new ParentKey(obj, key), ...parents)) {
      delete newObj[key]
    }
  }

  if (!restValidator) return newObj

  const checkedProps = new Set(Object.keys(finalObjSchema))
  const notCheckedProps = Object.entries(newObj).filter(([propName]) => !checkedProps.has(propName))

  for (const [key, value] of notCheckedProps) {
    if (!restValidator(value, new ParentKey(obj, key), ...parents)) {
      delete newObj[key]
    }
  }

  return newObj
}

module.exports = function omitInvalidProps(objSchema, settings = { omitUnchecked: true }) {
  validateParams(objSchema, settings)
  const { omitUnchecked: omitUnchecked = true } = settings
  const finalObjSchema = getFinalObjectSchema(objSchema, this)
  return addMetaData(
    (obj, ...parents) => {
      if (isnt(obj)('object')) {
        return obj
      }

      if (!omitUnchecked || finalObjSchema[REST_PROPS]) {
        return omitUncheckedOrUncheckedEmpty.bind(this)(obj, parents, finalObjSchema)
      }

      return Object.entries(finalObjSchema)
        .filter(([key, schema]) => {
          const value = obj[key]
          return this(schema)(value, new ParentKey(obj, key), ...parents)
        })
        .reduce((res, [key]) => {
          res[key] = obj[key]
          return res
        }, {})
    },
    TYPES.OMIT_INVALID_PROPS,
    { schema: objSchema, settings }
  )
}
