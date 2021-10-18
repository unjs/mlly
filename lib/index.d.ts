// CommonJS

export interface CommonjsContext {
  __filename: string
  __dirname: string
  require: NodeRequire
}

export function createCommonJS (url: string) : CommonjsContext

// Resolve

export interface ResolveOptions {
  from?: string | URL
  conditions?: string[]
}

export function resolve (id: string, opts: ResolveOptions) : Promise<string>
export function resolvePath (id: string, opts: ResolveOptions) : Promise<string>
export function resolveSync (id: string, opts: ResolveOptions) : string
export function resolvePathSync (id: string, opts: ResolveOptions) : string
export function createResolve (defaults: ResolveOptions) : (id: string, url?: string | URL) => Promise<string>
export function resolveImports (code: string, opts: ResolveOptions) : Promise<string>


// Import analyzes

export interface ESMImport {
  type: 'static' | 'dynamic'
  code: string
  start: number
  end: number
}

export interface StaticImport extends ESMImport {
  type: 'static'
  imports: string
  specifier: string
}

export interface ParsedStaticImport extends StaticImport {
  defaultImport?: string
  namespacedImport?: string
  namedImports?: { [name: string]: string }
}

export interface DynamicImport extends ESMImport {
  type: 'dynamic'
  expression: string
}

export interface ESMExport {
  type: 'declaration' | 'named' | 'default',
  code: string
  start: number
  end: number
}

export interface DeclarationExport extends ESMExport {
  type: 'declaration'
  declaration: string
  name: string
}

export interface NamedExport extends ESMExport {
  type: 'named'
  exports: string
  names: string[]
}

export interface DefaultExport extends ESMExport {
  type: 'default'
}

export function findStaticImports (code: string) : StaticImport[]
export function findDynamicImports (code: string) : DynamicImport[]
export function findExports (code: string): (NamedExport | DeclarationExport | DefaultExport)[]
export function parseStaticImport (staticImport: StaticImport) : ParsedStaticImport

// Evaluate

export interface EvaluateOptions extends ResolveOptions {
  url?: string
}

export function loadModule (url: string, opts?: EvaluateOptions) : Promise<any>
export function evalModule (code: string, opts?: EvaluateOptions) : Promise<any>
export function transformModule(code: string, opts?: EvaluateOptions) : Promise<string>

// Utils

export function fileURLToPath (id: URL | string) : string
export function normalizeid (id: URL | string) : string
export function loadURL (id: string) : Promise<string>
export function toDataURL(code: string) : string
export function interopDefault<T> (sourceModule: T): 'default' extends keyof T ? T['default'] : T
