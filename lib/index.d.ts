export interface ImportMeta {
  url: string
  [key: string]: any
}

export interface CommonjsContext {
  __filename: string
  __dirname: string
}

export type createCommonJS = (importMeta: ImportMeta) => CommonjsContext
