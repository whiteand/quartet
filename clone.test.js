/* global test, expect, describe */
const clone = require('./clone')
describe('Clone test', () => {
  test('primitives', () => {
    expect(clone(1)).toBe(1)
    expect(clone(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER)
    expect(clone('')).toBe('')
    expect(clone(undefined)).toBe(undefined)
    expect(clone(null)).toBe(null)
  })
  test('recursive', () => {
    const a = { b: null }
    const b = { a: a }
    a.b = b
    const clonedA = clone(a)
    expect(clonedA !== a).toBe(true)
    expect(clonedA.b !== a.b).toBe(true)
    expect(clonedA.b.a !== a.b.a).toBe(true)
    expect(clonedA.b.a !== a.b.a).toBe(true)
    expect(clonedA.b.a === clonedA).toBe(true)
  })
  test('regexp', () => {
    const regex = /abc/gi
    const clonedRegex = clone(regex)
    expect(clonedRegex).toEqual(regex)
    expect(clonedRegex !== regex).toBe(true)
  })
  test('date', () => {
    const date = new Date(2012, 12, 21)
    const clonedDate = clone(date)
    expect(clonedDate).toEqual(date)
    expect(clonedDate !== date).toBe(true)
  })
})
