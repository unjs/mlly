export interface CommonjsContext {
  __filename: string
  __dirname: string
}
export type createCommonJS = (importMeta: ImportMeta) => CommonjsContext

export type ResolveFn<T> = (specifier: string, parent: string | URL, conditions?: string[]) => T
export type resolve = ResolveFn<Promise<string>>
export type resolveSync = ResolveFn<string>
export type resolvePath = ResolveFn<Promise<string>>
export type resolvePathSync = ResolveFn<string>
export type createResolve = (importMeta: ImportMeta) => ResolveFn<Promise<string>>
