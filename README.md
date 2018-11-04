# quartet
Library for validations: beautiful and convenient

# Install
```
npm install quartet
```

# Docs

**Let's install and import quartet (it will be used in all examples below)**
```javascript
const v = require('quartet')
```

**Types of validations**

There four types of validations:
- validation predicates (function that returns boolean value)
- object validations (predicates for keys and values in object)
- known to everybody (registered)
- Combinated validation (all previous types in different combinations
  using `and` and/or `or` logic  operations)

 **Validation predicates**
 
 It's maybe the simplest type of validations. So go to examples:
 If we want to validate even number we can just write:
 ```javascript
 const isEven = x => x % 2 === 0
 const isTwoEven = isEven(2)
 ```
 This is very simple. Let's use `quartet` to rewrite it.
 ```javascript
 const isEven = v(x => x % 2 === 0)
 const isTwoEven = isEven(2)
 // or
 const isTwoEven = v(x => x % 2 === 0)(2)
 ```
 As you see `quartet` can take predicate function as a parameter. The first argument of the function - is the value to be validate. (There are other arguments, but this is different story)
 It seems to be - not necessary to use `quartet` for such examples. So we should go deeper to see full beauty of validation!
 
 **Object validation**
 
 There is something in objects - they are complex, they consists of many different parts. All parts should be validated separately and sometimes all together.
 
 **Let's write some examples:**
 
 **Simple**
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
 const isNumber = n => typeof n === 'number'
 const isObjectValidConfig = {
   theNumber: isNumber,
   theString: s => typeof s === 'string',
   theArray: arr => Array.isArray(arr) && arr.every(isNumber),
   theNull: value => value === null,
   theUndefined: (value, { key, parent }) =>
     parent.hasOwnProperty(key) && value === undefined,
   theObject: {
     innerProp: isNumber
   }
 }
 const isObjectValid = v(isObjectValidConfig)
 const isValid = isObjectValid(obj)
 ```
 As you can see `quartet` also can takes an object as a config. All values passed to resulting validation function must be an object. All properties - must be validated using validation predicates.
 
 But there is some new in this example. Let's look at validation for `theUndefined` property: 
 ```javascript
 theUndefined: (value, { key, parent }) =>
     parent.hasOwnProperty(key) && value === undefined
```
Predicate takes not only the value to be validated. It takes all parents in hierarchy of the object. It can be used for such checking of required field.
Also you can use values of other properties contained in the parent.

You can do any validation you want using all parents of the value, because has such specifiation:
```javascript
function predicate(
  valueToValidate,
  {key: keyInParent, parent: valueOfParent},
  {key: keyInParent2, parent: valueOfParent2},
  ...
): Boolean
```
Also as you can see: inner values of config - are not only simple predicates. But they can be any valid config for `quartet`. You can see how do we use object config for checking `theObject` property.

(You can see that code is still not so beautiful as we want. What do we want? Go deeper to see it!)


**Registered validations**

As you can see there are a lot of simple small validators like `isNumber` or `isArray`. It will be better to write them once and use everywhere, won't it?
Let's use `quartet` for it:
```javascript
v.register('number', x => typeof x === 'number')
v.register('array', x => Array.isArray(x))
v.register('string', x => typeof x === 'string')
v.register('object', x => typeof x === 'object')
v.register('undefined', x => x === undefined)
v.register('null', x => x === null),
v.register('required', (_, { key, parent }) => parent.hasOwnProperty(key))

const isObjectValidConfig = {
    theNumber: 'number',
    theString: 'string',
    theArray: arr =>
        v('array')(arr) && arr.every(v('number')),
    theNull: 'null',
    theUndefined: (x, parent) => v('required')(x, parent) && v('undefined')(x),
    theObject: {
        innerProp: 'number'
    }
}
const isValid = v(isObjectValidConfig)(obj)
```
This is interesting and useful solution, but this is much complicted that it was before, but we can do better! Go deeper!

**Combinated validations**

This complexity is bad. It's scary thing that people hate.

Complexity can be defeated by _composition_.

We use combinators for creating composition:
It uses such syntax:
```javascript
[
    orConfig,
    orConfig2,
    orConfig3,
    [ // orConfig 4
        andConfig,
        andConfig2,
        [// andConfig 3
            orConfig,
            orConfig2,
            ...
        ],
        ...
    ],
    ...
]
```
So you can see that first level of nestedness is - OR operator. Second level - AND operator. Third - is OR operator and so on.

Let's try to create example of complexity, and destroy it with using registered validators and combinators.

```javascript
const v = require('quartet')

const obj = {
    theNumberOrString: '2',
    theString: '2',
    theArrayOfNumbers: [3],
    theNull: null,
    theRequiredUndefinedOrNumber: undefined,
    theObject: {
        innerProp: 100
    }
}


v.register('number', x => typeof x === 'number')
v.register('array', x => Array.isArray(x))
v.register('string', x => typeof x === 'string')
v.register('object', x => typeof x === 'object')
v.register('undefined', x => x === undefined)
v.register('null', x => x === null),
v.register('required', (_, { key, parent }) => parent.hasOwnProperty(key))

const isObjectValidConfig = {
    theNumberOrString: ['number', 'string'],
    // all elements of array will be treated as possible variants (OR)
    theString: 'string',
    theArrayOfNumbers: v.arrayOf('number'),
    theNull: 'null',
    theRequiredUndefinedOrNumber: [['required', ['undefined', 'number']]],
    // but if the element of array is array itself - all elements of it will be treated as required validations (AND)
    theObject: {
        innerProp: 'number'
    }
}
v(isObjectValidConfig)(obj)
```

**Useful methods**

You see how do we use `v.arrayOf` in example above. You can use it too! It takes `quartet` config and returns validation function that will be used as validator of array.

Also there is `v.required` method: takes properties to be required and returns function that validates object.
```javascript
v.required('a', 'b')({a: 1}) // => false
v.required('a', 'b')({a: 1, b: 2}) // => true
```

If you want to use your own registered validators you can overwrite default validators. Also you can created `quartet` instance without registered validators using `v.newContext` method.
```javascript
v('number')(2) // true
const newV = v.newContext({})
newV('number')(2) // => TypeError: Reference to not registered config: number
```

**Default registered validators**

There is such registered validators by default:

|      name      |                   condition                  |
|:--------------:|:--------------------------------------------:|
|    'string'    |            `typeof x === 'string'`           |
|     'null'     |               `x => x === null`              |
|   'undefined'  |            `x => x === undefined`            |
|      'nil'     |     `x => x !== null && x !== undefined`     |
|    'number'    |         `x => typeof x === 'number'`         |
|  'safeInteger' |        `x => Number.isSafeInteger(x)`        |
|    'finite'    |           `x => Number.isFinite(x)`          |
|   'positive'   |                 `x => x > 0`                 |
|   'negative'   |                 `x => x < 0`                 |
| 'non-negative' |                 `x => x >= 0`                |
| 'non-positive' |                 `x => x <= 0`                |
|      'log'     | returns `true` and logs value and parents    |
|   'required'   | returns `true` - if parent has such property |
|    'object!'   |  `x => typeof x === 'object' && x !== null`  |
|    'object'    |          `x => typeof x === 'object'`        |
|     'array'    |           `x => Array.isArray(x)`            |
|   'not-empty': | return `true` if value if not empty (see code)|
 
 So you can see that we shouldn't register own validators - if they are present by default. So example above can be rewritten without registering any of validators.
 
