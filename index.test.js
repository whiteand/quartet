global.console = {
  log: jest.fn()
};
expect.extend({
  toBeTrueValueOf(received, isValid, validatorName) {
    const pass = isValid(received) === true;
    const message = () => `expected ${validatorName}(${received}) to be true`;
    return {
      pass,
      message
    };
  },
  toBeFalseValueOf(received, isValid, validatorName) {
    const pass = isValid(received) === false;
    const message = () => `expected ${validatorName}(${received}) to be false`;
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
    Symbol("Andrew"),
    0,
    false,
    true,
    [],
    ["andfrew"]
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
  falseValues: [1, "1", false, true, undefined, Symbol("andrew")]
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
