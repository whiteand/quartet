const { isnt, is } = require('../validate')
const { REST_PROPS } = require('../symbols')
const ParentKey = require('../ParentKey')

module.exports = function omitInvalidProps (objSchema, settings = { omitUnchecked: true }) {
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
}
