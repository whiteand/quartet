declare const getType: (x: any) => "string" | "number" | "boolean" | "symbol" | "undefined" | "object" | "function" | "array" | "null" | "set" | "map" | "date";

declare const is: (value: any) => (...types: string[]) => boolean;
declare const isnt: (value: any) => (...types: string[]) => boolean;

interface ParentKeyValue {
    parent: any,
    key: string|number
}

type ValidationFunction = (v: any, ...parents: ParentKeyValue[]) => boolean
type Config = string|object|((Config|Config[])[])|ValidationFunction

interface Registered {
    [configName: string]: Config
}

declare const stringCheck: (configName: string, registered: Registered) => ValidationFunction;

declare const functionCheck: (isValid: ValidationFunction) => ValidationFunction;
declare const objectCheck: (configObj: object, registered: Registered) => ValidationFunction;
declare const variantCheck: (variantsConfigs: ((Config|Config[])[]), registered: Registered) => ValidationFunction;

declare function validateConfig(config: any): boolean;

declare const check: {
    string: (configName: string, registered: Registered) => ValidationFunction;
    function: (isValid: function) => ValidationFunction;
    object: (configObj: object, registered: Registered) => ValidationFunction;
    array: (variantsConfigs: ((Config|Config[])[]), registered: Registered) => ValidationFunction;
};
declare function where(config: Config, registered: Registered): any;
declare function checkRecursivity(config: any, history?: any[]): void;
declare function isEmpty(x: any): boolean;
declare const getDefaultConfigs: () => {
    string: (x: any) => boolean;
    null: (x: any) => boolean;
    undefined: (x: any) => boolean;
    nil: (x: any) => boolean;
    number: (x: any) => boolean;
    'safe-integer': (x: any) => any;
    finite: (x: any) => any;
    positive: (x: any) => boolean;
    negative: (x: any) => boolean;
    'non-negative': (x: any) => boolean;
    'non-positive': (x: any) => boolean;
    object: (x: any) => boolean;
    array: (x: any) => boolean;
    'not-empty': (x: any) => boolean;
    'object!': (x: any) => boolean;
    boolean: (x: any) => boolean;
    symbol: (x: any) => boolean;
    function: (x: any) => boolean;
    log: (value: any, ...parents: ParentKeyValue[]) => boolean;
    required: (_: any, parentKeyValue: ParentKeyValue) => boolean;
};
declare const newContext: (registered: Registered) => (config: Config, registered?: Registered) => ValidationFunction;