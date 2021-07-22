// CommonJS

export interface CommonjsContext {
  __filename: string
  __dirname: string
}
export type createCommonJS = (importMeta: ImportMeta) => CommonjsContext

// Resolve

export interface ResolveOptions {
  from?: string | URL
  conditions?: string[]
}

export type resolve = (id: string, opts: ResolveOptions) => Promise<string>
export type resolvePath = (id: string, opts: ResolveOptions) => Promise<string>
export type resolveSync = (id: string, opts: ResolveOptions) => string
export type resolvePathSync = (id: string, opts: ResolveOptions) => string
export type createResolve = (defaults: ResolveOptions) => (id: string, from: string | URL) => Promise<string>
export type resolveImports = (code: string, opts: ResolveOptions) => Promise<string>


// Evaluate

export interface EvaluateOptions extends ResolveOptions {}

export type loadModule = (id: string, opts?: EvaluateOptions) => Promise<any>
export type evalModule = (code: string, opts?: EvaluateOptions) => Promise<any>
export type readModule = (id: string, opts?: ResolveOptions) => Promise<any>
export type toDataURL = (code: string) => Promise<string>

// Path Utils

export type fileURLToPath = (id: URL | string) => string
