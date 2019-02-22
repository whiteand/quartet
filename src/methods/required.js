const addMetaData = require('../addMetaData')
const TYPES = require('../types')
module.exports = function required(...props) {
  return addMetaData(
    obj => {
      return props.every(prop => Object.prototype.hasOwnProperty.call(obj, prop))
    },
    TYPES.REQUIRED,
    { schema: props }
  )
}
