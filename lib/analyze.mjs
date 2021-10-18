import { matchAll } from './_utils.mjs'

export const ESM_STATIC_IMPORT_RE = /^(?<=\s*)import\s*(["'\s]*(?<imports>[\w*${}\n\r\t, /]+)from\s*)?["']\s*(?<specifier>.*[@\w_-]+)\s*["'][^\n]*$/gm
export const DYNAMIC_IMPORT_RE = /import\s*\((?<expression>(?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gm

export const EXPORT_DECAL_RE = /\bexport\s+(?<declaration>(function|let|const|var|class))\s+(?<name>[\w$_]+)/g
const EXPORT_NAMED_RE = /\bexport\s+{(?<exports>[^}]+)}/g
const EXPORT_DEFAULT_RE = /\bexport\s+default\s+/g

export function findStaticImports (code) {
  return matchAll(ESM_STATIC_IMPORT_RE, code, { type: 'static' })
}

export function findDynamicImports (code) {
  return matchAll(DYNAMIC_IMPORT_RE, code, { type: 'dynamic' })
}

export function parseStaticImport (matched) {
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
  }
}

export function findExports (code) {
  const declaredExports = matchAll(EXPORT_DECAL_RE, code, { type: 'declaration' })

  const namedExports = matchAll(EXPORT_NAMED_RE, code, { type: 'named' })
  for (const namedExport of namedExports) {
    namedExport.names = namedExport.exports.split(/\s*,\s*/g).map(name => name.replace(/^.*?\sas\s/, '').trim())
  }

  const defaultExport = matchAll(EXPORT_DEFAULT_RE, code, { type: 'default' })

  return [].concat(declaredExports, namedExports, defaultExport)
}
