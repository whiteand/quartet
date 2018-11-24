module.exports = function required (...props) {
  return obj => {
    return props.every(prop => Object.prototype.hasOwnProperty.call(obj, prop))
  }
}
