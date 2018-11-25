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
- [API](#api)
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
v.clearContext() // or just v()
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
  email: ['wrong email', 'andrewbeletskiy@gmail.com', 'wrong email']
}
v.clearContext()
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
v.clearContext()
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
| 'boolean'      |        `x => typeof x === 'boolean'`           |
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

# API

## Types

```typescript
type KeyParent = {
  key: number | string;
  parent: object | any[];
}

type FromParams<T> = (value: any, ...keyParents: KeyParent[]) => T;
type Validator = (value: any, ...keyParents: KeyParent[]) => boolean;

interface ObjectSchema {
  [property: string]: Schema;
}
interface AlternativeSchema extends Array<Schema> {
}
type Schema = string | AlternativeSchema | ObjectSchema | Validator;

type Explanation = any | FromParams<any>;

type SchemaDict = { [name: string]: Schema }

interface CompilerSettings {
  registered: SchemaDict,
  allErrors: boolean
}
```

## Props

### `v.explanation: any[]`

Contains explanation pushed during validation process.

### `v.registered: SchemaDict`

Returns dictionary of all registered validators

### `v.allErrors: boolean`

Returns `true`, if validation process will be finished after first invalidation error.

Retruns `false` otherwise.

## Methods

### `v.addFix: (schema: Schema, fixFunction: FromParams<void>) => Validator`

Takes validator and returns new validator with side effect: if value is invalid - it will be replaced with using `v.fix` by default value.

```javascript
 const arr = [1,2,'3',4,5]
 v.clearContext()
 const toNumber = (v, { key, parent }) => { // changes value to number
   parent[key] = Number(v) // we need to change by parent reference in order to mutate fix result
 }
 v(v.arrayOf(v.addFix('number', toNumber))(obj) // => false
 console.log(v.hasFixes()) // => true
 console.log(v.fix(obj)) // => [1,2,3,4,5]
```

### `v.and: (...schemas: Schema[]) => Validator`

Returns validator that returns `true` only if validated value corresponds to **ALL** `schemas`.

### `v.arrayOf: (elementSchema: Schema) => Validator`

Takes schema of an element of the array, and returns validator of array value. That return `true` only if value is array and **ALL** elements correspond to `elementSchema`

```javascript
v.arrayOf('number')(null) // => false
v.arrayOf('number')([1,2,3,3,4,5]) // => true
v.arrayOf('number')([1,'2',3,'3',4,5]) // => false

v.arrayOf(isPrime)([1,2,3,4,5,6,7]) // => false
v.arrayOf(isPrime)([2,3,5,7]) // => true
```

### `v.default: (schema: Schema, defaultValue: any|FromParams<any>) => Validator`

Returns new validator that returns `true` if value correspond to schema, and `false` otherwise. But it adds a sideffect of storing the place of the invalid data and `defaultValue`(just a value or calculated based on invalid data). After calling `v.fix` invalidData in the stored placed will be replaced with `defaultValue`(or `defaultValue(value, ...parents)` if `defaultValue` is a function)

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
 v.clearContext()({
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

### `v.dictionaryOf: (elementSchema: Schema) => Validator`

returns true if all values stored in `dict` correspond to `elementSchema`.

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

### `v.enum: (...values: any) => Validator`

Returns validator, that returns `true` only if validated value is one of `values`.

```javascript
v.enum(1,2,'3')(1)   // true
v.enum(1,2,'3')(2)   // true
v.enum(1,2,'3')('3') // true
v.enum(1,2,'3')(3)   // false
```

### `v.example: (schema: Schema, ...validExamples: any[]) => Validator`

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

### `v.explain: (schema: Schema, explanation: Explanation) => Validator`

Returns validator with side-effect of changing `v.explanation`. If validation failed, `explanation` or `explanation(value, ...)` will be pushed into `v.explanation` array. 

```javascript
v.clearContext()
const isValid = v.explain("number", value => value);
isValid(1) // => true
v.explanation // => []
isValid(null)
v.explanation // => [NULL]
isValid(2)
v.explanation // => [NULL]
v.clearContext()
v.explanation // => []
```

This method is not so convenient because compiler instance(`v`) takes second parameter of explanation and returns `v.explain(schema, explanation)` if explanation is not undefined.

### `v.filter: (schema: Schema) => Validator`

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
 v.clearContext()({
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

### `v.fix: (value: any) => any`

It gets all fixes stored by fix methods(`default`, `filter`, `addFix`) and applies it on `value`. Returns new value with all fixes applied. It's pure function.

```javascript
const obj = { a: 'not a number' }

v() // same as v.clearContext()

v({
  a: v.default('number', 0)
})(obj)

v.fix(obj) // returns { a: 0 }
```


### `v.fromConfig: (config: Config) => Validator`

```javascript
@typedef Config {{
  validator: Schema, 
  explanation?: any|function(): any // not required
  examples?: []any,
  // one of the next fix params
  default: any,
  filter: any,
  fix: function(invalidValue, { key, parent}, ...): void // mutate parent to fix error
}}
```

`fromConfig` is used to set validator, examples, explanation and fix at one config.

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

### `v.hasFixes: () => boolean`

Returns `true` if some fixes was stored by fix methods(`filter`, `default`, `addFix`).

```javascript
const isValid = v({
  a: v.default('number', 0)
})

const validObj = { a: 123 }
const obj = { a: 'not a number' }

v() // same as v.clearContext()
isValid(validObj) // => true
v.hasFixes() // => false

v() 
isValid(obj)
v.hasFixes() // => true
v.fix(obj) // returns { a: 0 }
```

### `v.keys: (keySchema: Schema) => Validator`

returns `true` if all **keys** used in `dict` correspond to `keySchema`

```javascript
const isAbcDict = v.keys(v.enum('a', 'b', 'c'))
isNumberDict({a: 1, b: 2, c: 3}) // => true
isNumberDict({a: 1, b: 2, c: '3'}) // => true
isNumberDict({a: 1, b: 2, c: '3', d: '4'}) // => false
```

### `v.max: (maxValue: number) => Validator`

If value is array, returns true only if

`value.length <= maxValue`

If value is string, returns true only if

`value.length <= maxValue`

If value is number, returns true only if

`value <= maxValue`

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

### `v.min: (minValue: number) => Validator`

If value is array, returns true only if

`value.length >= minValue`

If value is string, returns true only if

`value.length >= minValue`

If value is number, returns true only if

`value >= minValue`

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

### `v.newCompiler: (settings?: CompilerSettings) => Compiler`

Returns new instance of validator compiler with custom aliases

```javascript
const v2 = v.newCompiler({
  registered: {
    number2: v => Number.isSafeInteger(v)
  },
  allErrors: true
})
v2('number')(1) // throws error
v2('number2')(1) // => true
```

### `v.not: (schema: Schema) => Validator`

Returns validator, that returns `true` only if value **DOESN'T** correspond to schema.

### `v.omitInvalidItems: (itemSchema: Schema) => (collection: any) => any`

Takes schema and returns collection transformator, that removes all items that **do not** correspond to `schema`.

If collection is not an **array** or an **object-dictionary** it returns value without changes.

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

### `v.omitInvalidProps: (objSchema: ObjectSchema|string, settings?: { omitUnchecked: boolean }) => (object: any) => any`

Removes invalid properties. If `omitUnchecked` is falsy value, function will keep unchecked properties of object.

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
### `v.parent: (parentSchema: Schema) => Validator`

Returns validator, that returns `true` only if parent of the validated value correspond to `schema`.

```javascript
const funcPair = { x: 3, xSquared: 9 }
v({
  x: 'number',
  xSqured: v.parent(parent => parent.x ** 2 === parent.xSquared) // Check if 
})(funcPair) // => true
```

### `v.regex: (regex: RegExp) => Validator`

Returns validator, that returns `regex.test(validatedValue)`

```javascript
v(/abc/)('abcd') // => true
v(/abc/)('  abcd') // => true
v(/^abc/)('  abcd') // => false
```

### `v.register: (schemasToBeRegistered: SchemaDict) => Compiler`

Returns new Compiler with added registered validators.

```javascript
const v2 = v.register({ numberOrString: ['number', 'string']})

v2('numberOrString')(123) // => true
v2('numberOrString')('123') // => true
```

### `v.required: (...props: string[]) => Validator`

Takes required properties, and returns Validator that returns `true` only if all properties from `props` are present in the validated object. (Using `Object.prototype.hasOwnProperty`)

```javascript
v.required('a','b')({}) // => false
v.required('a','b')({ a: 1 }) // => false
v.required('a','b')({ b: 2}) // => false
v.required('a','b')({ a: 1, b: 2}) // => true
```

### `v.requiredIf: (isRequired: boolean|Schema) => Validator`

Returns `true` if value is not requried, returns `true`. If value required, returns parent.hasOwnProperty(valueProp).

Value treated as required if `isRequired === true`, or `value` correspond to `isRequired` schema.

```javascript
const obj = { hasA: true, a: 'present' }
const isObjValid = v({
  hasA: 'boolean',
  a: v.requiredIf(v.parent(p => p.hasA))
})
isObjValid(obj) // => true
isObjValid({ hasA: true }) // => false
isObjValid({ hasA: false }) // => true
```

### `v.rest: (restPropsSchema: Schema) => ObjectSchema`

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

### `v.throwError: (schema: Schema, errorMessage: string|FromParams<string>) => (value: any) => any`

Returns transformation function, that returns `value` if it correspond to `schema`. Throws error with message `errorMessage`(or `errorMessage(invalidValue, ...parents)`). Can be used in pipes of functions.

```javascript
const userId = 
v.throwError('number', 'userId must be a number')('123') // => throws new Error
v.throwError('number', 'userId must be a number')(123) // => 123
```

### `v.validOr: (schema: Schema, defaultValue: any) => (value: any) => any`

Returns transformation function that returns `value` if it correspond to schema. Returns `defaultValue` otherwise.

### `v.withoutAdditionalProps: (schema: ObjectSchema|string) => Validator`

Returns true only if passed value is object and has valid props and has not any additional properties.

```javascript
  const onlyANumber = v.withoutAdditionalProps({ a: 'number' })
  onlyANumber(null) // => false
  onlyANumber(1) // => false
  onlyANumber({ a: 1 }) // => true
  onlyANumber({ a: '1' }) // => false
  onlyANumber({ a: 1, b: 2 }) // => false
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
