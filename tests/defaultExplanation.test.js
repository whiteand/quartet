/* global test, jest, expect, describe */
const quartet = require('../src/index')

test('requiredIf method: boolean argument', () => {
  // condition variant
  const v = quartet({
    defaultExplanation: function(value, schema, ...keyParents ) {
      return typeof schema === 'function' ? keyParents.map(e => e.key).reverse().join('.') : undefined
    }
  })

  const validObj = v({
    a: 'number',
    b: {
      c: 'number'
    }
  })

  validObj({
    a: '1',
    b: {
      c: '2'
    }
  })

  expect(v.explanation).toEqual(['a', 'b.c'])
})
