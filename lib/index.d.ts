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

export type ResolveFn<T> = (id: string, opts: ResolveOptions) => T
export type resolve = ResolveFn<Promise<string>>
export type resolvePath = ResolveFn<Promise<string>>
export type resolveSync = ResolveFn<string>
export type resolvePathSync = ResolveFn<string>
export type createResolve = (defaults: ResolveOptions) => ResolveFn<Promise<string>>
export type resolveImports = (code: string, opts: ResolveOptions) => Promise<string>


// Evaluate

export interface EvaluateOptions extends ResolveOptions {}

export type loadModule = (id: string, opts?: EvaluateOptions) => Promise<any>
export type evalModule = (code: string, opts?: EvaluateOptions) => Promise<any>
export type readModule = (id: string, opts?: ResolveOptions) => Promise<any>
export type toDataURL = (code: string) => string

// Path Utils

export type fileURLToPath = (id: URL | string) => string
