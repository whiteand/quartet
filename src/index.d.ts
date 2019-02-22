declare type KeyParent = {
  key: number | string,
  parent: object | any[]
}
declare type FromParams<T> = (value: any, ...keyParents: KeyParent[]) => T
declare type Validator = (value: any, ...keyParents: KeyParent[]) => boolean
declare interface ObjectSchema {
  [property: string]: Schema
}
declare interface AlternativeSchema extends Array<Schema> {
}
declare type Schema = string | AlternativeSchema | ObjectSchema | Validator
declare type GetExplanation = (value: any, schema: Schema, ...keyParents: KeyParent[]) => any
declare type Explanation = any | GetExplanation

declare interface Compiler {
  (schema?: Schema, explanation?: Explanation, params?: { withoutDefaultExplanation?: boolean }): Validator
}
type CommonConfig = {
  validator: Schema,
  examples?: any[],
  explanation?: Explanation
}
interface Fixes {
  fix: FromParams<void>,
  filter: boolean,
  default: any|FromParams<any>
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

declare type Config = Exclude<CommonConfig, Fixes>
  | CommonConfig & Omit<Fixes, 'filter'|'default'>
  | CommonConfig & Omit<Fixes, 'filter'|'fix'>
  | CommonConfig & Omit<Fixes, 'fix'|'default'>

declare type SchemaDict = {
  [name: string]: Schema
}

declare interface CompilerSettings {
  registered?: SchemaDict,
  allErrors?: boolean,
  defaultExplanation?: Explanation
}
declare interface Compiler {
  addFix: (schema: Schema, fixFunction: FromParams<void>) => Validator,
  allErrors: boolean,
  and: (...schemas: Schema[]) => Validator,
  arrayOf: (elementSchema: Schema) => Validator,
  default: (schema: Schema, defaultValue: any|FromParams<any>) => Validator,
  dictionaryOf: (schema: Schema) => Validator,
  enum: (...values: any) => Validator,
  example: (schema: Schema, ...validExamples: any[]) => Validator,
  explain: (schema: Schema, explanation: Explanation) => Validator,
  explanation: any[],
  filter: (schema: Schema) => Validator,
  fix: (value: any) => any,
  fromConfig: (...config: Config[]) => Validator,
  hasFixes: () => boolean,
  keys: (keySchema: Schema) => Validator,
  max: (maxValue: number) => Validator,
  min: (minValue: number) => Validator,
  newCompiler: (settings?: CompilerSettings) => Compiler,
  not: (schema: Schema) => Validator,
  omitInvalidItems: (itemSchema: Schema) => (collection: any) => any,
  omitInvalidProps: (objSchema: ObjectSchema|string, settings?: { omitUnchecked: boolean }) => (object: any) => any,
  parent: (parentSchema: Schema) => Validator,
  regex: (regex: RegExp) => Validator,
  register: (schemasToBeRegistered: SchemaDict) => Compiler,
  registered: SchemaDict,
  required: (...props: string[]) => Validator,
  requiredIf: (isRequired: boolean|Schema) => Validator,
  rest: (restPropsSchema: Schema) => ObjectSchema,
  throwError: (schema: Schema, errorMessage: string|FromParams<string>) => (value: any) => any,
  validOr: (schema: Schema, defaultValue: any) => (value: any) => any,
  withoutAdditionalProps: (schema: ObjectSchema|string) => Validator,
  clearContext(): void
  FUNCTION: string
  ALTERNATIVE: string
  OBJECT: string
  REGISTERED: string
  ADD_FIX: string
  AND: string
  ARRAY_OF: string
  DEFAULT: string
  DICTIONARY_OF: string
  ENUM: string
  EXPLAIN: string
  FILTER: string
  FROM_CONFIG: string
  KEYS: string
  MAX: string
  MIN: string
  NOT: string
  OMIT_INVALID_ITEMS: string
  OMIT_INVALID_PROPS: string
  PARENT: string
  REGEX: string
  REQUIRED: string
  REQUIRED_IF: string
  THROW_ERROR: string
  VALID_OR: string
  WITHOUT_ADDITIONAL_PROPS: string
}

declare function newCompiler(settings?: CompilerSettings): Compiler
export default newCompiler