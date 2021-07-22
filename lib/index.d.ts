export interface CommonjsContext {
  __filename: string
  __dirname: string
}
export type createCommonJS = (importMeta: ImportMeta) => CommonjsContext

export interface ResolveOptions {
  from?: string | URL
  conditions?: string[]
}

export type ResolveFn<T> = (id: string, opts: ResolveOptions) => T
export type resolve = ResolveFn<Promise<string>>
export type resolveSync = ResolveFn<string>
export type resolvePath = ResolveFn<Promise<string>>
export type resolvePathSync = ResolveFn<string>

export type createResolve = (from: ImportMeta|string) => ResolveFn<Promise<string>>

export interface EvaluateOptions extends ResolveOptions {
  from?: URL | string
}
export interface ReadOptions extends ResolveOptions {
}

export type loadModule = (id: string, opts?: EvaluateOptions) => Promise<any>
export type evalModule = (code: string, opts?: EvaluateOptions) => Promise<any>
export type readModule = (id: string, opts?: ReadOptions) => Promise<any>
export type toDataURL = (code: string) => string
