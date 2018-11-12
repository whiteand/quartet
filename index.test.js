/* global test, jest, expect, describe */
global.console.log = jest.fn()
expect.extend({
  toBeTrueValueOf (received, isValid, validatorName) {
    const pass = isValid(received) === true
    const message = () =>
      `expected ${validatorName}(${JSON.stringify(received)}) to be true`
    return {
      pass,
      message
    }
  },
  toBeFalseValueOf (received, isValid, validatorName) {
    const pass = isValid(received) === false
    const message = () =>
      `expected ${validatorName}(${JSON.stringify(received)}) to be false`
    return { pass, message }
  }
})
const quartet = require('./index')
let v = quartet()

const testValidator = ({
  caption,
  isValid,
  trueValues,
  falseValues,
  validatorName = 'isValid'
}) => {
  test(caption, () => {
    for (const trueValue of trueValues) {
      expect(trueValue).toBeTrueValueOf(isValid, validatorName)
    }
    for (const falseValue of falseValues) {
      expect(falseValue).toBeFalseValueOf(isValid, validatorName)
    }
  })
}

describe('stringCheck function', () => {
  test('right name of config', () => {
    expect(v('number')(1)).toBe(true)
    expect(v('finite')(1)).toBe(true)
  })
  test('wrong name of config', () => {
    expect(() => v('wrong name of validator')(1)).toThrowError(
      new TypeError(
        'Reference to not registered config: wrong name of validator'
      )
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
    expect(v({ a: 'number ' })(1)).toBe(false)
    expect(v({ a: 'number ' })(null)).toBe(false)
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

    expect(v([[retFalse, retTrue]])('value')).toBe(false)

    expect(retFalse).toBeCalledWith('value')
    expect(retFalse).toBeCalledTimes(1);
    [retTrue, retTrue2, retTrue3, retFalse].forEach(f => f.mockClear())

    expect(v([[retTrue, retFalse, retTrue2, retTrue3]])('value')).toBe(false)
    expect(retTrue).toBeCalledTimes(1)
    expect(retTrue).toBeCalledWith('value')
    expect(retFalse).toBeCalledTimes(1)
    expect(retFalse).toBeCalledWith('value')
    expect(retTrue2).toBeCalledTimes(0);
    [retTrue, retTrue2, retTrue3, retFalse].forEach(f => f.mockClear())

    expect(v([[retTrue, retTrue2, retTrue3]])('value')).toBe(true)

    expect(retTrue).toBeCalledTimes(1)
    expect(retTrue).toBeCalledWith('value')
    expect(retTrue2).toBeCalledTimes(1)
    expect(retTrue2).toBeCalledWith('value')
    expect(retTrue3).toBeCalledTimes(1)
    expect(retTrue3).toBeCalledWith('value')

    expect(v([[]])('value')).toBe(true)
  })
})
describe('validate config', () => {})
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
  caption: 'isValidConfig method',
  isValid: v.isValidConfig,
  trueValues: [{}, 'a', [['string']], () => true],
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
  validatorName: `v.isValidConfig`
})

describe('validateConfig', () => {
  test('recursive', () => {
    const recursiveObj = { a: 'number' }
    recursiveObj.b = { c: { d: recursiveObj } }
    expect(() => {
      v.validateConfig(recursiveObj)
    }).toThrowError(new TypeError('Config must be not recursive'))
  })
  test('not valid type', () => {
    const config = null
    expect(() => {
      v.validateConfig(config)
    }).toThrowError(
      new TypeError(
        'config must be either name of registered config, isValid function or object config'
      )
    )
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
    new Date(),
    {},
    Symbol('123')
  ],
  falseValues: ['', [], 0, null, undefined, false, new Set([]), new Map()],
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

// METHODS

test('requiredIf method: boolean argument', () => {
  // condition variant
  const aRequired = v({
    a: v.requiredIf(true)
  })
  const aNotRequired = v({
    a: v.requiredIf(false)
  })
  expect({ a: 1 }).toBeTrueValueOf(aRequired)
  expect({ a: 1 }).toBeTrueValueOf(aNotRequired)
  expect({}).toBeFalseValueOf(aRequired)
  expect({}).toBeTrueValueOf(aNotRequired)
})

testValidator({
  caption: 'requiredIf method: config argument',
  isValid: v({
    hasB: 'boolean',
    b: v.requiredIf((_, { parent }) => parent.hasB)
  }),
  trueValues: [{ hasB: true, b: 1 }, { hasB: false }],
  falseValues: [{ hasB: true }],
  validatorName: 'bObjValidator'
})

describe('parent method', () => {
  testValidator({
    caption: 'parent method',
    isValid: v({
      hasB: 'boolean',
      b: v.requiredIf(v.parent(({ hasB }) => hasB))
    }),
    trueValues: [{ hasB: true, b: 1 }, { hasB: false }],
    falseValues: [{ hasB: true }],
    validatorName: 'parent validator'
  })
  test('without parent returns false', () => {
    const value = 1
    expect(v.parent('undefined')(value)).toBe(false)
    const arr = [1, 2, 3]
    expect(v.arrayOf(v.parent('array'))(arr)).toBe(true)
  })
})

describe('min method', () => {
  testValidator({
    caption: 'number',
    isValid: v.min(5),
    trueValues: [5, 6, 1 / 0],
    falseValues: [4, 0, NaN, -1 / 0, Symbol('123')],
    validatorName: 'v.min(5)'
  })
  testValidator({
    caption: 'string',
    isValid: v.min(5),
    trueValues: ['12345', '123456'],
    falseValues: ['1234', ''],
    validatorName: 'v.min(5)'
  })
  testValidator({
    caption: 'array',
    isValid: v.min(5),
    trueValues: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6]],
    falseValues: [[1, 2, 3, 4], []],
    validatorName: 'v.min(5)'
  })
  testValidator({
    caption: 'set',
    isValid: v.min(5),
    trueValues: [new Set([1, 2, 3, 4, 5]), new Set([1, 2, 3, 4, 5, 6])],
    falseValues: [
      new Set([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      new Set()
    ],
    validatorName: 'v.min(5)'
  })
  testValidator({
    caption: 'map',
    isValid: v.min(5),
    trueValues: [new Map([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]])],
    falseValues: [new Map(), new Map([[1, 1]])],
    validatorName: 'v.min(5)'
  })
  test('min wrong param', () => {
    expect(() => v.min('1')).toThrowError(
      new TypeError('minValue must be a number')
    )
  })
})

describe('max method', () => {
  testValidator({
    caption: 'number',
    isValid: v.max(5),
    trueValues: [5, 4, -1 / 0],
    falseValues: [6, NaN, 1 / 0, Symbol('123')],
    validatorName: 'v.max(5)'
  })
  testValidator({
    caption: 'string',
    isValid: v.max(5),
    trueValues: ['12345', '1234', ''],
    falseValues: ['123456'],
    validatorName: 'v.max(5)'
  })
  testValidator({
    caption: 'array',
    isValid: v.max(5),
    trueValues: [[1, 2, 3, 4, 5], [1, 2, 3, 4], []],
    falseValues: [[1, 2, 3, 4, 5, 6]],
    validatorName: 'v.max(5)'
  })
  testValidator({
    caption: 'set',
    isValid: v.max(5),
    trueValues: [
      new Set([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      new Set(),
      new Set([1, 2, 3, 4, 5])
    ],
    falseValues: [new Set([1, 2, 3, 4, 5, 6])],
    validatorName: 'v.max(5)'
  })
  testValidator({
    caption: 'map',
    isValid: v.max(5),
    trueValues: [
      new Map(),
      new Map([[1, 1]]),
      new Map([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]])
    ],
    falseValues: [new Map([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]])],
    validatorName: 'v.max(5)'
  })
  test('wrong input param', () => {
    expect(() => v.max('1')).toThrowError(
      new TypeError('maxValue must be a number')
    )
  })
})

describe('regex method', () => {
  testValidator({
    caption: 'regex method validator results',
    isValid: v.regex(/.abc./),
    trueValues: [' abc ', 'aabcdd', 'aabcddddd'],
    falseValues: ['abc ', 'aabdd', 'aaddddd'],
    validatorName: `v.regex(/.abc./)`
  })
  test('regex not regex input', () => {
    expect(() => v.regex('/abc/')).toThrowError(
      new TypeError('regex can takes only RegExp instances')
    )
  })
})

describe('explain', () => {
  test('firstly v must have empty explanation', () => {
    const v2 = v.newContext()
    expect(typeof v2).toBe('function')
    const isValidNumber = v2.explain('number', 1)
    expect(isValidNumber('1')).toBe(false)
    expect(v2.explanation).toEqual([1])
    v2()
    expect(v2.explanation).toEqual([])
    expect(isValidNumber.explanation).toEqual([1])
  })
  test('without explanation', () => {
    const isValid = v().explain('number')
    isValid(1)
    expect(v.explanation).toEqual([])
    isValid(2)
    expect(v.explanation).toEqual([])
  })
  test('default explanation', () => {
    const isValid = v().explain('number')
    isValid('123')
    expect(v.explanation).toEqual([{ value: '123', parents: [] }])
  })
  test('default explanation - resetExplanation method', () => {
    const isValid = v().explain('number')
    isValid(null)
    expect(v.explanation).toEqual([{ value: null, parents: [] }])
    v.resetExplanation() // The same as v()
    v.explain('number')(1)
    expect(v.explanation).toEqual([])
  })
  test('default explanation - resetExplanation alias v()', () => {
    v()('number')(null)
    v()('number')(1)
    expect(v.explanation).toEqual([])
  })
  test('custom explanation - not function', () => {
    v.resetExplanation()
    const isValidPerson = v({
      name: v.explain('string', 'wrong name'),
      age: v.explain('number', 'wrong age')
    })
    isValidPerson({
      name: 'andrew'
    })
    expect(v.explanation).toEqual(['wrong age'])

    v()
    isValidPerson({
      age: 12
    })
    expect(v.explanation).toEqual(['wrong name'])

    v()
    isValidPerson({})
    expect(v.explanation).toEqual(['wrong name', 'wrong age'])
  })
  test('custom explanation - function', () => {
    v()
    const explanationFunc = type => (value, { key }) =>
      `wrong property: ${key}. Expected ${type}, but ${typeof value} get`
    const isValidPerson = v({
      name: v.explain('string', explanationFunc('string')),
      age: v.explain('number', explanationFunc('number'))
    })
    expect(isValidPerson({ name: 'andrew' })).toBe(false)
    expect(v.explanation).toEqual([
      'wrong property: age. Expected number, but undefined get'
    ])

    v()
    isValidPerson({ age: 12 })
    expect(v.explanation).toEqual([
      'wrong property: name. Expected string, but undefined get'
    ])

    v()
    expect(isValidPerson({ name: 1, age: '1' })).toBe(false)
    expect(v.explanation).toEqual([
      'wrong property: name. Expected string, but number get',
      'wrong property: age. Expected number, but string get'
    ])
    v = v.register({
      prime: n => {
        if (n < 2) return false
        if (n === 2) return true
        for (let i = 2; i * i <= n; i++) {
          if (n % i === 0) return false
        }
        return true
      }
    })
    v()
    const arr = [1, 2, 3, 4, 5, 6, 7, 8]
    const isArrayOfPrimes = v.arrayOf(
      v.explain('prime', (value, { key }) => ({
        key,
        value
      }))
    )
    expect(isArrayOfPrimes(arr)).toBe(false)
    const notPrimes = v.explanation.map(({ value }) => value)
    expect(notPrimes).toEqual([1, 4, 6, 8])
  })
})

describe('Test omitInvalidItems', () => {
  test('omitInvalidItems(array)', () => {
    const arr = [1, '2', 3, '4', 5]

    expect(v.omitInvalidItems('number')(null)).toBe(null)
    expect(v.omitInvalidItems('number')(1)).toBe(1)
    expect(v.omitInvalidItems('number')('asd')).toBe('asd')
    expect(v.omitInvalidItems('number')(Symbol.for('asd'))).toBe(
      Symbol.for('asd')
    )

    const keepOnlyElementsEqualFirstElement = v.omitInvalidItems(
      (value, { parent }) => parent[0] === value
    )
    expect(
      keepOnlyElementsEqualFirstElement([1, 2, 3, 4, 5, 6, 1, '1'])
    ).toEqual([1, 1])

    const onlyNumbers = v.omitInvalidItems('number')(arr)
    expect(onlyNumbers).toEqual([1, 3, 5])

    const onlyStrings = v.omitInvalidItems('string')(arr)
    expect(onlyStrings).toEqual(['2', '4'])

    const arr2 = [0, 1, 5, 3, 4]
    const isElementPlusIndexIsEven = (value, { key }) =>
      (value + key) % 2 === 0
    expect(v.omitInvalidItems(isElementPlusIndexIsEven)(arr2)).toEqual([
      0,
      1,
      3,
      4
    ])
  })
  test('omitInvalidItems(object)', () => {
    const invalidNumberDict = {
      a: 1,
      b: '2',
      c: 3
    }
    const onlyNumberProperties = v.omitInvalidItems('number')(
      invalidNumberDict
    )
    expect(onlyNumberProperties).toEqual({
      a: 1,
      c: 3
    })
    const isKeyPlusValueHasLengthLessThen5 = (value, { key }) => {
      return (key + value).length < 5
    }

    const keys = {
      an: 'ap',
      an2: 'apple',
      '1a': '96'
    }
    expect(v.omitInvalidItems(isKeyPlusValueHasLengthLessThen5)(keys)).toEqual({
      an: 'ap',
      '1a': '96'
    })
  })
  test('omitInvalidItems(object) - all valid', () => {
    const dict = { a: 1, b: 2, c: 3 }
    expect(v.omitInvalidItems('number')(dict)).toEqual({ a: 1, b: 2, c: 3 })
  })
})

describe('omitInvalidProps', () => {
  test('omitInvalidProps wrong settings', () => {
    expect(() => v.omitInvalidProps()).toThrowError(
      new TypeError('Wrong object config')
    )
    expect(() => v.omitInvalidProps('wrong')).toThrowError(
      new TypeError('Wrong object config')
    )
    expect(() => v.omitInvalidProps('wrong', null)).toThrowError(
      new TypeError('settings must be object')
    )
    expect(v.omitInvalidProps({ a: 'number' })(null)).toBe(null)
    expect(v.omitInvalidProps({ a: 'number' })(1)).toBe(1)
    expect(v.omitInvalidProps({ a: 'number' })([1])).toEqual([1])
    expect(v.omitInvalidProps({ a: 'number' })('123')).toBe('123')
    expect(() =>
      v.omitInvalidProps('wrong', { omitUnchecked: 1 })
    ).toThrowError(
      new TypeError('settings.omitUnchecked must be boolean, or undefined')
    )
    expect(
      v.omitInvalidProps({ a: 'number' }, { omitUnchecked2: 1 })({ a: 1, b: 1 })
    ).toEqual({ a: 1 })
  })
  test('omitInvalidProps', () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
      f: 6,
      g: 7
    }
    v = v.register({
      prime: n => {
        if (n < 2) return false
        if (n === 2) return true
        for (let i = 2; i * i <= n; i++) {
          if (n % i === 0) return false
        }
        return true
      }
    })

    const onlyPrimesAndF = v.omitInvalidProps(
      {
        a: 'prime',
        b: 'prime',
        c: 'prime',
        d: 'prime',
        e: 'prime',
        g: 'prime'
      },
      { omitUnchecked: false }
    )
    expect(onlyPrimesAndF(obj)).toEqual({
      b: 2,
      c: 3,
      e: 5,
      f: 6,
      g: 7
    })
    const onlyPrimes = v.omitInvalidProps({
      a: 'prime',
      b: 'prime',
      c: 'prime',
      d: 'prime',
      e: 'prime',
      g: 'prime'
    })
    expect(onlyPrimes(obj)).toEqual({ b: 2, c: 3, e: 5, g: 7 })
  })
})
test('validOr method', () => {
  expect(v.validOr('number', 0)(123)).toBe(123)
  expect(v.validOr('number', 0)('123')).toBe(0)
})

testValidator({
  caption: 'enum method',
  isValid: v.enum(1, 2, 3, 4, '5'),
  trueValues: [1, 2, 3, 4, '5'],
  falseValues: [5, 6],
  validatorName: "v.enum(1, 2, 3, 4, '5')"
})

testValidator({
  caption: 'v.arrayOf method',
  isValid: v.arrayOf('number'),
  trueValues: [[], [1, 2, 3, 4, 5]],
  falseValues: [null, undefined, false, true, 1, 0, Symbol(123)],
  validatorName: `v.arrayOf("number")`
})

testValidator({
  caption: 'required method',
  isValid: v.required('a', 'b', 'c'),
  trueValues: [{ a: 1, b: 2, c: undefined }, { a: 1, b: 2, c: 3, d: 4 }],
  falseValues: [{ a: 1, b: 2 }, { a: 1, c: 3, d: 4 }, { c: 3, d: 4 }],
  validatorName: `v.required("a", "b", "c")`
})

describe('register method', () => {
  test('valid path', () => {
    let v2 = v.register({
      a: 'number'
    })
    expect(v2('a')(1)).toBe(true)
    expect(v2('a')('1')).toBe(false)
  })
  test('invalid path', () => {
    expect(() => {
      v.register()
    }).toThrowError(new TypeError('additionalRegistered must be an object'))
  })
})

describe('newContext', () => {
  test('not an object registered', () => {
    expect(() => {
      v.newContext(1)
    }).toThrowError(
      new TypeError(
        'registered must be an object { key1: config1, key2: config2, ...}'
      )
    )
  })
})

testValidator({
  caption: 'dictionaryOf method',
  isValid: v.dictionaryOf('number'),
  trueValues: [{}, { a: 1 }, { a: 2, c: NaN, d: 1 / 0, e: -1 / 0 }],
  falseValues: [{ a: '1' }, { b: null, a: 1 }, null, 1, false, undefined, true],
  validatorName: `v.dictionaryOf('number')`
})

testValidator({
  caption: 'dictionaryOf method',
  isValid: v.keys(v.enum('a', 'b', 'c')),
  trueValues: [{ a: 1 }, {}, { a: 2, c: NaN }],
  falseValues: [{ a: '1', d: 'e' }, { '': null, a: 1 }],
  validatorName: `v.keys(s => "abc".includes(s))`
})

describe('throwError', () => {
  test('valid', () => {
    const validNumber = 1
    expect(v.throwError('number', 'not valid number')(validNumber)).toBe(
      validNumber
    )
  })
  test('default error message', () => {
    const invalidNumber = '1'
    expect(() => v.throwError('number')(invalidNumber)).toThrowError(
      new TypeError('Validation error')
    )
  })
  test('invalid message is string', () => {
    const invalidNumber = '1'
    expect(() =>
      v.throwError('number', 'not valid number')(invalidNumber)
    ).toThrowError(new TypeError('not valid number'))
  })
  test('invalid message is function', () => {
    const validNumber = '1'
    expect(() =>
      v.throwError('number', value => `${value} is not valid number`)(
        validNumber
      )
    ).toThrowError(new TypeError('1 is not valid number'))
  })
  test('invalid message is function that returns not string', () => {
    const validNumber = '1'
    expect(() => v.throwError('number', value => 1)(validNumber)).toThrowError(
      new TypeError(
        'errorMessage must be a string, or function that returns string'
      )
    )
  })
  test('invalid message is function that returns not string', () => {
    const validNumber = '1'
    expect(() => v.throwError('number', 1)(validNumber)).toThrowError(
      new TypeError(
        'errorMessage must be a string, or function that returns string'
      )
    )
  })
})

testValidator({
  caption: 'not method',
  isValid: v.not('number'),
  trueValues: ['1', null, undefined, new Error('123')],
  falseValues: [1, NaN, 1 / 0, -1 / 0, 1.2, 0],
  validatorName: `v.not("number")`
})
