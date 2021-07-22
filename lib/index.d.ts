export interface CommonjsContext {
  __filename: string
  __dirname: string
}

export type createCommonJS = (importMeta: ImportMeta) => CommonjsContext


export interface ResolveOptions {
  parent?: string | URL
  conditions?: string[]
}

export type resolve = (specifier: string, options: ResolveOptions) => Promise<string>
export type resolveSync = (specifier: string, options: ResolveOptions) => string
export type resolvePath = (specifier: string, options: ResolveOptions) => Promise<string>
export type resolvePathSync = (specifier: string, options: ResolveOptions) => string
export type createResolve = (importMeta: ImportMeta) => (specifier: string, parent: string) => Promise<string>
