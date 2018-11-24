/* global test, jest, expect, describe */
const quartet = require('../index')
let v = quartet()
global.console.log = jest.fn()

const testValidator = require('./testValidator')(expect, test)

describe('stringCheck function', () => {
  test('right name of schema', () => {
    expect(v('number')(1)).toBe(true)
    expect(v('finite')(1)).toBe(true)
  })
  test('wrong name of schema', () => {
    expect(() => v('wrong name of validator')(1)).toThrowError(
      new TypeError(`'wrong name of validator' is not a registered schema`)
    )
  })
})

describe('functionCheck function', () => {
  test('function passed', () => {
    const isEven = jest.fn(n => n % 2 === 0)
    expect(v(isEven)(4)).toBe(true)
    expect(isEven).toBeCalledWith(4)
    expect(isEven).toBeCalledTimes(1)
    expect(v(isEven)(3)).toBe(false)
    expect(isEven).toBeCalledWith(3)
    expect(isEven).toBeCalledTimes(2)
  })
})

describe('objectCheck function', () => {
  test('value is not object branch', () => {
    expect(v({ a: 'number' })(1)).toBe(false)
    expect(v({ a: 'number' })(null)).toBe(false)
  })
  test('no into loop of entries', () => {
    expect(v({})({})).toBe(true)
    expect(v({})({ a: 2 })).toBe(true)
  })
  test('properties valid', () => {
    expect(v({ a: 'number' })({ a: 1 })).toBe(true)
  })
  test('properties invalid valid', () => {
    expect(v({ a: 'number' })({ a: '1', b: 1 })).toBe(false)
    expect(v({ a: 'number' })({ b: 1 })).toBe(false)
  })
})

describe('combinators', () => {
  test('or', () => {
    const retTrue = jest.fn(() => true)
    const retTrue2 = jest.fn(() => true)
    const retTrue3 = jest.fn(() => true)
    const retFalse = jest.fn(() => false)

    expect(v([retTrue, retTrue2, retTrue3])(1)).toBe(true)

    expect(retTrue).toBeCalledWith(1)
    expect(retTrue).toBeCalledTimes(1)
    expect(retTrue2).toBeCalledTimes(0)
    expect(retTrue3).toBeCalledTimes(0)

    expect(v([retFalse, retTrue2, retTrue3])(1)).toBe(true)

    expect(retFalse).toBeCalledWith(1)
    expect(retFalse).toBeCalledTimes(1)

    expect(retTrue2).toBeCalledWith(1)
    expect(retTrue2).toBeCalledTimes(1)

    expect(retTrue3).toBeCalledTimes(0);
    [retTrue, retTrue2, retTrue3, retFalse].forEach(f => f.mockClear())
    expect(v([retFalse])(1)).toBe(false)
    expect(retFalse).toBeCalledTimes(1)
    expect(retFalse).toBeCalledWith(1)
    expect(v([])('value')).toBe(false)
  })

  test('and', () => {
    const retTrue = jest.fn(() => true)
    const retTrue2 = jest.fn(() => true)
    const retTrue3 = jest.fn(() => true)
    const retFalse = jest.fn(() => false)

    expect(v([v.and(retFalse, retTrue)])('value')).toBe(false)

    expect(retFalse).toBeCalledWith('value')
    expect(retFalse).toBeCalledTimes(1);
    [retTrue, retTrue2, retTrue3, retFalse].forEach(f => f.mockClear())

    expect(v([v.and(retTrue, retFalse, retTrue2, retTrue3)])('value')).toBe(false)
    expect(retTrue).toBeCalledTimes(1)
    expect(retTrue).toBeCalledWith('value')
    expect(retFalse).toBeCalledTimes(1)
    expect(retFalse).toBeCalledWith('value')
    expect(retTrue2).toBeCalledTimes(0);
    [retTrue, retTrue2, retTrue3, retFalse].forEach(f => f.mockClear())

    expect(v([v.and(retTrue, retTrue2, retTrue3)])('value')).toBe(true)

    expect(retTrue).toBeCalledTimes(1)
    expect(retTrue).toBeCalledWith('value')
    expect(retTrue2).toBeCalledTimes(1)
    expect(retTrue2).toBeCalledWith('value')
    expect(retTrue3).toBeCalledTimes(1)
    expect(retTrue3).toBeCalledWith('value')

    expect(v([v.and()])('value')).toBe(true)
  })
})
describe('validate schema', () => {
  test('validate schema: valid', () => {
    const validSchemas = ['string', { a: 'string' }, ['string', 'number', 'finite'], v => typeof v === 'number']
    for (const schema of validSchemas) {
      expect(v.validateSchema(schema)).toEqual(schema)
    }
  })
  test('invalid schemas', () => {
    const invalidSchemas = ['string1', { a: 's1tring' }, ['string', 'n1umber', 'finite']]
    for (const schema of invalidSchemas) {
      expect(() => v.validateSchema(schema)).toThrowError(new TypeError('schema must be string|symbol|array|function|object'))
    }
  })
  test('invalid schema recursive', () => {
    const invalidSchema = { a: 'string' }
    invalidSchema.self = invalidSchema
    expect(() => v.validateSchema(invalidSchema)).toThrowError(new TypeError('Schema must be not recursive'))
  })
})
// DEFAULT VALIDATORS
testValidator({
  caption: 'string default validator',
  isValid: v('string'),
  trueValues: ['a string', ''],
  falseValues: [
    // eslint-disable-next-line
    new String('123'),
    1,
    null,
    undefined,
    {},
    Symbol('symbol'),
    0,
    false,
    true,
    [],
    ['symbol']
  ]
})

testValidator({
  caption: 'null default validator',
  isValid: v('null'),
  trueValues: [null],
  falseValues: [
    'null',
    0,
    undefined,
    {},
    Symbol('null'),
    false,
    true,
    [],
    [null]
  ]
})

testValidator({
  caption: 'undefined default validator',
  isValid: v('undefined'),
  trueValues: [undefined],
  falseValues: [
    'undefined',
    0,
    null,
    {},
    Symbol('null'),
    false,
    true,
    [],
    [undefined]
  ]
})

testValidator({
  caption: 'nil default validator',
  isValid: v('nil'),
  trueValues: [undefined, null],
  falseValues: [
    'undefined',
    0,
    {},
    Symbol('null'),
    0,
    false,
    true,
    [],
    [undefined],
    [null]
  ]
})
testValidator({
  caption: 'number default validator',
  isValid: v('number'),
  trueValues: [1, -1, 1.2, NaN, 1 / 0, -1 / 0],
  falseValues: [
    'undefined',
    {},
    Symbol('null'),
    false,
    true,
    [],
    [undefined],
    [null]
  ]
})

testValidator({
  caption: 'safe-integer default validator',
  isValid: v('safe-integer'),
  trueValues: [1, -1],
  falseValues: [
    1.2,
    NaN,
    1 / 0,
    -1 / 0,
    'undefined',
    {},
    Symbol('null'),
    false,
    true,
    [],
    [undefined],
    [null]
  ],
  validatorName: 'v("safe-integer")'
})

testValidator({
  caption: 'finite default validator',
  isValid: v('finite'),
  trueValues: [1, -1, 1.2],
  falseValues: [
    NaN,
    1 / 0,
    -1 / 0,
    'undefined',
    {},
    Symbol('null'),
    false,
    true,
    [],
    [undefined],
    [null]
  ]
})

testValidator({
  caption: 'positive default validator',
  isValid: v('positive'),
  trueValues: [1, 0.1, 1e-8, 1 / 0],
  falseValues: [0, -1, -1e-8, -1 / 0, NaN]
})

testValidator({
  caption: 'non-positive default validator',
  isValid: v('non-positive'),
  trueValues: [0, -1, -1e-8, -1 / 0],
  falseValues: [1, 0.1, 1e-8, 1 / 0, NaN]
})

testValidator({
  caption: 'negative default validator',
  isValid: v('negative'),
  trueValues: [-1, -1e-8, -1 / 0],
  falseValues: [1, 0.1, 1e-8, 0, NaN]
})

testValidator({
  caption: 'non-negative default validator',
  isValid: v('non-negative'),
  trueValues: [1, 0.1, 1e-8, 0],
  falseValues: [-1, -1e-8, -1 / 0, NaN]
})

testValidator({
  caption: 'object default validator',
  isValid: v('object'),
  // eslint-disable-next-line
  trueValues: [null, {}, { a: 1 }, [], new String('123')],
  falseValues: [1, '1', false, true, undefined, Symbol('symbol')]
})
testValidator({
  caption: 'object! default validator',
  isValid: v('object!'),
  // eslint-disable-next-line
  trueValues: [{}, { a: 1 }, [], new String('123')],
  falseValues: [null, 1, '1', false, true, undefined, Symbol('symbol')],
  validatorName: `v("object!")`
})

testValidator({
  caption: 'isValidSchema method',
  isValid: v.isValidSchema,
  trueValues: [{}, 'number', [['string']], [], { a: 'number' }, () => true],
  falseValues: [
    null,
    1,
    undefined,
    true,
    false,
    (() => {
      const obj = { a: 'number' }
      obj.self = obj
      return obj
    })()
  ],
  validatorName: `v.isValidSchema`
})

describe('validateSchema', () => {
  test('recursive', () => {
    const recursiveObj = { a: 'number' }
    recursiveObj.b = { c: { d: recursiveObj } }
    expect(() => {
      v.validateSchema(recursiveObj)
    }).toThrowError(new TypeError('Schema must be not recursive'))
  })
  test('not valid type', () => {
    const schema = null
    expect(() => {
      v.validateSchema(schema)
    }).toThrowError(
      new TypeError(
        'schema must be string|symbol|array|function|object'
      )
    )
  })
  test('returns schema if valid', () => {
    const schema = { ...v.rest('number') }
    expect(v.validateSchema(schema)).toBe(schema)
  })
})

testValidator({
  caption: 'array default validator',
  isValid: v('array'),
  trueValues: [[], [1, 2, 3, 4, 5]],
  falseValues: [{ '0': 1, length: 1 }, null, undefined, 'array']
})

testValidator({
  caption: 'not-empty default validator',
  isValid: v('not-empty'),
  trueValues: [
    [1, 2, 3, 4, 5],
    'a',
    1,
    new Set([1, 2, 3]),
    new Map([[1, 2]]),
    new Set([]), new Map(),
    new Date(),
    {},
    Symbol('123')
  ],
  falseValues: ['', [], 0, null, undefined, false],
  validatorName: 'not-empty'
})

test('log default validator', () => {
  v('log')(1)
  expect(console.log).toBeCalledTimes(1)
  expect(console.log).toBeCalledWith({ value: 1, parents: [] })

  v({
    a: 'log'
  })({
    a: 1
  })
  expect(console.log).toBeCalledTimes(2)
  expect(console.log).toBeCalledWith({
    value: 1,
    parents: [{ key: 'a', parent: { a: 1 } }]
  })
})

testValidator({
  caption: 'boolean default validator',
  isValid: v('boolean'),
  trueValues: [true, false],
  falseValues: [null, 0, 'false', 'true', undefined, [], {}],
  validatorName: 'boolean'
})

testValidator({
  caption: 'symbol default validator',
  isValid: v('symbol'),
  trueValues: [Symbol(''), Symbol('symbol')],
  falseValues: [null, 0, true, false, 'false', 'true', undefined, [], {}],
  validatorName: `v("symbol")`
})
testValidator({
  caption: 'function default validator',
  isValid: v('function'),
  trueValues: [() => {}, function () {}, async function () {}],
  falseValues: [null, 0, true, false, 'false', 'true', undefined, [], {}],
  validatorName: `v("function")`
})

testValidator({
  caption: 'required default validator - not a properties',
  isValid: v('required'),
  trueValues: [
    [1, 2, 3, 4, 5],
    'a',
    1,
    new Set([1, 2, 3]),
    new Map([[1, 2]]),
    new Date(),
    2,
    3,
    5
  ],
  falseValues: [],
  validatorName: 'required'
})

test('required default validator - required properties', () => {
  expect(v({ a: [['required']] })({})).toBe(false)
  expect(v({ a: [['required']] })({ a: undefined })).toBe(true)
  expect(v({ a: [['required']] })({ a: 1 })).toBe(true)
})
