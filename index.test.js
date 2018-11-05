const v = require("./index");

const testValidator = (caption, isValid, trueValues, falseValues) => {
  test(caption, () => {
    for (const trueValue of trueValues) {
      expect(isValid(trueValue)).toBe(true);
    }
    for (const falseValue of falseValues) {
      expect(isValid(falseValue)).toBe(false);
    }
  });
};

// DEFAULT VALIDATORS
testValidator(
  "string default validator",
  v("string"),
  ["a string", ""],
  [
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
);

testValidator(
  "null default validator",
  v("null"),
  [null],
  ["null", 0, undefined, {}, Symbol("null"), 0, false, true, [], [null]]
);

testValidator(
  "undefined default validator",
  v("undefined"),
  [undefined],
  ["undefined", 0, null, {}, Symbol("null"), 0, false, true, [], [undefined]]
);

testValidator(
  "nil default validator",
  v("nil"),
  [undefined, null],
  ["undefined", 0, {}, Symbol("null"), 0, false, true, [], [undefined], [null]]
);
