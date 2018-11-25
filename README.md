[![npm version](https://badge.fury.io/js/quartet.svg)](https://badge.fury.io/js/quartet)
![npm](https://img.shields.io/npm/dw/quartet.svg)
[![Build Status](https://travis-ci.org/whiteand/quartet.svg?branch=master)](https://travis-ci.org/whiteand/quartet)
[![Known Vulnerabilities](https://snyk.io/test/github/whiteand/quartet/badge.svg?targetFile=package.json)](https://snyk.io/test/github/whiteand/quartet?targetFile=package.json)
<a href='https://coveralls.io/github/whiteand/quartet?branch=master'><img src='https://coveralls.io/repos/github/whiteand/quartet/badge.svg?branch=master' alt='Coverage Status' /></a>
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/validation-quartet/support) [![Greenkeeper badge](https://badges.greenkeeper.io/whiteand/quartet.svg)](https://greenkeeper.io/)
<a href='https://sonarcloud.io/api/project_badges/measure?project=whiteand_quartet&metric=alert_status'>
  <img src='https://sonarcloud.io/api/project_badges/measure?project=whiteand_quartet&metric=alert_status'/>
</a>

# Data Validation Practise for Frontend

> If you want to know how to validate forms in Vue - this article is not for you. You should use some standard Vue plugins such as [vuelidate](https://monterail.github.io/vuelidate/)
>
> My advice: validation schema must be placed in the component that will submit the form.

We often create software that depends on data from some third side(ex. API calls, Backend, Parent Component, ...), you need to be ready that data you get can have any shape and content. So we need to validate data, that we take from other places.

_____________________________________________________________

## Contents

- [Solution Requirements](#solution-requirements)
- [Solution](#solution)
- [Validation of types](#validation-of-types)
  - [Numbers](#validation-of-numbers)
  - [Strings](#validation-of-strings)
  - [Other types](#validation-of-other-types)
  - [Alternatives](#alternatives)
- [Custom validation rules](#custom-validation-rules)
- [Deep validation](#deep-validation)
  - [Deep Validation of Object](#deep-validation-of-object)
  - [Deep Validation of Array](#deep-validation-of-array)
- [Fixing of invalid data](#fixing-of-invalid-data)
- [Tracking](#tracking)
  - [Messages](#messages)
  - [Errors](#errors)
- [Additional Possibilities](#additional-possibilities)
- [API Docs](#api-docs)
- [Other Solutions](#other-solutions)
- [Contacts](#contacts)

_____________________________________________________________

## Solution Requirements

For almost all problems there are more or less useful solutions.  And for our problem we set these goals to be achieved:

- Validation of types(number, object, array, string, null, undefined,...)
- Custom validation rules;
- Deep validation;
- Fixing of invalid data:
  - set default value;
  - omit invalid.
- Tracking:
  - messages,
  - errors;
- Clear code
  - Readable
  - Modifiable

_____________________________________________________________

## Solution

As one of the solutions that we can use to achieve this goals is [`quartet`](https://www.npmjs.com/package/quartet) library.

These library based on this validation definition:
> "To validate" is to prove that some data is acceptable for using.

From the definition we see that validation has only two possible results: "data is acceptable" and "data is not acceptable". In javascript we represent this value in such way:

| Result                | JS value |
|:---------------------:|:--------:|
| Data is acceptable    | `true`   |
| Data isn't acceptable | `false`  |

Let's see how do we use `quartet` to achieve goals described above.

_____________________________________________________________

## Validation of Types

For testing types we can use default registered validators and custom functions.

```javascript
// Import library
import quartet from 'quartet'
const v = quartet()
```

`v` - is a function that transforms schema into validation function. It takes two arguments
1. Validation schema (required)
2. Custom error (optional)

>**Validation schema** is one of:
> - validation function (function that returns `true` or `false`)
>- [names of registered validation functions](https://github.com/whiteand/quartet#default-registered-validators)
>- array of schemas of validation alternatives.
>- object like `{ key1: schemaForKey1, key2: schemaForKey2, ... }`

>**Custom error** is any javascript value(except `undefined`) or function that returns any javascript value. This value will be treated as explanation of schema validation error. And will stored in `v.explanation`. Example of usage see in [Tracking](#tracking) section.

_____________________________________________________________

### Validation of Numbers

```javascript
const isNumber = v('number') // returns typeof value === 'number'
isNumber(0)         // true
isNumber(-1)        // true
isNumber(1)         // true
isNumber(1.2)       // true
isNumber(NaN)       // true
isNumber(Infinity)  // true
isNumber(-Infinity) // true

isNumber('1')             // false
isNumber(new Number(123)) // false
```

Checking of finite numbers (without NaN, Infinity, -Infinity)

```javascript
// Lets put all values into array
// and find all values that are finite numbers
const numberLikeValues = [0, -1, 1, 1.2, NaN, Infinity, -Infinity, '1', new Number(123)]

// v('filter') is the same function as: value => Number.isFinite(value))
numberLikeValues.filter(v('finite')) // [0, -1, 1, 1.2]
```

Checking of integer numbers

```javascript
// v('safe-integer') is the same function as: value => Number.isSafeInteger(value))
numberLikeValues.filter(v('safe-integer')) // [0, -1, 1]
```

Also we can check number sign:

```javascript

// v('positive') is the same function as: x => x > 0
numberLikeValues.filter(v.and('positive', 'finite')) // [1, 1.2]

```

> `v.and(schema, schema2, schema3, ...)` means that validated value must match `schema` **AND** `schema2` **AND** `schema3` and so on. 


```javascript
// v('negative') is the same function as: x => x < 0
numberLikeValues.filter(v.and('negative', 'number')) // [-1, -Infinity]

// v('negative') is the same function as: x => x < 0
numberLikeValues.filter(v.and('non-positive', 'finite')) // [0, -1]
numberLikeValues.filter(v.and('non-negative', 'safe-integer')) // [0, 1]
```

Also there is methods that returns number validation functions:
- `v.min(minValue)`;
- `v.max(maxValue)`;
- `v.enum(value, value2, ...)` checks if validated value is one of passed values.

Let's use them to test rating value:
```javascript
// v.min(minValue) for numbers is the same function as: x => x >= minValue
// v.max(minValue) for numbers is the same function as: x => x <= maxValue
const isRating = v.and('safe-integer', v.min(1), v.max(5))

isRating(1) // true
isRating(5) // true

isRating('2') // false
isRating(0) // false
isRating(6) // false
```

The same, but with using of `v.enum`

```javascript
// v.enum(...values) is the same function as: x => values.includes(x)
const isRating2 = v.enum(1,2,3,4,5)

isRating2(1) // true
isRating2(5) // true

isRating2('2') // false
isRating2(0) // false
isRating2(6) // false
```

_____________________________________________________________

### Validation of strings

```javascript
const stringLikeObjects = [
  '',
  '123',
  new String('123'),
  Number('string')
]

// lets find only strings
stringLikeObjects.filter(v('string')) // ['', '123']
```

Also like for numbers there is additional registered validator for strings: `'not-empty'`:

```javascript
stringLikeObjects.filter(v.and('not-empty', 'string')) // ['123']
```

There is also methods for creating string validation functions:
- v.regex(regularExpression: RegExp);
- v.min(minLength: number);
- v.max(minLength: number).

Let's use them to check password (stupid passwords only)
```javascript
const v = require('quartet')()

const isValidPassword = v.and(
  'string',                   // typeof x === 'string'
  v.min(8),                   // length >= 8
  v.max(24),                  // length <= 24
  v.regex(/^[a-zA-Z0-9]+$/),  // must contain only letters and digits
  v.regex(/[a-z]/),           // at least one small letter
  v.regex(/[A-Z]/),           // at least one big letter
  v.regex(/[0-9]/)            // at least one digit
)
console.log(isValidPassword('12345678'))         // false
console.log(isValidPassword('12345678Password')) // true
```

_____________________________________________________________

### Validation of Other Types

You can use next registered validation functions in your validation schemas to check type.

|      name      |                   condition                    |
| :------------: | :--------------------------------------------: |
| 'boolean'      |        `x => typeof x === 'boolean'`           |
|     'null'     |               `x => x === null`                |
|  'undefined'   |             `x => x === undefined`             |
|     'nil'      |      `x => x === null || x === undefined`      |
|    'object'    |          `x => typeof x === 'object'`          |
|   'object!'    |   `x => typeof x === 'object' && x !== null`   |
|    'array'     |            `x => Array.isArray(x)`             |
|    'symbol'    |          `x => typeof x === 'symbol'`          |
|   'function'   |         `x => typeof x === 'function'`         |

_____________________________________________________________

## Alternatives

Sometimes there is need to validate data that can be different types.

You can use schema of alternatives to get such behavior:

```javascript
// It is works exactly as OR operator in JS,
// if some of alternatives - true, it will return true immediately
v(['number', 'string'])(1) // true
v(['number', 'string'])('1') // true

v(['number', 'string'])(null) // false
v(['number', 'string'])(new String(123)) // false

v(['number', 'string', 'object'])(null) // true
v(['number', 'string', 'object'])(new String(123)) // true
```

_____________________________________________________________

## Custom validation rules

As it was said before: validation function is one of
valid schemas. If you want to add your own rule - you just need to use your validation function as a schema.

```javascript
const isPrime = n => {
  if (n < 2) return false
  if (n === 2 || n === 3) return true
  if (n % 2 === 0 || n % 3 === 0) return false
  for (let i = 5, j = 7; i * i <= n; i+=6, j+=6) {
    if (n % i === 0) return false
    if (n % j === 0) return false
  }
  return true
}
const isPrimeAndNotLessThan100 = v.and(
  'safe-integer',
  v.min(100),
  isPrime // validation function
)
isPrimeAndNotLessThan100(512) // false, 512 is NOT a prime number
isPrimeAndNotLessThan100(523) // true, 523 > 100, 523 is a prime number
```

_____________________________________________________________

## Deep validation

> Deep validation means validation of not primitive data structures.
> Data structure can be accepted only if it has right type and all parts of it are valid.

The most popular data structures is object and array.

_____________________________________________________________

### Deep Validation of Object

For validation of object `quartet` uses object schema.

> **Object schema** is an object of a such structure
>  ```javascript
>  {
>   key1: schema1,
>   key2: schema2,
>   // ...
>   // And if you need to validate other properties of object
>   // You can use v.rest(schema) method (it returns an object that must be spreaded into object schema)
>  ...v.rest(schemaAppliedToOtherValues)
> }
> ```

 _Example:_

 ```javascript
// `v` treats object as an object
const isWorkerValid = v({
  name: v.and('not-empty', 'string'),
  age: v.and('positive', 'safe-integer)',
  position: v.enum(
    'Frontend Developer',
    'Backend Developer',
    'QA',
    'Project manager',
    'Grandpa'
  ),
  salary: v.and('positive', 'finite'),
  project: v.enum(
    'Shoutout',
    'FMEvents',
    'Jobla.co'
  ),
  // Any field can be object too
  skills: {
    JS: 'boolean',
    HTML: 'boolean',
    CSS: 'boolean',
    ...v.rest('boolean') // other keys must be boolean too
  }
})
```

Let's validate some object with using of this validation function

```javascript
const worker = {
  name: 'Max',
  age: 31,
  position: 'Grandpa',
  salary: Math.random() * 3000,
  project: 'Jobla.co',
  skills: {
    JS: true,
    HTML: true,
    CSS: true,
    'C++ advanced': false,
    'GPU programming': false
  }
}
isWorkerValid(worker) // true
```

There is additional methods for **dictionary object** validation:
- `v.dictionaryOf(schema)` - checks values of object;
- `v.keys(schema)` - checks keys of object;
- `v.rest(schema)` - if other properties will be present - they will be validated with using of the schema.

_Example: Validation of dictionary object_

```javascript

const lowLettersDict = {
  A: 'a',
  B: 'b',
  C: 'c'
}
const isValidLettersDict = v.and(
  v.keys(v.regex(/^[A-Z]$/)),
  v.dictionaryOf(v.regex(/^[a-z]$/))
)
console.log(isValidLettersDict(lowLettersDict))
```

Let's check if keys correspond values with using of
custom validation function

```javascript
// second parameter of all validation function is
// {
//   key: string|number,
//   parent: any
// }
// (if the parent is present)
function isValueValid (value, { key }) {
  return /^[A-Z]$/.test(key)        // upperCased key
    && /^[a-z]$/.test(value)        // lowerCased value
    && value === key.toLowerCase()  // correspond each other
}

const isValidLettersDict2 = v.dictionaryOf(isValueValid)

console.log(isValidLettersDict2(lowLettersDict)) // true
console.log(isValidLettersDict2({ A: 'b' })) // false, NOT CORRESPONDS
console.log(isValidLettersDict2({ b: 'b' })) // false, b is not UpperCased
console.log(isValidLettersDict2({ B: 'B' })) // false, B is not LowerCased
```
_____________________________________________________________

### Deep Validation of Array

For deep validation of array we can use `v.arrayOf(schema)` method.

```javascript
const arr = [1,2,3,4]
const invalidArrOfNumbers = [1,2,'3','4']

const isArrayValid = v.arrayOf('number')

isArrayValid(arr) // true
isArrayValid(invalidArrOfNumbers) // false
```

Also, we can combine array validation schema with object schemas

```javascript
const isValidPointArray = v.arrayOf({
  x: 'finite',
  y: 'finite'
})
isValidPointArray([
  { x: 1, y: 2},
  { x: -1, y: 3},
  { x: 0, y: 0},
]) // true
```

And another way: object with array property:

```javascript
const student = {
  name: 'Valera',
  grades: ['A', 'B', 'C','A', 'D', 'F']
}
const isStudentValid = v({
  name: 'string',
  grades: v.arrayOf(v.enum('A', 'B', 'C', 'D', 'E', 'F'))
})

isStudentValid(student) // true
```
_____________________________________________________________

## Fixing of invalid data:

What if some validation errors we can fix. For example, we can replace invalid data with empty valid data. Also, sometimes we can omit invalid data. Or in rare keys - we should try to transform invalid data to valid.

In `quartet` there are methods for such task. Main method is
- `v.fix(invalidValue) => validValue`

This method is used for applying all fixes that were collected during the validation. It doesn't change `invalidValue` but returns new value with applied fixes.

Methods `v.default(schema, defaultValue)`, `v.filter(schema)` and `v.addFix(schema, fixFunction)` are decorators of validators. It means that they return new validation function that works exactly as passed schema, but with side effect of collecting of fixes.

| Decorator   | Fix effect, after calling `v.fix` |
|:-----------:|:---------------------------------:|
| `v.default` | Replace value with defaultValue   |
| `v.filter`  | Removes value from parent         |
| `v.addFix`  | Custom fixFunction mutates parents<br>of the value to fix an error |


_Example:_

Let's create several validation functions with different effects.

```javascript
const arr = [1,2,3,4,'5','6','7']

// Replaces all not numbers with 0
const isArrayValid = v.arrayOf(
  v.default('number', 0)
)

// Removes all not numbers from parent(array)
const isArrayValidFilter = v.arrayOf(
  v.filter('number')
)

// This function will be called on value in the clone of invalid data
// So this mutations - are safe.
function castToNumber(invalidValue, { key, parent }) {
  parent[key] = Number(invalidValue)
}

// casts all not numbers into numbers
const isArrayValidFix = v.arrayOf(
  v.addFix('number', castToNumber)
)
```

Let's use them to validate `arr`:

```javascript
v.clearContext() // remove all fixes stored in `v`
isArrayValid(arr) // false
const validArr = v.fix(arr)
console.log(validArr) // [1,2,3,4,0,0,0]

v.clearContext() // remove previous fixes
isArrayValidFilter(arr) // false
const validArr2 = v.fix(arr) // [1,2,3,4]

v() // same as v.clearContext()
isArrayValidFix(arr) // false
const validArr3 = v.fix(arr) // [1,2,3,4,5,6,7]

// arr is not mutated
console.log(arr) // [1,2,3,4,'5','6','7']
```

> **NOTE:** if there is "fix effect" on parent "fix effect" of children will not be applied(if fix effect on parent is not "filter effect").
>
> It means we should use such rule: if there is a "fix effect", it must fix all invalidation of the value it must fix.
_Example:_

```javascript
const isObjectValid = v({
  arr: v.default( // will be applied
    v.arrayOf(
      v.filter('number') // will not be applied
    ),
    [] // if there will be any not number - all array will be replaced with []
  )
})
const invalidObj = {
  arr: [1,2,3,'4']
}
v()
isObjectValid(invalidObj)
const validObj = v.fix(invalidObj) // { arr: [] }
```

> Also there is `v.hasFixes` method: it returns `true` - if some fixes were collected, and ready to be applied. Returns `false` otherwise.

_____________________________________________________________

## Tracking

Sometimes we need not only to check if a value is not valid, 
But to get an explanation, and possibly to send this explanation to
the user, or to the logger etc.

In `quartet` we use explanations for it.

> **Explanation** - any JS value(except undefined) you want that describes invalidation error.

We use the second parameter of `v` to add the effect of storing explanation, it can be either:
- explanation;
- a function that returns explanation.

We use them to collect error messages and errors into `v.explanation` array.

_____________________________________________________________

### Messages

Sometimes we need only data to show to the user. And string explanation of the error is very useful.

_Example:_
```javascript
const isValidPerson = v.and(
  v('object!', 'Person data structure is not an object'),
  {
    name: v.and(
      // required, checks if parent has such property
      v('required', 'name field is absent'), 
      v('string', 'Person name is not a string'),
      v('not-empty', 'Person with empty name, really?')
    ),
    age: v.and(
      v('required', 'age field is absent'),
      v('safe-integer', 'Person age is not an integer number'),
      v(v.min(18), 'Person has is not an appropriate age'),
      v(v.max(140), `It was just a healthy food`)
    )
  }
)
```

Let's use this schema to validate several persons

```javascript
v.clearContext() // or v()
isValidPerson(null) // false
console.log(v.explanation) // ['Person data structure is not an object']

v.clearContext()
isValidPerson({}) // false
console.log(v.explanation)
/*
* [
* 'Name field is absent',
* 'age field is absent'
* ]
*/
v() // same as v.clearContext()
isValidPerson({ name: '', age: 969 })
console.log(v.explanation)
/**
* [
*   'Person with empty name, really?',
*   'It was just a healthy food'
* ]
*/
```

We can calculate explanation based on the invalidValue and it's parents.

_Example:_

```javascript
const isValidPerson = v.and(
  v('object!', 'Person data structure is not an object'),
  {
    name: v.and(
      v('required', 'name field is absent'),
      v('string', 'Person name is not a string'),
      v('not-empty', 'Person with empty name, really?')
    ),
    age: v.and(
      v('required', 'age field is absent'),
      v('safe-integer', 'Person age is not an integer number'),
      v(v.min(18), age => `Your age: ${age} is to small`),
      v(v.max(140), age => `Your age: ${age} is to big`)
    )
  }
)

v() // same as v.clearContext()
isValidPerson({ name: '', age: 969 })
console.log(v.explanation)
/**
* [
*   'Person with empty name, really?',
*   'Your age: 969 is to big'
* ]
*/
```

_____________________________________________________________

### Errors

The same way we use strings we can use objects as an explanation.



```javascript
// Util for calculating code errors.
// If you want you can create your own type of errors.
const invalidValueToError = code => invalidValue => ({
  invalidValue,
  code
})
```

It will be useful to add some error codes.
We can use them to get messages sent to the user and other.

```javascript
// Error Codes
const CODE = {
  PERSON_IS_NOT_AN_OBJECT: 'PERSON_IS_NOT_AN_OBJECT',
  NAME_ABSENT: 'NAME_ABSENT',
  NAME_IS_NOT_STRING: 'NAME_IS_NOT_STRING',
  NAME_IS_EMPTY: 'NAME_IS_EMPTY',
  AGE_ABSENT: 'AGE_ABSENT',
  AGE_NOT_INTEGER: 'AGE_NOT_INTEGER',
  AGE_TO_SMALL: 'AGE_TO_SMALL',
  AGE_TO_BIG: 'AGE_TO_BIG'
}
```

Schema with added using of the `invalidValueToError` function that returns function that calculates error explanation.

```javascript
const isValidPerson = v.and(
  v('object!', invalidValueToError(CODE.PERSON_IS_NOT_AN_OBJECT)),
  {
    name: v.and(
      v('required',  invalidValueToError(CODE.NAME_ABSENT)),
      v('string',    invalidValueToError(CODE.NAME_IS_NOT_STRING)),
      v('not-empty', invalidValueToError(CODE.NAME_IS_EMPTY))
    ),
    age: v.and(
      v('required',     invalidValueToError(CODE.AGE_ABSENT)),
      v('safe-integer', invalidValueToError(CODE.AGE_NOT_INTEGER)),
      v(v.min(18),      invalidValueToError(CODE.AGE_TO_SMALL)),
      v(v.max(140),     invalidValueToError(CODE.AGE_TO_BIG))
    )
  }
)
```

Let's check some values and see what is stored in explanation

_Not an object_

```javascript
v()
isValidPerson(null)
console.log(v.explanation)
//[
//  {
//   invalidValue: null,
//   code: 'PERSON_IS_NOT_AN_OBJECT'
//  }
//]
```

_required fields explanation_

```javascript
v()
isValidPerson({})
console.log(v.explanation)
//[
//  {
//   invalidValue: undefined,
//   code: 'NAME_ABSENT'
//  },
//  {
//   invalidValue: undefined,
//   code: 'NAME_ABSENT'
//  }
//]
```

_not valid values_

```javascript
v()
isValidPerson({ age: 963, name: '' })
console.log(v.explanation)
//[
//  {
//   invalidValue: '',
//   code: 'NAME_IS_EMPTY'
//  },
//  {
//   invalidValue: 963,
//   code: 'AGE_TO_BIG'
//  }
//]
```

_____________________________________________________________

## All Together

Rarely, but it's possible to use explanations and fixes at one time.
For such goals, there is `v.fromConfig` method. That takes the config of the validation and returns validation function that has all set properties.

_Example:_

This is still the same
```javascript
const invalidValueToError = code => invalidValue => ({
  invalidValue,
  code
})

// Error Codes
const CODE = {
  PERSON_IS_NOT_AN_OBJECT: 'PERSON_IS_NOT_AN_OBJECT',
  NAME_ABSENT: 'NAME_ABSENT',
  NAME_IS_NOT_STRING: 'NAME_IS_NOT_STRING',
  NAME_IS_EMPTY: 'NAME_IS_EMPTY',
  AGE_NOT_VALID: 'AGE_NOT_VALID'
}
```
Add using of `v.fromConfig`
```javascript
const isValidPerson = v.and(
  v.fromConfig({
    validator: 'object!',
    // explanation if not object
    explanation: invalidValueToError(CODE.PERSON_IS_NOT_AN_OBJECT), 
    // If not valid store default fix (calculate default value)
    default: () => ({ name: 'unknown' })
  }),
  {
    // if several configs are passed, validations will be combined with `v.and`
    name: v.fromConfig(
      { 
        validator: 'required',
        default: 'a',
        explanation: invalidValueToError(CODE.NAME_ABSENT)
      },
      {
        validator: 'string',
        default: 'b',
        explanation: invalidValueToError(CODE.NAME_IS_NOT_STRING)
      },
      {
        validator: 'not-empty',
        default: 'c',
        explanation: invalidValueToError(CODE.NAME_IS_EMPTY)
      }
    ),
    age: v.fromConfig(
      { 
        validator: 'safe-integer',
        filter: true,
        explanation: invalidValueToError(CODE.AGE_NOT_VALID)
      },
      {
        validator: v.min(18),
        default: 18,
        explanation: invalidValueToError(CODE.AGE_NOT_VALID)
      },
      {
        validator: v.max(140),
        default: 90,
        explanation: invalidValueToError(CODE.AGE_NOT_VALID)
      }
    )
  }
)
```

_null object_

```javascript
v()
const value = null
const test1 = isValidPerson(value)
const explanation = v.explanation
const fixedValue = v.fix(value)

console.log({
  value,        // null
  test1,        // false
  explanation,  // [{ invalidValue: null, code: 'PERSON_IS_NOT_AN_OBJECT' }]
  fixedValue    // { name: 'unknown' }
})
```

_empty object_

```javascript
v()
const value2 = {}
const test2 = isValidPerson({})
const explanation2 = v.explanation
const fixedValue2 = v.fix(value2)

console.log({
  value2,  // {}
  test2,   // false

  // [
  //  { invalidValue: undefined, code: 'NAME_ABSENT' },
  //  { invalidValue: undefined, code: 'AGE_NOT_VALID' }
  // ]
  explanation2, 
  fixedValue2   // { name: 'a' }
})
```

_wrong types_

```javascript
v()
const value3 = { age: '963', name: 1 }
const test3 = isValidPerson(value3)
const explanation3 = v.explanation
const fixedValue3 = v.fix(value3)

console.log({
  value3, // { age: '963', name: 1 }
  test3,  // false

  //[
  //  { invalidValue: 1,     code: 'NAME_IS_NOT_STRING' },
  //  { invalidValue: '963', code: 'AGE_NOT_VALID' }
  //]
  explanation3,
  fixedValue3    // { name: 'b' }
})
```

_right type, wrong values_

```javascript
v()
const value4 = { age: 963, name: '' }
const test4 = isValidPerson(value4)
const explanation4 = v.explanation
const fixedValue4 = v.fix(value4)

console.log({
  value4,       // { age: 963, name: '' }
  test4,        // false

  //[
  // { invalidValue: 1,     code: 'NAME_IS_NOT_STRING' },
  // { invalidValue: '963', code: 'AGE_NOT_VALID' }
  //]
  explanation4,
  fixedValue4   // 
})
```

_Valid data_

```javascript
v()
const value5 = { age: 21, name: 'Maksym' }
const test5 = isValidPerson(value5)
const explanation5 = v.explanation
const fixedValue5 = v.fix(value5)

console.log({
  value4,       // { age: 21, name: 'Maksym' }
  test4,        // true
  explanation4, // []
  fixedValue4   // { age: 21, name: 'Maksym' }
})
```

_____________________________________________________________

## Clear code

> Clear code is code that you can easily understand and modify

_____________________________________________________________

### Readable

There are some features that make the code more readable: 

- object validation schema is the object with the same structure
  as an object that must be validated
- text aliases for validation functions

_____________________________________________________________

### Modifiable

There are some features that make the code more modifiable:
- Easy to read sometimes means easy to modify.
- methods names and structure - makes it easier to find the place of change
- custom validation functions - allows you to make any kind of validation

_____________________________________________________________

## Additional Possibilities

There is also several additional possibilities:

| Method                           | Description                        |
|:--------------------------------:|:----------------------------------:|
| `v.example(schema, ...examples)` | If examples are not valid, it will throw Error.<br> It can be used as documentation and testing of the shema.<br>Returns validation function, if examples are valid |
| `v.validOr(schema, defaultValue)`| Returns function that takes `value`<br> and replace it by `defaultValue` if the `value` is not value |
| `v.omitInvalidProps(objectSchema)` | Returns function that takes `value`. If value is not an object - returns unchanged.<br>If `value` is object - it tests all props that present in `objectSchema` and removes all props that is invalid |
| `v.throwError(schema, errorMessage)` | returns function that takes `value`.<br> Returns `value` if it's valid. Throws error otherwise. <br>Can be used in pipe of functions. |

_____________________________________________________________

## API Docs

All methods and possibilities described [here](https://github.com/whiteand/quartet/blob/master/API.md)

_____________________________________________________________

## Other Solutions

There is plenty of good validation libraries, among them `ajv`, `joi`, `yup`, `type-contract`. They are beautiful and strong. You should use them if you found that this solution - is not for you.

_____________________________________________________________

## Contacts
<table>
  <tr>
    <td>Author</td>
    <td>Andrew Beletskiy</td>
  </tr>
  <tr>
    <td>Position</td>
    <td>Frontend Developer, Adraba</td>
  </tr>
  <tr>
    <td>Email</td>
    <td>AndrewBeletskiy@gmail.com</td>
  </tr>
  <tr>
    <td>Github</td>
    <td><a href="https://github.com/whiteand">https://github.com/whiteand</a></td>
  </tr>
</table>
