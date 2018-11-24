/* global test, expect, describe */
const quartet = require('../src/index')
let v = quartet()

describe('fromConfig', () => {
  const NOT_OBJECT_CONFIG_MESSAGE = 'config must be an object'
  test('not object config', () => {
    expect(() => v.fromConfig(null)).toThrowError(
      new TypeError(NOT_OBJECT_CONFIG_MESSAGE)
    )
    expect(() => v.fromConfig(1)).toThrowError(
      new TypeError(NOT_OBJECT_CONFIG_MESSAGE)
    )
    expect(() => v.fromConfig(() => {})).toThrowError(
      new TypeError(NOT_OBJECT_CONFIG_MESSAGE)
    )
  })
  test('without validator props', () => {
    expect(() => v.fromConfig({})).toThrowError(
      new TypeError('config.validator must be a valid validator schema(function, registered validator name, array, object)')
    )
  })
  test('just validator', () => {
    const isValid = v.fromConfig({
      validator: 'number'
    })
    expect(typeof isValid).toBe('function')
    expect(isValid(1)).toBe(true)
    expect(isValid(1.5)).toBe(true)
    expect(isValid('1.5')).toBe(false)
    expect(isValid(null)).toBe(false)
  })
  test('with default', () => {
    const isValid = v().fromConfig({
      validator: 'number',
      default: 0
    })
    expect(typeof isValid).toBe('function')
    expect(isValid(1)).toBe(true)
    expect(v.hasFixes()).toBe(false)

    expect(isValid('1')).toBe(false)
    expect(v.hasFixes()).toBe(true)
    expect(v.fix('1')).toBe(0)
  })
  test('wrong field in config', () => {
    expect(() => v.fromConfig({ wrongProp: 'number' })).toThrowError(
      new TypeError(`Wrong field in config: 'wrongProp'`)
    )
  })
  test('explain + filter', () => {
    const isValid = v().arrayOf(v.fromConfig({
      validator: 'number',
      explanation: 'NaN',
      filter: true
    }))
    expect(typeof isValid).toBe('function')
    expect(isValid([1])).toBe(true)
    expect(v.explanation).toEqual([])
    expect(v.hasFixes()).toBe(false)
    expect(isValid([1, 2, 3, '4', 5])).toBe(false)
    expect(v.explanation).toEqual(['NaN'])
    expect(v.hasFixes()).toBe(true)
    expect(v.fix([1, 2, 3, '4', 5])).toEqual([1, 2, 3, 5])
  })
  test('explain + fix', () => {
    const isValid = v().arrayOf(v.fromConfig({
      validator: 'number',
      explanation: 'NaN',
      fix: (invalidValue, { key, parent }) => {
        parent[key] = Number(invalidValue)
      }
    }))
    expect(typeof isValid).toBe('function')
    expect(isValid([1])).toBe(true)
    expect(v.explanation).toEqual([])
    expect(v.hasFixes()).toBe(false)

    expect(isValid([1, 2, 3, '4', 5])).toBe(false)
    expect(v.explanation).toEqual(['NaN'])
    expect(v.hasFixes()).toBe(true)
    expect(v.fix([1, 2, 3, '4', 5])).toEqual([1, 2, 3, 4, 5])
  })
  test('explain + filter', () => {
    const isValid = v().arrayOf(v.fromConfig({
      validator: 'number',
      explanation: 'NaN',
      filter: false
    }))
    expect(typeof isValid).toBe('function')
    expect(isValid([1])).toBe(true)
    expect(v.explanation).toEqual([])
    expect(v.hasFixes()).toBe(false)

    expect(isValid([1, 2, 3, '4', 5])).toBe(false)
    expect(v.explanation).toEqual(['NaN'])
    expect(v.hasFixes()).toBe(false)
    expect(v.fix([1, 2, 3, '4', 5])).toEqual([1, 2, 3, '4', 5])
  })
})
