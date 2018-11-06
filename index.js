const stringCheck = (configName, registered) => (obj, ...parents) => {
  const registeredConfig = registered[configName];
  if (!registeredConfig) {
    throw new TypeError(`Reference to not registered config: ${configName}`);
  }
  return where(registeredConfig, registered)(obj, ...parents);
};
const functionCheck = (isValid, registered) => (obj, ...parents) => {
  return isValid(obj, ...parents);
};
const objectCheck = (configObj, registered) => (obj, ...parents) => {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  return Object.entries(configObj).every(([key, innerConfig]) => {
    const value = obj[key];
    return where(innerConfig, registered)(
      value,
      { key, parent: obj },
      ...parents
    );
  });
};
// Or
const variantCheck = (variantsConfigs, registered) => (obj, ...parents) => {
  return variantsConfigs.some(config => {
    // And
    if (Array.isArray(config)) {
      return config.every(andVariant =>
        where(andVariant, registered)(obj, ...parents)
      );
    }
    return where(config, registered)(obj, ...parents);
  });
};
function validateConfig(config) {
  if (
    !["string", "function", "object"].includes(typeof config) ||
    config === null
  ) {
    throw new TypeError(
      "config must be either name of registered config, isValid function or object config"
    );
  }

  return true;
}
function validateRegistered(registered) {
  if (typeof registered !== "object" || registered === null) {
    throw new TypeError(
      "registered must be an object { key1: config1, key2: config2, ...}"
    );
  }
}
const getType = x => {
  if (Array.isArray(x)) return "array";
  if (x === null) return "null";
  if (x instanceof Set) return "set";
  if (x instanceof Map) return "map";
  if (x instanceof Date) return "date";
  return typeof x;
};
function where(config, registered = {}) {
  validateConfig(config);
  validateRegistered(registered);
  switch (getType(config)) {
    case "string":
      return stringCheck(config, registered);
    case "function":
      return functionCheck(config, registered);
    case "object":
      return objectCheck(config, registered);
    case "array":
      return variantCheck(config, registered);
  }
}
function checkRecursivity(config, history = []) {
  if (history.includes(config)) {
    throw new TypeError("Config must be not recursive");
  }
  if (typeof config !== "object" || config === null) return;
  for (const innerConfig of Object.values(config)) {
    checkRecursivity(innerConfig, [...history, config]);
  }
}

function isEmpty(x) {
  switch (getType(x)) {
    case "string":
      return x === "";
    case "array":
      return x.length === 0;
    case "boolean":
      return x === false;
    case "null":
      return true;
    case "object":
      return false;
    case "number":
      return x === 0;
    case "set":
    case "map":
      return x.size === 0;
    case "date":
      return false;
    case "undefined":
      return true;
  }
  return !x;
}

const getDefaultConfigs = func => ({
  string: x => typeof x === "string",
  null: x => x === null,
  undefined: x => x === undefined,
  nil: x => x === null || x === undefined,
  number: x => typeof x === "number",
  safeInteger: x => Number.isSafeInteger(x),
  finite: x => Number.isFinite(x),
  positive: x => x > 0,
  object: x => typeof x === "object",
  array: x => Array.isArray(x),
  "not-empty": x => !isEmpty(x),
  "object!": x => typeof x === "object" && x !== null,
  negative: x => x < 0,
  "non-negative": x => x >= 0,
  "non-positive": x => x <= 0,
  log: (value, ...parents) => {
    console.log({ value, parents });
    return true;
  },
  required: (_, parentKeyValue) => {
    if (!parentKeyValue) return true;
    const { key, parent } = parentKeyValue;
    return parent.hasOwnProperty(key);
  }
});

var newContext = registered => {
  function func(config, registered = func.registered) {
    checkRecursivity(config);
    return where(config, registered);
  }
  const methods = {
    registered: registered || getDefaultConfigs(func),
    register(name, config) {
      if (typeof name !== "string") {
        throw new TypeError("Name must be a string");
      }
      checkRecursivity(config);
      validateConfig(config);
      if (func.registered[name]) {
        throw new TypeError("This name is already used for validator");
      }
      func.registered[name] = config;
    },
    override(name, config) {
      if (typeof name !== "string") {
        throw new TypeError("Name must be a string");
      }
      checkRecursivity(config);
      validateConfig(config);
      func.registered[name] = config;
    },
    isValidConfig(config) {
      try {
        checkRecursivity(config);
        validateConfig(config);
        return true;
      } catch (error) {
        return false;
      }
    },
    validateConfig(config) {
      checkRecursivity(config);
      validateConfig(config);
    },
    required(...propNames) {
      return obj => propNames.every(prop => obj.hasOwnProperty(prop));
    },
    arrayOf(config) {
      const isValidElement = func(config);
      return (arr, ...parents) =>
        Array.isArray(arr) &&
        arr.every((el, i, a) => {
          return isValidElement(el, { key: i, parent: a }, ...parents);
        });
    },
    dictionaryOf(config) {
      const isValidElement = func(config);
      return (obj, ...parents) =>
        Object.entries(obj).every(([key, value]) =>
          isValidElement(value, { key, parent: obj }, ...parents)
        );
    },
    keys(config) {
      const isValidKey = func(config);
      return obj => Object.keys(obj).every(isValidKey);
    },
    throwError(config, errorMessage = "Validation error") {
      if (!["string", "function"].includes(typeof errorMessage)) {
        throw new TypeError(
          "errorMessage must be a string, or function that returns string"
        );
      }
      const isValid = func(config);
      return obj => {
        if (isValid(obj)) return obj;
        if (typeof errorMessage === "function") {
          errorMessage = errorMessage(obj);
          if (typeof errorMessage !== "string") {
            throw new TypeError(
              "errorMessage must be a string, or function that returns string"
            );
          }
        }
        throw new TypeError(errorMessage);
      };
    },
    not(config) {
      const isValid = func(config);
      return (obj, ...parents) => !isValid(obj, ...parents);
    },
    newContext
  };
  for (const [methodName, method] of Object.entries(methods)) {
    func[methodName] = method;
  }
  return func;
};

module.exports = newContext();
