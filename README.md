[![npm version](https://badge.fury.io/js/quartet.svg)](https://badge.fury.io/js/quartet)
![npm](https://img.shields.io/npm/dw/quartet.svg)
[![Build Status](https://travis-ci.org/whiteand/quartet.svg?branch=master)](https://travis-ci.org/whiteand/quartet)
[![Known Vulnerabilities](https://snyk.io/test/github/whiteand/quartet/badge.svg?targetFile=package.json)](https://snyk.io/test/github/whiteand/quartet?targetFile=package.json)
[![DeepScan grade](https://deepscan.io/api/teams/2512/projects/3631/branches/32004/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=2512&pid=3631&bid=32004)
<a href='https://coveralls.io/github/whiteand/quartet?branch=master'><img src='https://coveralls.io/repos/github/whiteand/quartet/badge.svg?branch=master' alt='Coverage Status' /></a>
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/validation-quartet/support) [![Greenkeeper badge](https://badges.greenkeeper.io/whiteand/quartet.svg)](https://greenkeeper.io/)


# quartet

Library for validations: beautiful and convenient

## Contents

- [Example](#example)
- [Install](#install)
- [The Way of validation](#the-way-of-validation)
  - [Types of validations](#types-of-validations)
  - [Validation predicates](#validation-predicates)
  - [Object validation](#object-validation)
  - [Registered validations](#registered-validations)
- [Default registered validators](#default-registered-validators)
- [Methods](#methods)
- [Fix Methods](#fix-methods)
- [Tips and Tricks](#tips-and-tricks)
#  Example

```javascript
import quartet from 'quartet'

let v = quartet() // creating validator generator

const emailRegex = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/

const schema = {
  // string with length from 3 to 30
  username: v.and('string', v.min(3), v.max(30)), 
  // string with special pattern
  password: v.and('string', v.regex(/^[a-zA-Z0-9]{3,30}$/)), 
  // string or number
  access_token: ['string', 'number'],
  // integer number from 1900 to 2013
  birthyear: v.and('safe-integer', v.min(1900), v.max(2013)), 
  // email
  email: v.and('string', v.regex(emailRegex))
}

const isValidObj = v(schema)

// Valid example
isValidObj({
  username: 'andrew'
  password: '123456qQ'
  access_token: '321654897'
  birthyear: 1996
  email: 'test@mail.com'
}) // => true

// Not valid example
isValidObj({
  username: 'an' // wrong
  password: '123456qQ'
  access_token: '321654897'
  birthyear: 1996
  email: 'test@mail.com'
}) // => false
```

If we need explanation, then we must use explanation validators (with second parameter of v).

```javascript
const EXPLANATION = {
  NOT_A_VALID_OBJECT: 'NOT_A_VALID_OBJECT',
  // as an explanation we will use propname, just for example
  USER_NAME: 'username', 
  PASSWORD: 'password', 
  ACCESS_TOKEN: 'access_token',
  BIRTH_YEAR: 'birth_year',
  // explanation also can be a function that get actual value (and even more...)
  EMAIL: email => ({ code: 'email', oldValue: email }) 
}
// v takes second parameter - explanation of error
const explanationSchema = v({
  username: v(schema.username, EXPLANATION.USER_NAME),  
  password: v(schema.password, EXPLANATION.PASSWORD), 
  access_token: v(schema.access_token, EXPLANATION.ACCESS_TOKEN), 
  birthyear: v(schema.birthyear, EXPLANATION.BIRTH_YEAR), 
  email: v(schema.email, EXPLANATION.EMAIL)
}, EXPLANATION.NOT_A_VALID_OBJECT)

const isValidWithExplanation = v(explanationSchema)
v.resetExplanation() // or just v()
const isValid = isValidWithExplanation({
  // wrong
  username: 'an', 
  password: '123456qQ',
  // wrong
  access_token: null, 
  birthyear: 1996,
  // wrong
  email: '213' 
}) // => true

// all explanations will be saved into v.explanation
const errors = v.explanation // errors = ['username', 'access_token', { code: 'email', value: '213'}]
console.log(v.explanation.filter(v('string')).join(', ') + ' are not valid') // => 'username, access_token are not valid'
```

If we want to set default values we can use fix methods (filter, default, addFix, ...):

```javascript
const schema = {
  username: v.default(
    v.and('string', v.min(3), v.max(30)),
    'unknown'
  ), 
  password: v.filter(
    v.and('string', v.regex(/^[a-zA-Z0-9]{3,30}$/))
  ), // removes password field if it's invalid
  access_token: v.filter(['string', 'number']),
  birthyear: v.default(
    v.and('safe-integer', v.min(1900), v.max(2013)), 
    1996
  ),
  emails: v.and(
    v.default('array', []),
    v.arrayOf(
      v.filter( // removes element if invalid
        v.and('string', v.regex(emailRegex))
      )
    )
  )
}
const obj = {
  // wrong
  username: 'an', 
  password: '123456qQ',
  // wrong
  access_token: null, 
  // wrong
  birthyear: '213',
  // wrong
  email: ['wrong email', 'andrewbeletskiy@gmail.com', 'wrong email]
}
v.resetExplanation()
v(schema)(obj) // => false
v.fix(obj)
/*
  => {
    username: 'unknown',
    password: '123456qQ',
    brithyear: 1996,
    emails: ['andrewbeletskiy@gmail.com']
  } // it's returns new fixed value
*/
v.resetExplanation()
obj.emails = null
v(schema)(obj)
v.fix(obj) // => { username: 'unknown', password: '123456qQ', brithyear: 1996, emails: [] }
```

Validators, object validators, variant validators, explanation validators and fix-validators are all can be composed into larger validator.

# Install

```
npm install quartet
```

# The Way of Validation

**Let's install and import quartet (it will be used in all examples below)**

```javascript
const quartet = require("quartet");
let v = quartet() // create instance of validator generator
```

## Types of validations

There are four types of validations:

- validation predicates (function that returns boolean value)
- object validations (predicates for keys and values in object)
- known to everybody (registered)
- Combinated validation (all previous types in different combinations
  using `and` and/or `or` logic operations)

## Validation predicates

It's maybe the simplest type of validations. So go to examples:
If we want to validate even number we can just write:

```javascript
const isEven = x => x % 2 === 0;
const isTwoEven = isEven(2);
```

This is very simple. Let's use `quartet` to rewrite it.

```javascript
const isEven = v(x => x % 2 === 0);
const isTwoEven = isEven(2);
// or
const isTwoEven = v(x => x % 2 === 0)(2);
```

As you see `quartet` can take predicate function as a parameter. The first argument of the function is the value to be validate. (There are other arguments, but this is a different story)
It seems to be not necessary to use `quartet` for such examples. So we should go deeper to see full beauty of validation!

## Object validation

There is something in objects - they are complex, they consists of many different parts. All parts should be validated separately and sometimes all together.

**Let's write some examples:**

**Straight way of validation**

```javascript
const obj = {
   theNumber: 1,
   theString: '2',
   theArray: [3],
   theNull: null,
   theUndefined: undefined,
   theObject: {
       innerProp: 100
   }
}
// As you can see there are a lot of parts we can validate!
const isObj = x => typeof x === 'object' && x !== null
const isObjectValid(obj) {
 if (!isObj(obj)) return false
 if (typeof obj.theNumber !== 'number') return false
 if (typeof obj.theString !== 'string') return false
 if (!Array.isArray(obj.theArray)) return false
 if (obj.theArray.some(n => typeof n !== 'number')) return false
 if (obj.theNull !== null) return false
 if (!obj.hasOwnProperty('theUndefined') || obj.theUndefined !== undefined)
   return false
 if (!isObj(obj.theObject))
   return false
 if (typeof obj.theObject.innerProp !== 'number')
   return false
 return true
}
```

Let's use `quartet`! (and maybe it will be easier to read and write?)

```javascript
const isNumber = n => typeof n === "number";
const isObjectValidSchema = {
  theNumber: isNumber,
  theString: s => typeof s === "string",
  theArray: arr => Array.isArray(arr) && arr.every(isNumber),
  theNull: value => value === null,
  theUndefined: (value, { key, parent }) =>
    parent.hasOwnProperty(key) && value === undefined,
  theObject: {
    innerProp: isNumber
  }
};
const isObjectValid = v(isObjectValidSchema);
const isValid = isObjectValid(obj);
```

As you can see `quartet` also can takes an object as a schema. All values passed to resulting validation function must be an object. All properties must be validated using validation predicates.

But there is some new in this example. Let's look at validation for `theUndefined` property:

```javascript
theUndefined: (value, { key, parent }) =>
  parent.hasOwnProperty(key) && value === undefined;
```

Predicate takes not only the value to be validated. It takes all parents in hierarchy of the object. It can be used for a such checking of required field.
Also you can use values of other properties contained in the parent.

You can do any validation you want using all parents of the value, because has a such specifiation:

```javascript
function predicate(
  valueToValidate,
  {key: keyInParent, parent: valueOfParent},
  {key: keyInParent2, parent: valueOfParent2},
  ...
): Boolean
```

Also as you can see: inner values of schema - are not only simple predicates. But they can be any valid schema for `quartet`. You can see how do we use object schema for checking `theObject` property.

(You can see that code is still not so beautiful as we want. What do we want? Go deeper to see it!)

## Registered validations

As you can see there are a lot of simple small validators like `isNumber` or `isArray`. It will be better to write them once and use everywhere, won't it?
Let's use `quartet` for it:

```javascript
v = v.register({ // Returns new validator generator with such aliases
  number: x => typeof x === "number",
  array: x => Array.isArray(x),
  string: x => typeof x === "string",
  object: x => typeof x === "object",
  "undefined": x => x === undefined,
  "null": x => x === null,
  required: (_, { key, parent }) => parent.hasOwnProperty(key)
})

const isObjectValidSchema = {
  theNumber: "number",
  theString: "string",
  theArray: arr => v("array")(arr) && arr.every(v("number")),
  theNull: "null",
  theUndefined: (x, parent) => v("required")(x, parent) && v("undefined")(x),
  theObject: {
    innerProp: "number"
  }
};
const isValid = v(isObjectValidSchema)(obj);
```

This is interesting and useful solution, but this is much complicted that it was before, but we can do better! Go deeper!

## Combinated validations

This complexity is bad. It's scary thing that people hate.

Complexity can be defeated by _composition_.

We use combinators for creating composition.

There is *OR-composition*. It combines validations in such way that it returns true if some of validations are true.
It uses a such syntax:

```javascript
v([
    orSchema,
    orSchema2,
    orSchema3,
    ...
])
```
There is *AND-composition*. It combines validations in such way that it returns true only if all of validations are true.
It uses a such syntax:
```javascript
v.and(
  andSchema,
  andSchema2,
  andSchema3,
  andSchema4,
  andSchema5,
  ...
)
```
So you can see that first level of nestedness is - OR operator. Second level - AND operator. Third - is OR operator and so on.

Let's try to create example of complexity, and destroy it with using registered validators and combinators.

```javascript
const v = require("quartet");

const obj = {
  theNumberOrString: "2",
  theString: "2",
  theArrayOfNumbers: [3],
  theNull: null,
  theRequiredUndefinedOrNumber: undefined,
  theObject: {
    innerProp: 100
  }
};

v = v.register({ // Returns new validator generator with such aliases
  number: x => typeof x === "number",
  array: x => Array.isArray(x),
  string: x => typeof x === "string",
  object: x => typeof x === "object",
  "undefined": x => x === undefined,
  "null": x => x === null,
  required: (_, { key, parent }) => parent.hasOwnProperty(key)
})

const isObjectValidSchema = {
  theNumberOrString: ["number", "string"],
  theString: "string",
  theArrayOfNumbers: v.arrayOf("number"),
  theNull: "null",
  theRequiredUndefinedOrNumber: v.and("required", ["undefined", "number"]),
  theObject: {
    innerProp: "number"
  }
};
v(isObjectValidSchema)(obj);
```

# Default registered validators

There are such registered validators by default:

|      name      |                   condition                    |
| :------------: | :--------------------------------------------: |
|    'string'    |            `typeof x === 'string'`             |
|     'null'     |               `x => x === null`                |
|  'undefined'   |             `x => x === undefined`             |
|     'nil'      |      `x => x === null || x === undefined`      |
|    'number'    |          `x => typeof x === 'number'`          |
| 'safe-integer' |         `x => Number.isSafeInteger(x)`         |
|    'finite'    |           `x => Number.isFinite(x)`            |
|   'positive'   |                  `x => x > 0`                  |
|   'negative'   |                  `x => x < 0`                  |
| 'non-negative' |                 `x => x >= 0`                  |
| 'non-positive' |                 `x => x <= 0`                  |
|    'object'    |          `x => typeof x === 'object'`          |
|   'object!'    |   `x => typeof x === 'object' && x !== null`   |
|    'array'     |            `x => Array.isArray(x)`             |
|  'not-empty'   | return `true` if value is not empty (see code) |
|    'symbol'    |          `x => typeof x === 'symbol'`          |
|   'function'   |         `x => typeof x === 'function'`         |
|     'log'      |   returns `true` and logs value and parents    |
|   'required'   |  returns `true` - if parent has the property   |

So you can see that we shouldn't register own validators - if they are present by default. So example above can be rewritten without registering any of validators.


# Methods

## Types
```javascript
type Schema = function|string|object|Array`
type Parent = { key: string|number, parent: object|array }
type Validator = function(
  value: any,
  parent: Parent,
  grandParent: Parent,
  grandGrandParent: Parent,
  ...
) => boolean
type FromValidable<T> = function(
  value: any,
  parent: Parent,
  grandParent: Parent,
  grandGrandParent: Parent,
  ...
) => T
```

---

### `v.registered :: Object<schemaName, schema: Schema>`
returns object with registered schemas

---

### `v.register :: (AdditionalSchemas: object<string, Schema>) => quartet instance`
returns new quartet instance with added aliases for validators.

---

### `v.required :: (...requiredProps: string) => (obj: object) => boolean`
returns true if `obj` has all `requiredProps`.

```javascript
  v.required('a', 'b')({a: 1, b: 2}) // => true
  v.required('a', 'b')({a: 1}) // => false
```

---

### `v.requiredIf :: (isRequired: boolean) => Validator`

if `isRequired` is truthy, validator returns true only if parent has such property.

```javascript
const aRequired = v({
  a: v.requiredIf(true)
});
const aNotRequired = v({
  a: v.requiredIf(false)
});
aRequired({ a: 1 }) // => true
aNotRequired({ a: 1 }) // => true
aNotRequired({}) // => true
aRequired({ a: 1 }) // => false
```

---

### `v.requiredIf :: (schema: Schema) => Validator(value, ...parents)`
if `v(schema)(value, ...parents)` returns true, then this field treated as required.

```javascript
const hasParentHasB = (_, { parent }) => parent.hasB
const bObjValidator = v({
  hasB: "boolean",
  b: v.requiredIf(getParentHasB) // if hasB is true, then b must be required
})
bObjValidator({ hasB: true, b: 1 }) // => true
bObjValidator({ hasB: false }) // => true
bObjValidator({ hasB: true }) // => false
```

---

### `v.arrayOf :: (schema: Schema) => (arr: any) => boolean`
returns true if `arr` is Array and all elements of `arr` are valid

```javascript
v.arrayOf('number')([1,2,3,3,4,5]) // => true
v.arrayOf('number')([1,'2',3,'3',4,5]) // => false

v.arrayOf(isPrime)([1,2,3,4,5,6,7]) // => false
v.arrayOf(isPrime)([2,3,5,7]) // => true
```

---

### v.dictionaryOf :: (schema: Schema) => (dict: object<key, value>) => boolean`
returns true if all values stored in `dict` are valid using `schema`.

```javascript
const isNumberDict = v.dictionaryOf('number')
isNumberDict({a: 1, b: 2, c: 3}) // => true
isNumberDict({a: 1, b: 2, c: '3'}) // => false
```

`dictionaryOf` can be rewritten with using `v.rest` method

```javascript
const isNumberDict = v.dictionaryOf('number')
const isNumberDict2 = v({ ...v.rest('number') })
```

---

### `v.rest :: (schema: Schema) => object`
Returns schema that can be spreaded into object validation schema to check other properties.

```javascript
const aAndStrings = v({
  a: 'number', 
  ...v.rest('string')
})
aAndString({
  a: 1
}) // => true
aAndString({
  a: 1,
  b: '1'
}) // => true
aAndString({
  a: 1,
  b: 2
}) // => false
```

---

### v.keys :: (schema: Schema) => (dict: object<key, value>) => boolean`
returns true if all keys used in `dict` are valid using `schema`

```javascript
const isAbcDict = v.keys(key => ['a', 'b', 'c'].includes(key))
isNumberDict({a: 1, b: 2, c: 3}) // => true
isNumberDict({a: 1, b: 2, c: '3'}) // => true
isNumberDict({a: 1, b: 2, c: '3', d: '4'}) // => false
```

---

### `v.throwError :: (schema: Schema, errorMessage: string|FromValidable<string>) => FromValidable<any>`
`throwError` returns value if it's valid. Throw TypeError if it isn't.  if `errorMessage` is `string` then it will be used as error message. If it's a function then errorMessage(value, parent: Parent, grandParent: Parent, ...) will be used as error Message.

```javascript
const userId = 
v.throwError('number', 'userId must be a number')('123') // => throws new Error
v.throwError('number', 'userId must be a number')(123) // => 123
```

---

### `v.min :: (minValue: number) => value => boolean`

If value is array, returns true only if

`value.length >= minValue`

If value is string, returns true only if

`value.length >= minValue`

If value is number, returns true only if

`value >= minValue`

If value instanceof Set, returns true only if

`value.size >= minValue`

If value instanceof Map, returns true only if

`value.size >= minValue`

```javascript
v.min(5)(4) // => false
v.min(5)(5) // => true
v.min(5)(6) // => true

const isValidYear = v(v.and('number', v.min(1900), v.max(2100)))
isValidYear('1875') // => false, because of type string
isValidYear(1875) // => false
isValidYear(1996) // => true
isValidYear(2150) // => false

v.min(5)([1,2,3,4]) // => false
v.min(5)([1,2,3,4,5]) // => true
v.min(5)([1,2,3,4,5,6]) // => true

const isValidMiddleSizeArrayOfNumbers = v(v.and(v.arrayOf('number'), v.min(5), v.max(10)))
isValidMiddleSizeArrayOfNumbers([1,2,3,4,'5',6]) // => false, because of '5'
isValidMiddleSizeArrayOfNumbers([1,2,3]) // => false, because of length
isValidMiddleSizeArrayOfNumbers([1,2,3, 4,5,6,7]) // => true

v.min(5)('1234') // => false
v.min(5)('12345') // => true
v.min(5)('12346') // => true
```

### `v.max :: (maxValue: number) => value => boolean`

If value is array, returns true only if

`value.length <= maxValue`

If value is string, returns true only if

`value.length <= maxValue`

If value is number, returns true only if

`value <= maxValue`

If value instanceof Set, returns true only if

`value.size <= maxValue`

If value instanceof Map, returns true only if

`value.size <= maxValue`

```javascript
v.max(5)(6) // => false
v.max(5)(5) // => true
v.max(5)(4) // => true

v.max(5)([1,2,3,4,5,6]) // => false
v.max(5)([1,2,3,4,5]) // => true
v.max(5)([1,2,3,4]) // => true

v.max(5)('123456') // => false
v.max(5)('12345') // => true
v.max(5)('1234') // => true

const isValidName = v(v.and('string', v.min(8), v.max(16)))
isValidName('andrew') // => false
isValidName('andrew beletskiy') // => true
```

---

### `v.regex :: (regex: RegExp) => (str: any) => boolean`
returns regex.test(str)

```javascript
v(/abc/)('abcd') // => true
v(/abc/)('  abcd') // => true
v(/^abc/)('  abcd') // => false
```

---

### `v.explain :: (schema: Schema, explanation: any|function) => Validator`
Returns validator with side-effect of changing `v.explanation`. If validation failed, `explanation` or `explanation(value, ...)` will be pushed into `v.explanation` array. 

```javascript
v.resetExplanation()
const isValid = v.explain("number", value => value);
isValid(1) // => true
v.explanation // => []
isValid(null)
v.explanation // => [NULL]
isValid(2)
v.explanation // => [NULL]
v.resetExplanation()
v.explanation // => []
```

This method is not so convenient because compiler instance(`v`) takes second parameter of explanation and returns `v.explain(schema, explanation)` if explanation is not undefined.

---

### not :: (schema: Schema) => Validator`
Returns opposite validator.

---


### `omitInvalidItems :: (schema) => (collection: Array|object<key, value>) => Array|object<key, value>`

If `collection` is array, the returs new array without invalid values.

If `collection` is object, then returns new object without invalid values.

```javascript
const arr = [1, "2", 3, "4", 5];

const onlyNumbers = v.omitInvalidItems("number")(arr); // [1, 3, 5]
const onlyStrings = v.omitInvalidItems("string")(arr); // ["2", "4"]

const invalidNumberDict = {
  a: 1,
  b: "2",
  c: 3
};
const onlyNumberProperties = v.omitInvalidItems("number")(
  invalidNumberDict
);
onlyNumberProperties(invalidNumberDict) // => { a: 1, c: 3 }
```

---


### `v.omitInvalidProps :: (objSchema: object|string, { omitUnchecked: boolean = true }) => object => object`
Removes invalid properties. If keepUnchecked is falsy value, function will keep unchecked properties of object.

```javascript
const removeInvalidProps = v.omitInvalidProps({
  num: 'number',
  str: 'string',
  arrNum: v.arrayOf('number')
})
removeInvalidProps({
  num: 123,
  str: 123,
  arrNum: [123],
  unchecked: 32
}) // => { num: 123, arrNum: [123]}
const removeInvalidKeepUnchecked = v.omitInvalidProps({
  num: 'number',
  str: 'string',
  arrNum: v.arrayOf('number')
}, { omitUnchecked: false })
removeInvalidProps({
  num: 123,
  str: 123,
  arrNum: [123],
  unchecked: 32
}) // => { num: 123, arrNum: [123], unchecked: 32 }
```

---

### `v.validOr :: (schema: Schema, defaultValue: any) => value => value`
Returns `value` if it's valid. Returns `defaultValue` otherwise.

---

### `v.newCompiler :: (settings: { registered: Object<name, schema>, allErrors: boolean }) => quartet instance`
Returns new instance of validator generator with custom aliases

---

### `v.enum :: (primitiveValue, primitiveValue2 ,...) => Validator`
Returns validator, that returns true only of value isone of primitiveValues.

---

### `v.parent :: (schema: Schema) => Validator`
Checks is parent of the value is valid.

```javascript
  // example above can be rewritten with using of parent method
  
  const bObjValidator = v({
    hasB: "boolean",
    b: v.requiredIf(v.parent(p => p.hasB)) // if hasB is true, then b must be required
  })
  bObjValidator({ hasB: true, b: 1 }) // => true
  bObjValidator({ hasB: false }) // => true
  bObjValidator({ hasB: true }) // => false
```

### `v.withoutAdditionalProps :: (schema: object|string) => Validator`
Returns true only if passed value is object and has valid props and has not any additional properties.

```javascript
  const onlyANumber = v.withoutAdditionalProps({ a: 'number' })
  onlyANumber(null) // => false
  onlyANumber(1) // => false
  onlyANumber({ a: 1 }) // => true
  onlyANumber({ a: '1' }) // => false
  onlyANumber({ a: 1, b: 2 }) // => false
```

# Fix Methods

Fix methods takes validators and returns validator with side-effect of recording how to fix invalidation. And after validation we can use method `v.fix(invalidValue) => validValue` to fix errors.

### Warning: if there is fix of child and fix of parent - only parent fix will be applied:

```javascript
  const isObjectValid = v(v.default({
    child: v.default('string', '')
  }), {})
  const obj = { child: 1 }
  isObjectValid(obj)
  v.fix(obj) // => {}
```

## `v.fix :: (value: any) => any`

It gets all fixes added by fix methods and applies it on `value`. Returns new value with all fixes applied. It's pure function.


There three main fix methods: filter, default, addFix.

## `v.filter :: (schema) => Validator`

Takes validator and returns new validator with side effect: if value is invalid - it will be removed with using `v.fix` from parent (object or array)

```javascript
 const obj = {
   arr: [1,2,'3',4,5]
   obj: {
     a: 1, // must be removed
     b: 2, // not removed
     c: '3', // must be removed
     d: 'string' // not removed
   }
 }
 v.resetExlanation()({
  arr: v.arrayOf(v.filter('number')),
  obj: {
    a: v.filter('string'),
    d: v.filter('string')
    ...v.rest(v.filter('number'))
  }
 })(obj) // => false
 console.log(v.hasFixes()) // => true
 console.log(v.fix(obj)) // => { arr: [1,2,4,5], obj: { b: 2, d: 'string' } }
```

## `v.default :: (schema, defaultValue) => Validator`

Takes validator and returns new validator with side effect: if value is invalid - it will be replaced with using `v.fix` by default value.

```javascript
 const obj = {
   arr: [1,2,'3',4,5]
   obj: {
     a: 1, // must be removed
     b: 2, // not removed
     c: '3', // must be removed
     d: 'string' // not removed
   }
 }
 v.resetExlanation()({
  arr: v.arrayOf(v.default('number', 0)),
  obj: {
    a: v.default('string', ''),
    ...v.rest(v.default('number'))
    d: v.default('number', 0)
  }
 })(obj) // => false
 console.log(v.hasFixes()) // => true
 console.log(v.fix(obj)) // => { arr: [1,2,0,4,5], obj: { a: '', b: 2, c: 0, d: 'string' } }
```

## `v.addFix :: (schema, fixFunction) => Validator`

Takes validator and returns new validator with side effect: if value is invalid - it will be replaced with using `v.fix` by default value.

```javascript
 const arr = [1,2,'3',4,5]
 v.resetExlanation()
 const toNumber = (v, { key, parent }) => { // changes value to number
   parent[key] = Number(v) // we need to change by parent reference in order to mutate fix result
 }
 v(v.arrayOf(v.addFix('number', toNumber))(obj) // => false
 console.log(v.hasFixes()) // => true
 console.log(v.fix(obj)) // => [1,2,3,4,5]
```

## `v.fromConfig :: (config: Config) => Validator`

```javascript
@typedef Config {{
  validator: Schema, 
  explanation: any|function(): any // not required
  // one of the next fix params
  default: any,
  filter: any,
  fix: function(invalidValue, { key, parent}, ...): void // mutate parent to fix error
}}
```

fromConfig is used to set validator, explanation and fix at one config.

Example:

```javascript
const arr = [1, 2, 3, 4, '5', '6', 7]
const isElementValid = v.fromConfig({
  validator: 'number',
  explanation: (value, { key }) => `${key}th element is not a number: ${JSON.stringify(value)}`,
  fix: (invalidValue, { key, parent }) => {
    parent[key] = Number(invalidValue)
  }
})

const isArrValid = v.fromConfig({
  validator: v.arrayOf(isElementValid),
  explanation: 'Not valid array'
})

v()

isArrValid(arr) // => false

console.log(v.hasFixes()) // => true
console.log(v.explanation) // => [ '4th element is not a number: "5"','5th element is not a number: "6"', 'Not valid array' ]
console.log(v.fix(arr)) // => [ 1, 2, 3, 4, 5, 6, 7 ]
```

## v.example :: (schema: Schema, ...examples: any)

If examples are not valid by schema - it will throw an erorr.
It will return schema otherwise.

```javascript
v.example('number', 1,2,3,4, '4', '5', '6')
//> throws error

v.example(['number', 'string'], 1,2,3,4, '4', '5', '6')
//> returns schema ['number', 'string']
```

It can be use as test for schema, and for documentation:

```javascript
  const personValidator = v.example(
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
  personValidator({
    name: 'Max Karpenko',
    age: 30,
    position: 'Frontend Developer'
  }) // => true

```

# Tips and Tricks

## Using OR combinator for explanation function

It's the same trick that we can use when write such things
```javascript
  let a = 1
  let setA = value => { a = value }
  true || setA(10)
  a // => 1
  false || setA(10)
  a // => 10
```
We can add "validation" function as a last element of OR combinator - in such way it will be started only if all previous validators return false. And this validator must returns false - because it just used for side effect, but not for validation.
Let's take an example, and rewrote explanation schema with using OR combinator for creating array of validation explanation.
```javascript
// This is not changed
const emailRegex = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/
const schema = {
  username: v.and('string', v.min(3), v.max(30)), 
  password: v.and('string', v.regex(/^[a-zA-Z0-9]{3,30}$/)), 
  access_token: ['string', 'number'],
  birthyear: v.and('safe-integer', v.min(1900), v.max(2013)), 
  email: v.and('string', v.regex(emailRegex))
}
// Let's write a helper function expl(code: string): void
let explanation = []
function expl(code) {
  // this is false validator with side effect
  return function pushCodeToExplanation() {
    explanation.push(code)
    return false 
  }
}

const EXPLANATION = {
  NOT_A_VALID_OBJECT: 'NOT_A_VALID_OBJECT',
  USER_NAME: 'username', 
  PASSWORD: 'password', 
  ACCESS_TOKEN: 'access_token',
  BIRTH_YEAR: 'birth_year',
  EMAIL: 'email'
}

const explanationSchema = {
    username: [
      // if it's false, next validator will be run
      schema.username, 
      // this is false validator with sideeffect of pushing code into explanation
      expl(EXPLANATION.USER_NAME) 
    ],  
    password: [
      schema.password,
      expl(EXPLANATION.PASSWORD) // will be run if password doesn't follow the schema
    ], 
    access_token: [
      schema.access_token,
      expl(EXPLANATION.ACCESS_TOKEN)
    ], 
    birthyear: [
      schema.birthyear,
      expl(EXPLANATION.BIRTH_YEAR)
    ], 
    email: [
      schema.email,
      expl(EXPLANATION.EMAIL)
    ]
  }

v(explanationSchema)({
  // wrong
  username: 'an', 
  password: '123456qQ',
  // wrong
  access_token: null, 
  birthyear: 1996,
  // wrong
  email: '213' 
})

// explanation was changed by side effect of last functions
console.log(explanation) // => ['username', 'access_token', 'email']
