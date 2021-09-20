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
