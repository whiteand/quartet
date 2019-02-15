/* global test, jest, expect, describe */
const quartet = require('../src/index')
let v = quartet()

const testValidator = require('./testValidator.test')(expect, test)

const isPrime = n => {
  if (n < 2) return false
  if (n === 2) return true
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false
  }
  return true
}

const NOT_VALID_NUMBER_MESSAGE = 'not valid number'

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
  expect(1).toBeTrueValueOf(v.requiredIf(true))
  expect(1).toBeTrueValueOf(v.requiredIf(false))
})

testValidator({
  caption: 'requiredIf method: schema argument',
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
    const v2 = v.newCompiler()
    expect(typeof v2).toBe('function')
    const isValidNumber = v2.explain('number', v => v)

    expect(isValidNumber('1')).toBe(false)
    expect(isValidNumber.explanation).toEqual(['1'])
    expect(v2.explanation).toEqual(['1'])

    expect(isValidNumber('1')).toBe(false)
    expect(v2.explanation).toEqual(['1', '1'])
    expect(isValidNumber.explanation).toEqual(['1', '1'])

    v2()
    expect(v2.explanation).toEqual([])
    expect(isValidNumber.explanation).toEqual(['1', '1'])
    isValidNumber.clearContext()
    expect(isValidNumber.explanation).toEqual([])
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
    expect(v.explanation).toEqual([{ value: '123', parents: [], schema: 'number' }])
  })
  test('default explanation - clearContext method', () => {
    const isValid = v().explain('number')
    isValid(null)
    expect(v.explanation).toEqual([{ value: null, parents: [], schema: 'number' }])
    v.clearContext() // The same as v()
    v.explain('number')(1)
    expect(v.explanation).toEqual([])
  })
  test('default explanation - clearContext alias v()', () => {
    v()('number')(null)
    v()('number')(1)
    expect(v.explanation).toEqual([])
  })
  test('custom explanation - not function', () => {
    v.clearContext()
    const WRONG_NAME_MESSAGE = 'wrong name';
    const WRONG_AGE_MESSAGE = 'wrong age'
    const isValidPerson = v({
      name: v.explain('string', WRONG_NAME_MESSAGE),
      age: v.explain('number', WRONG_AGE_MESSAGE)
    })
    isValidPerson({
      name: 'andrew'
    })
    expect(v.explanation).toEqual([WRONG_AGE_MESSAGE])

    v()
    isValidPerson({
      age: 12
    })
    expect(v.explanation).toEqual([WRONG_NAME_MESSAGE])

    v()
    isValidPerson({})
    expect(v.explanation).toEqual([WRONG_NAME_MESSAGE, WRONG_AGE_MESSAGE])
  })
  test('custom explanation - not function with alias v(schema, explanation)', () => {
    v.clearContext()
    const WRONG_NAME_MESSAGE = 'wrong name'
    const WRONG_AGE_MESSAGE = 'wrong age'
    const isValidPerson = v({
      name: v('string', WRONG_NAME_MESSAGE),
      age: v('number', WRONG_AGE_MESSAGE)
    })
    isValidPerson({
      name: 'andrew'
    })
    expect(v.explanation).toEqual([WRONG_AGE_MESSAGE])

    v()
    isValidPerson({
      age: 12
    })
    expect(v.explanation).toEqual([WRONG_NAME_MESSAGE])

    v()
    isValidPerson({})
    expect(v.explanation).toEqual([WRONG_NAME_MESSAGE, WRONG_AGE_MESSAGE])
  })
  test('custom explanation - function', () => {
    v()
    const explanationFunc = type => (value, schema, { key }) =>
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
      prime: isPrime
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
    // Right indexes checking
    expect(v.arrayOf((v, { key, parent }) => parent[key] === v)(Array(100).fill(2))).toBe(true)
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
      new TypeError('Wrong object schema')
    )
    expect(() => v.omitInvalidProps('wrong')).toThrowError(
      new TypeError('Wrong object schema')
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
    expect((() => {
      try {
        v.omitInvalidProps('wrong', { omitUnchecked: 1 })
      } catch (error) {
        return error
      }
    })()).toBeInstanceOf(TypeError)
    expect(
      v.omitInvalidProps({ a: 'number' }, { omitUnchecked2: 1 })({ a: 1, b: 1 })
    ).toEqual({ a: 1 })
    expect(
      v.omitInvalidProps({ a: 'number', ...v.rest('string') }, { omitUnchecked: true })({ a: 1, b: '1' })
    ).toEqual({ a: 1, b: '1' })
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
    v = v.register({ prime: isPrime })

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
    expect(onlyPrimesAndF(obj) === obj).toBe(false)
    const onlyPrimes = v.omitInvalidProps({
      a: 'prime',
      b: 'prime',
      c: 'prime',
      d: 'prime',
      e: 'prime',
      g: 'prime'
    })
    expect(onlyPrimes(obj)).toEqual({ b: 2, c: 3, e: 5, g: 7 })
    expect(onlyPrimes(obj) === obj).toBe(false)
  })
  test('omitInvalidProps delete invalid rest params', () => {
    expect(v.omitInvalidProps({ ...v.rest('string') })({ a: 1, b: 2, c: 3 })).toEqual({})
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
  falseValues: [{ b: 1, c: 1 }, { a: 1, b: 2 }, { a: 1, c: 3, d: 4 }, { c: 3, d: 4 }],
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
  test('invalid path', () => {
    expect(() => {
      v.register({ value: '1' })
    }).toThrowError(new TypeError('some of registered schemas is invalid'))
  })
})

describe('newCompiler', () => {
  test('not an object', () => {
    expect(() => {
      v.newCompiler(1)
    }).toThrowError(
      new TypeError(
        'settings must be an object'
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
    expect(v.throwError('number', NOT_VALID_NUMBER_MESSAGE)(validNumber)).toBe(
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
      v.throwError('number', NOT_VALID_NUMBER_MESSAGE)(invalidNumber)
    ).toThrowError(new TypeError(NOT_VALID_NUMBER_MESSAGE))
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
        'Returned value of getErrorMessage is not a string'
      )
    )
  })
  test('invalid message is function that returns not string', () => {
    const validNumber = '1'
    expect(() => v.throwError('number', 1)(validNumber)).toThrowError(
      new TypeError(
        'getErrorMessage must be string|function(): string'
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

describe('rest props validation', () => {
  test('wrong input', () => {
    expect(() => {
      v.rest(1)
    }).toThrowError(new TypeError(
      'schema must be string|symbol|array|function|object. JSON: 1'
    ))
  })
  const restValidatorSchema = v.rest('string')
  restValidatorSchema.a = 'number'
  testValidator({
    caption: 'right input - without rest props',
    isValid: v(restValidatorSchema),
    trueValues: [{ a: 1 }, { a: 2, b: '3' }, { a: 3, b: '4', c: '5' }],
    falseValues: [{ a: '1' }, { a: 2, b: 3 }, { a: 3, b: '4', c: 5 }],
    validatorName: `v({ a: 'number', ...v.rest('string')})`
  })
})

describe('not all errors', () => {
  test('arr validation', () => {
    v = v.newCompiler({ allErrors: false })
    const getInvalidKey = v.explain('number', (_, schema, { key }) => key)
    v.arrayOf(getInvalidKey)([1, '2', '3'])
    expect(v.explanation).toEqual([1])
  })
  test('object validation', () => {
    v = v.newCompiler({ allErrors: false })
    const getInvalidKey = v.explain('number', (_, schema, { key }) => key)
    v.dictionaryOf(getInvalidKey)({
      a: 1,
      b: 2,
      c: '3',
      d: '4'
    })
    expect(v.explanation).toEqual(['c'])
  })
  test('keys validation', () => {
    v = v.newCompiler({ allErrors: false })
    const getInvalidKey = v.explain(v => 'ab'.includes(v), key => key)
    v.keys(getInvalidKey)({
      a: 1,
      b: 2,
      c: '3',
      d: '4'
    })
    expect(v.explanation).toEqual(['c'])
  })
  test('object validation - true', () => {
    v = v.newCompiler({ allErrors: false })
    const aValidator = jest.fn(() => true)
    const bValidator = jest.fn(() => true)
    const cValidator = jest.fn(() => true)
    const getInvalidKey = {
      a: aValidator,
      b: bValidator,
      c: cValidator,
      ...v.rest(cValidator)
    }
    v(getInvalidKey)({
      a: 1,
      b: 2,
      c: 3,
      d: 4
    })
    expect(aValidator).toBeCalledTimes(1)
    expect(bValidator).toBeCalledTimes(1)
    expect(cValidator).toBeCalledTimes(2)
  })
  test('object validation - false', () => {
    v = v.newCompiler({ allErrors: false })
    const aValidator = jest.fn(() => true)
    const bValidator = jest.fn(() => false)
    const cValidator = jest.fn(() => true)
    const getInvalidKey = {
      a: aValidator,
      b: bValidator,
      c: cValidator
    }
    v(getInvalidKey)({
      a: 1,
      b: 2,
      c: 3,
      d: 4
    })
    expect(aValidator).toBeCalledTimes(1)
    expect(bValidator).toBeCalledTimes(1)
    expect(cValidator).toBeCalledTimes(0)
  })
  test('object validation - true, without rest', () => {
    v = v.newCompiler({ allErrors: false })
    const aValidator = jest.fn(() => true)
    const bValidator = jest.fn(() => true)
    const cValidator = jest.fn(() => true)
    const getInvalidKey = {
      a: aValidator,
      b: bValidator,
      c: cValidator
    }
    v(getInvalidKey)({
      a: 1,
      b: 2,
      c: 3,
      d: 4
    })
    expect(aValidator).toBeCalledTimes(1)
    expect(bValidator).toBeCalledTimes(1)
    expect(cValidator).toBeCalledTimes(1)
  })
})

describe('withoutAdditionalProps', () => {
  test('wrong input', () => {
    const wrongSchemas = [1, false, null, undefined, 'wrong object validator']
    for (const wrongSchema of wrongSchemas) {
      expect(() => v.withoutAdditionalProps(wrongSchema)).toThrowError(new TypeError('Schema must be an object schema'))
    }
  })
  testValidator({
    caption: 'object input',
    isValid: v.withoutAdditionalProps({
      a: 'number'
    }),
    trueValues: [{ a: 1 }, { a: 0 }],
    falseValues: [{ a: 1, b: 3 }, { a: '0' }, null],
    validatorName: `v.withoutAdditionalProps({ a: 'number' })`
  })
  testValidator({
    caption: 'string input',
    isValid: v.register({ obj: {
      a: 'number'
    } }).withoutAdditionalProps('obj'),
    trueValues: [{ a: 1 }, { a: 0 }],
    falseValues: [{ a: 1, b: 3 }, { a: '0' }, null],
    validatorName: `v.withoutAdditionalProps({ a: 'number' })`
  })
})

describe('examples', () => {
  test('valid schema', () => {
    expect(typeof v.fromConfig({
      validator: 'number',
      examples: [1, 2, 3, 0, NaN, Infinity, -Infinity]
    })).toBe('function')
    const personSchema = v.example(
      {
        name: v.and('not-empty', 'string'),
        age: v.and('positive', 'number'),
        position: 'string'
      },
      {
        name: 'Max Karpenko',
        age: 30,
        position: 'Frontend Developer'
      }
    )
    expect(personSchema({
      name: 'Max Karpenko',
      age: 30,
      position: 'Frontend Developer'
    })).toBe(true)
    expect(typeof v.example('number', 1, 2, 3, 4, 5, 0, -1)).toBe('function')
  })
  test('invalid examples', () => {
    expect(() => v.fromConfig({
      validator: 'number',
      examples: [1, 2, 3, 0, NaN, Infinity, -Infinity, '1']
    })).toThrowError(new TypeError(`Examples don't match the schema`))
  })
  test('empty examples', () => {
    expect(() => v.example('number')).toThrowError(new TypeError('There is not any example'))
  })
})
