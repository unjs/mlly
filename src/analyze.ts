import { matchAll } from './_utils'

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
  _type?: 'declaration' | 'named' | 'default' | 'star',
  type: 'declaration' | 'named' | 'default' | 'star',
  code: string
  start: number
  end: number
  name?: string
  names: string[]
  specifier?: string
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
  specifier?: string
}

export interface DefaultExport extends ESMExport {
  type: 'default'
}

export const ESM_STATIC_IMPORT_RE = /^(?<=\s*)import\s*(["'\s]*(?<imports>[\w*${}\n\r\t, /]+)from\s*)?["']\s*(?<specifier>.*[@\w_-]+)\s*["'][^\n]*$/gm
export const DYNAMIC_IMPORT_RE = /import\s*\((?<expression>(?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gm

export const EXPORT_DECAL_RE = /\bexport\s+(?<declaration>(async function|function|let|const|var|class))\s+(?<name>[\w$_]+)/g
const EXPORT_NAMED_RE = /\bexport\s+{(?<exports>[^}]+)}(\s*from\s*["']\s*(?<specifier>.*[@\w_-]+)\s*["'][^\n]*)?/g
const EXPORT_STAR_RE = /\bexport\s*(\*)\s*(\s*from\s*["']\s*(?<specifier>.*[@\w_-]+)\s*["'][^\n]*)?/g
const EXPORT_DEFAULT_RE = /\bexport\s+default\s+/g

export function findStaticImports (code: string): StaticImport[] {
  return matchAll(ESM_STATIC_IMPORT_RE, code, { type: 'static' })
}

export function findDynamicImports (code: string): DynamicImport[] {
  return matchAll(DYNAMIC_IMPORT_RE, code, { type: 'dynamic' })
}

export function parseStaticImport (matched: StaticImport): ParsedStaticImport {
  const cleanedImports = (matched.imports || '')
    .replace(/(\/\/[^\n]*\n|\/\*.*\*\/)/g, '')
    .replace(/\s+/g, ' ')

  const namedImports = {}
  for (const namedImport of cleanedImports.match(/\{([^}]*)\}/)?.[1]?.split(',') || []) {
    const [, source = namedImport.trim(), importName = source] = namedImport.match(/^\s*([^\s]*) as ([^\s]*)\s*$/) || []
    if (source) {
      namedImports[source] = importName
    }
  }
  const topLevelImports = cleanedImports.replace(/\{([^}]*)\}/, '')
  const namespacedImport = topLevelImports.match(/\* as \s*([^\s]*)/)?.[1]
  const defaultImport = topLevelImports.split(',').find(i => !i.match(/[*{}]/))?.trim() || undefined

  return {
    ...matched,
    defaultImport,
    namespacedImport,
    namedImports
  } as ParsedStaticImport
}

export function findExports (code: string): ESMExport[] {
  // Find declarations like export const foo = 'bar'
  const declaredExports = matchAll(EXPORT_DECAL_RE, code, { type: 'declaration' })

  // Find named exports
  const namedExports = matchAll(EXPORT_NAMED_RE, code, { type: 'named' })
  for (const namedExport of namedExports) {
    namedExport.names = namedExport.exports.split(/\s*,\s*/g).map(name => name.replace(/^.*?\sas\s/, '').trim())
  }

  // Find export default
  const defaultExport = matchAll(EXPORT_DEFAULT_RE, code, { type: 'default', name: 'default' })

  // Find export star
  const starExports = matchAll(EXPORT_STAR_RE, code, { type: 'star' })

  // Merge and normalize exports
  const exports = [].concat(declaredExports, namedExports, defaultExport, starExports).filter((exp, index, exports) => {
    // Prevent multiple exports of same function, only keep latest iteration of signatures
    return !exports[index + 1] || exp.name !== exports[index + 1].name
  })

  for (const exp of exports) {
    if (!exp.name && exp.names && exp.names.length === 1) {
      exp.name = exp.names[0]
    }
    if (exp.name === 'default' && exp.type !== 'default') {
      exp._type = exp.type
      exp.type = 'default'
    }
    if (!exp.names && exp.name) {
      exp.names = [exp.name]
    }
  }

  return exports
}
