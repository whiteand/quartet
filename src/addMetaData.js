module.exports = (validator, type, extra) => {
  validator.type = type
  validator.extra = extra
  return validator
}
