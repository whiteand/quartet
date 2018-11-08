global.console.log = jest.fn();
expect.extend({
  toBeTrueValueOf(received, isValid, validatorName) {
    const pass = isValid(received) === true;
    const message = () =>
      `expected ${validatorName}(${JSON.stringify(received)}) to be true`;
    return {
      pass,
      message
    };
  },
  toBeFalseValueOf(received, isValid, validatorName) {
    const pass = isValid(received) === false;
    const message = () =>
      `expected ${validatorName}(${JSON.stringify(received)}) to be false`;
    return { pass, message };
  }
});
const v = require("./index");

const testValidator = ({
  caption,
  isValid,
  trueValues,
  falseValues,
  validatorName = "isValid"
}) => {
  test(caption, () => {
    for (const trueValue of trueValues) {
      expect(trueValue).toBeTrueValueOf(isValid, validatorName);
    }
    for (const falseValue of falseValues) {
      expect(falseValue).toBeFalseValueOf(isValid, validatorName);
    }
  });
};

// DEFAULT VALIDATORS
testValidator({
  caption: "string default validator",
  isValid: v("string"),
  trueValues: ["a string", ""],
  falseValues: [
    new String("123"),
    1,
    null,
    undefined,
    {},
    Symbol("symbol"),
    0,
    false,
    true,
    [],
    ["symbol"]
  ]
});

testValidator({
  caption: "null default validator",
  isValid: v("null"),
  trueValues: [null],
  falseValues: [
    "null",
    0,
    undefined,
    {},
    Symbol("null"),
    false,
    true,
    [],
    [null]
  ]
});

testValidator({
  caption: "undefined default validator",
  isValid: v("undefined"),
  trueValues: [undefined],
  falseValues: [
    "undefined",
    0,
    null,
    {},
    Symbol("null"),
    false,
    true,
    [],
    [undefined]
  ]
});

testValidator({
  caption: "nil default validator",
  isValid: v("nil"),
  trueValues: [undefined, null],
  falseValues: [
    "undefined",
    0,
    {},
    Symbol("null"),
    0,
    false,
    true,
    [],
    [undefined],
    [null]
  ]
});
testValidator({
  caption: "number default validator",
  isValid: v("number"),
  trueValues: [1, -1, 1.2, NaN, 1 / 0, -1 / 0],
  falseValues: [
    "undefined",
    {},
    Symbol("null"),
    false,
    true,
    [],
    [undefined],
    [null]
  ]
});

testValidator({
  caption: "safeInteger default validator",
  isValid: v("safeInteger"),
  trueValues: [1, -1],
  falseValues: [
    1.2,
    NaN,
    1 / 0,
    -1 / 0,
    "undefined",
    {},
    Symbol("null"),
    false,
    true,
    [],
    [undefined],
    [null]
  ]
});

testValidator({
  caption: "finite default validator",
  isValid: v("finite"),
  trueValues: [1, -1, 1.2],
  falseValues: [
    NaN,
    1 / 0,
    -1 / 0,
    "undefined",
    {},
    Symbol("null"),
    false,
    true,
    [],
    [undefined],
    [null]
  ]
});

testValidator({
  caption: "positive default validator",
  isValid: v("positive"),
  trueValues: [1, 0.1, 1e-8, 1 / 0],
  falseValues: [0, -1, -1e-8, -1 / 0, NaN]
});

testValidator({
  caption: "non-positive default validator",
  isValid: v("non-positive"),
  trueValues: [0, -1, -1e-8, -1 / 0],
  falseValues: [1, 0.1, 1e-8, 1 / 0, NaN]
});

testValidator({
  caption: "negative default validator",
  isValid: v("negative"),
  trueValues: [-1, -1e-8, -1 / 0],
  falseValues: [1, 0.1, 1e-8, 0, NaN]
});

testValidator({
  caption: "non-negative default validator",
  isValid: v("non-negative"),
  trueValues: [1, 0.1, 1e-8, 0],
  falseValues: [-1, -1e-8, -1 / 0, NaN]
});

testValidator({
  caption: "object default validator",
  isValid: v("object"),
  trueValues: [null, {}, { a: 1 }, [], new String("123")],
  falseValues: [1, "1", false, true, undefined, Symbol("symbol")]
});

testValidator({
  caption: "array default validator",
  isValid: v("array"),
  trueValues: [[], [1, 2, 3, 4, 5]],
  falseValues: [{ "0": 1, length: 1 }, null, undefined, "array"]
});

testValidator({
  caption: "not-empty default validator",
  isValid: v("not-empty"),
  trueValues: [
    [1, 2, 3, 4, 5],
    "a",
    1,
    new Set([1, 2, 3]),
    new Map([[1, 2]]),
    new Date()
  ],
  falseValues: ["", [], 0, null, undefined, false, new Set([]), new Map()],
  validatorName: "not-empty"
});

test("log default validator", () => {
  v("log")(1);
  expect(console.log).toBeCalledTimes(1);
  expect(console.log).toBeCalledWith({ value: 1, parents: [] });

  v({
    a: "log"
  })({
    a: 1
  });
  expect(console.log).toBeCalledTimes(2);
  expect(console.log).toBeCalledWith({
    value: 1,
    parents: [{ key: "a", parent: { a: 1 } }]
  });
});

testValidator({
  caption: "boolean default validator",
  isValid: v("boolean"),
  trueValues: [true, false],
  falseValues: [null, 0, "false", "true", undefined, [], {}],
  validatorName: "boolean"
});

testValidator({
  caption: "symbol default validator",
  isValid: v("symbol"),
  trueValues: [Symbol(), Symbol("symbol")],
  falseValues: [null, 0, true, false, "false", "true", undefined, [], {}],
  validatorName: `v("symbol")`
});
testValidator({
  caption: "function default validator",
  isValid: v("function"),
  trueValues: [() => {}, function() {}, async function() {}],
  falseValues: [null, 0, true, false, "false", "true", undefined, [], {}],
  validatorName: `v("function")`
});

testValidator({
  caption: "required default validator - not a properties",
  isValid: v("required"),
  trueValues: [
    [1, 2, 3, 4, 5],
    "a",
    1,
    new Set([1, 2, 3]),
    new Map([[1, 2]]),
    new Date(),
    2,
    3,
    5
  ],
  falseValues: [],
  validatorName: "required"
});

test("required default validator - required properties", () => {
  expect(v({ a: [["required"]] })({})).toBe(false);
  expect(v({ a: [["required"]] })({ a: undefined })).toBe(true);
  expect(v({ a: [["required"]] })({ a: 1 })).toBe(true);
});

// METHODS

test("requiredIf method: boolean argument", () => {
  // condition variant
  const aRequired = v({
    a: v.requiredIf(true)
  });
  const aNotRequired = v({
    a: v.requiredIf(false)
  });
  expect({ a: 1 }).toBeTrueValueOf(aRequired);
  expect({ a: 1 }).toBeTrueValueOf(aNotRequired);
  expect({}).toBeFalseValueOf(aRequired);
  expect({}).toBeTrueValueOf(aNotRequired);
});

testValidator({
  caption: "requiredIf method: config argument",
  isValid: v({
    hasB: "boolean",
    b: v.requiredIf((_, { parent }) => parent.hasB)
  }),
  trueValues: [{ hasB: true, b: 1 }, { hasB: false }],
  falseValues: [{ hasB: true }],
  validatorName: "bObjValidator"
});

describe("min method", () => {
  testValidator({
    caption: "number",
    isValid: v.min(5),
    trueValues: [5, 6, 1 / 0],
    falseValues: [4, 0, NaN, -1 / 0],
    validatorName: "v.min(5)"
  });
  testValidator({
    caption: "string",
    isValid: v.min(5),
    trueValues: ["12345", "123456"],
    falseValues: ["1234", ""],
    validatorName: "v.min(5)"
  });
  testValidator({
    caption: "array",
    isValid: v.min(5),
    trueValues: [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6]],
    falseValues: [[1, 2, 3, 4], []],
    validatorName: "v.min(5)"
  });
  testValidator({
    caption: "set",
    isValid: v.min(5),
    trueValues: [new Set([1, 2, 3, 4, 5]), new Set([1, 2, 3, 4, 5, 6])],
    falseValues: [
      new Set([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      new Set()
    ],
    validatorName: "v.min(5)"
  });
  testValidator({
    caption: "map",
    isValid: v.min(5),
    trueValues: [new Map([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]])],
    falseValues: [new Map(), new Map([[1, 1]])],
    validatorName: "v.min(5)"
  });
});

describe("max method", () => {
  testValidator({
    caption: "number",
    isValid: v.max(5),
    trueValues: [5, 4, -1 / 0],
    falseValues: [6, NaN, 1 / 0],
    validatorName: "v.max(5)"
  });
  testValidator({
    caption: "string",
    isValid: v.max(5),
    trueValues: ["12345", "1234", ""],
    falseValues: ["123456"],
    validatorName: "v.max(5)"
  });
  testValidator({
    caption: "array",
    isValid: v.max(5),
    trueValues: [[1, 2, 3, 4, 5], [1, 2, 3, 4], []],
    falseValues: [[1, 2, 3, 4, 5, 6]],
    validatorName: "v.max(5)"
  });
  testValidator({
    caption: "set",
    isValid: v.max(5),
    trueValues: [
      new Set([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
      new Set(),
      new Set([1, 2, 3, 4, 5])
    ],
    falseValues: [new Set([1, 2, 3, 4, 5, 6])],
    validatorName: "v.max(5)"
  });
  testValidator({
    caption: "map",
    isValid: v.max(5),
    trueValues: [
      new Map(),
      new Map([[1, 1]]),
      new Map([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]])
    ],
    falseValues: [new Map([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]])],
    validatorName: "v.max(5)"
  });
});

testValidator({
  caption: "regex method",
  isValid: v.regex(/.abc./),
  trueValues: [" abc ", "aabcdd", "aabcddddd"],
  falseValues: ["abc ", "aabdd", "aaddddd"],
  validatorName: `v.regex(/.abc./)`
});

describe("explain", () => {
  test("without explanation", () => {
    const isValid = v().explain("number");
    isValid(1);
    expect(v.explanation).toEqual([]);
    isValid(2);
    expect(v.explanation).toEqual([]);
  });
  test("default explanation", () => {
    const isValid = v().explain("number");
    isValid("123");
    expect(v.explanation).toEqual([{ value: "123", parents: [] }]);
  });
  test("default explanation - resetExplanation method", () => {
    const isValid = v().explain("number");
    isValid(null);
    expect(v.explanation).toEqual([{ value: null, parents: [] }]);
    v.resetExplanation(); // The same as v()
    v.explain("number")(1);
    expect(v.explanation).toEqual([]);
  });
  test("default explanation - resetExplanation alias v()", () => {
    v()("number")(null);
    v()("number")(1);
    expect(v.explanation).toEqual([]);
  });
  test("custom explanation - not function", () => {
    v.resetExplanation();
    const isValidPerson = v({
      name: v.explain("string", "wrong name"),
      age: v.explain("number", "wrong age")
    });
    isValidPerson({
      name: "andrew"
    });
    expect(v.explanation).toEqual(["wrong age"]);

    v();
    isValidPerson({
      age: 12
    });
    expect(v.explanation).toEqual(["wrong name"]);

    v();
    isValidPerson({});
    expect(v.explanation).toEqual(["wrong name", "wrong age"]);
  });
  test("custom explanation - function", () => {
    v();
    const explanationFunc = type => (value, { key }) =>
      `wrong property: ${key}. Expected ${type}, but ${typeof value} get`;
    const isValidPerson = v({
      name: v.explain("string", explanationFunc("string")),
      age: v.explain("number", explanationFunc("number"))
    });
    expect(isValidPerson({ name: "andrew" })).toBe(false);
    expect(v.explanation).toEqual([
      "wrong property: age. Expected number, but undefined get"
    ]);

    v();
    isValidPerson({ age: 12 });
    expect(v.explanation).toEqual([
      "wrong property: name. Expected string, but undefined get"
    ]);

    v();
    expect(isValidPerson({ name: 1, age: "1" })).toBe(false);
    expect(v.explanation).toEqual([
      "wrong property: name. Expected string, but number get",
      "wrong property: age. Expected number, but string get"
    ]);
    v.override("prime", n => {
      if (n < 2) return false;
      if (n === 2) return true;
      for (let i = 2; i * i <= n; i++) {
        if (n % i === 0) return false;
      }
      return true;
    });
    v();
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const isArrayOfPrimes = v.arrayOf(
      v.explain("prime", (value, { key }) => ({
        key,
        value
      }))
    );
    expect(isArrayOfPrimes(arr)).toBe(false);
    const notPrimes = v.explanation.map(({ value }) => value);
    expect(notPrimes).toEqual([1, 4, 6, 8]);
  });
});

describe("Test omitInvalidItems", () => {
  test("omitInvalidItems(array)", () => {
    const arr = [1, "2", 3, "4", 5];

    const onlyNumbers = v.omitInvalidItems("number")(arr);
    expect(onlyNumbers).toEqual([1, 3, 5]);

    const onlyStrings = v.omitInvalidItems("string")(arr);
    expect(onlyStrings).toEqual(["2", "4"]);

    const arr2 = [0, 1, 5, 3, 4];
    const isElementPlusIndexIsEven = (value, { key }) =>
      (value + key) % 2 === 0;
    expect(v.omitInvalidItems(isElementPlusIndexIsEven)(arr2)).toEqual([
      0,
      1,
      3,
      4
    ]);
  });
  test("omitInvalidItems(object)", () => {
    const invalidNumberDict = {
      a: 1,
      b: "2",
      c: 3
    };
    const onlyNumberProperties = v.omitInvalidItems(
      "number",
      invalidNumberDict
    )(invalidNumberDict);
    expect(onlyNumberProperties).toEqual({
      a: 1,
      c: 3
    });
    const isKeyPlusValueHasLengthLessThen5 = (value, { key }) => {
      return (key + value).length < 5;
    };

    const keys = {
      an: "ap",
      an2: "apple",
      "1a": "96"
    };
    expect(v.omitInvalidItems(isKeyPlusValueHasLengthLessThen5)(keys)).toEqual({
      an: "ap",
      "1a": "96"
    });
  });
});

describe("omitInvalidProps", () => {
  test("omitInvalidProps", () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
      f: 6,
      g: 7
    };
    v.override("prime", n => {
      if (n < 2) return false;
      if (n === 2) return true;
      for (let i = 2; i * i <= n; i++) {
        if (n % i === 0) return false;
      }
      return true;
    });

    const onlyPrimesAndF = v.omitInvalidProps({
      a: "prime",
      b: "prime",
      c: "prime",
      d: "prime",
      e: "prime",
      g: "prime"
    });
    expect(onlyPrimesAndF(obj)).toEqual({
      b: 2,
      c: 3,
      e: 5,
      f: 6,
      g: 7
    });
  });
});
test("validOr", () => {
  expect(v.validOr("number", 0)(123)).toBe(123);
  expect(v.validOr("number", 0)("123")).toBe(0);
});
