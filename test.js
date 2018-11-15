const v = require('./index')()
const { FIX_TREE } = require('./symbols')
const util = require('util')
const insplog = x => console.log(util.inspect(x, { colors: true, depth: 100 }))
const isValid = v({
  a: {
    b: {
      c: v.default('number', 0),
      d: v.default(v.default('string', 0), 1)
    },
    e: v.arrayOf(v.default('number', 0))
  }
})

isValid({
  a: {
    b: {
      c: '123',
      d: 1
    },
    e: [1, 2, '3']
  }
})
insplog(v[FIX_TREE])
