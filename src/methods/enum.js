module.exports = {
  enum (...values) {
    const valuesSet = new Set(values)
    return value => valuesSet.has(value)
  }
}
