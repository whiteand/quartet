
/* global test, expect, describe */
const quartet = require('./index')
let v = quartet()

describe('fix method', () => {
  test('empty fixes, must deep clone', () => {
    const a = { a: [{ b: 1 }] }
    v.resetExplanation()
    const fixedA = v.fix(a)
    expect(a !== fixedA).toBe(true)
    expect(a.a !== fixedA.a).toBe(true)
    expect(a.a[0] !== fixedA.a[0]).toBe(true)
    expect(a.a[0].b === fixedA.a[0].b).toBe(true)
    expect(a).toEqual(fixedA)
  })

  test('default valid', () => {
    expect(v().default('number', 1)(42)).toBe(true)
    expect(v.hasFixes()).toEqual(false)
  })
  test('default invalid', () => {
    expect(v().default('number', 0)('42')).toBe(false)
    expect(v.hasFixes()).toEqual(true)
    expect(v.fix('42')).toBe(0)
  })
  test('default inner', () => {
    const obj = {
      num: '1',
      str: 2,
      arr: [1, 2, '3', 4, 5, '6', 7],
      arrDef: [1, 2, '3', 4, 5, '6', 7]
    }
    const schema = {
      num: v.default('number', 0),
      str: v.default('string', ''),
      arr: v.default(v.arrayOf('number'), []),
      arrDef: v.arrayOf(v.default('number', 0))
    }
    v()
    expect(v.hasFixes()).toBe(false)
    v(schema)(obj)
    expect(v.hasFixes()).toBe(true)
    const fixedObj = v.fix(obj)
    expect(fixedObj).toEqual({
      num: 0,
      str: '',
      arr: [],
      arrDef: [1, 2, 0, 4, 5, 0, 7]
    })
  })
  test('default rest', () => {
    const obj = {
      a: 1,
      b: '2',
      c: '3',
      d: '4'
    }
    v()({
      a: v.default('string', ''),
      ...v.rest(v.default('number', 0))
    })(obj)
    expect(v.hasFixes()).toBe(true)
    expect(v.fix(obj)).toEqual({
      a: '',
      b: 0,
      c: 0,
      d: 0
    })
  })
  test('filter valid', () => {
    const num = 1
    v().filter('number')(num)
    expect(v.hasFixes()).toBe(false)
    expect(v.fix(num)).toBe(num)
  })
  test('filter invalid', () => {
    const num = '1'
    v.filter('number')(num)
    expect(v.hasFixes()).toBe(true)
    expect(v.fix(num)).toBe(undefined)
  })
  test('filter inner valid', () => {
    const obj = {
      a: '123'
    }
    const isValidObj = v({
      a: v.filter('number')
    })
    v()(isValidObj)(obj)
    expect(v.hasFixes()).toBe(true)
    expect(v.fix(obj)).toEqual({})
  })
  test('filter inner valid', () => {
    const obj = {
      a: ['123']
    }
    const isValidObj = v({
      a: v.arrayOf(v.filter('number'))
    })
    v()(isValidObj)(obj)
    expect(v.hasFixes()).toBe(true)
    expect(v.fix(obj)).toEqual({ a: [] })
  })
})
