export interface CommonjsContext {
  __filename: string
  __dirname: string
}

export type createCommonJS = (importMeta: ImportMeta) => CommonjsContext
