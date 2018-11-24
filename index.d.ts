type KeyParent = {
  key: number | string;
  parent: object | any[];
}
declare type FromParams<T> = (value: any, ...keyParents: KeyParent[]) => T;
declare type Validator = (value: any, ...keyParents: KeyParent[]) => boolean;
interface ObjectSchema {
  [property: string]: Schema;
}
interface AlternativeSchema extends Array<Schema> {
}
declare type Schema = string | AlternativeSchema | ObjectSchema | Validator;
declare type Explanation = any | FromParams<any>;
interface Compiler {
  (schema: Schema, explanation?: Explanation): Validator;
}
type CommonConfig = {
  validator: Schema,
  examples?: any[],
  explanation?: Explanation,
}
interface Fixes {
  fix: FromParams<void>,
  filter: boolean,
  default: any|FromParams<any>,
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

type Config = Exclude<CommonConfig, Fixes>
  | CommonConfig & Omit<Fixes, 'filter'|'default'>
  | CommonConfig & Omit<Fixes, 'filter'|'fix'>
  | CommonConfig & Omit<Fixes, 'fix'|'default'>

type SchemaDict = {
  [name: string]: Schema;
}

interface CompilerSettings {
  registered: SchemaDict;
  allErrors: boolean;
}
interface Compiler {
  addFix: (schema: Schema, fixFunction: FromParams<void>) => Validator
  allErrors: boolean;
  and: (...schemas: Schema[]) => Validator,
  arrayOf: (schema: Schema) => Validator,
  default: (schema: Schema, defaultValue: any) => Validator,
  dictionaryOf: (schema: Schema) => Validator,
  enum: (...values: any) => Validator,
  example: (schema: Schema, ...validExamples: any[]) => Validator
  explain: (schema: Schema, explanation: Explanation) => Validator,
  explanation: any[],
  filter: (schema: Schema) => Validator,
  fix: (value: any) => any,
  fromConfig: (config: Config) => Validator,
  hasFixes: () => boolean,
  keys: (schema: Schema) => Validator,
  max: (maxValue: number) => Validator,
  min: (minValue: number) => Validator,
  newCompiler: (settings?: CompilerSettings) => Compiler,
  not: (schema: Schema) => Validator,
  omitInvalidItems: (schema: Schema) => (collection: any) => any,
  omitInvalidProps: (schema: ObjectSchema|string) => (object: any) => any,
  parent: (schema: Schema) => Validator,
  regex: (regex: RegExp) => Validator,
  register: (schemasToBeRegistered: SchemaDict) => Compiler,
  registered: SchemaDict;
  required: (...props: string[]) => Validator,
  requiredIf: (isRequired: boolean|Schema) => Validator,
  rest: (schema: Schema) => ObjectSchema,
  throwError: (schema: Schema, errorMessage: string|FromParams<string>) => any,
  validOr: (schema: Schema, defaultValue: any) => (value: any) => any,
  withoutAdditionalProps: (schema: ObjectSchema|string) => Validator,
}

declare function newCompiler(settings?: CompilerSettings): Compiler;
export default newCompiler;