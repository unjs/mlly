export interface CodegenOptions {
  singleQuotes?: Boolean
}

// genImport
export type Import = string | { name: string, as?: string }
export function genImport (specifier: string, imports?: Import | Import[], opts: CodegenOptions = {}) {
  const specifierStr = genString(specifier, opts)
  if (!imports) {
    return `import ${specifierStr}`
  }

  const _imports = (Array.isArray(imports) ? imports : [imports]).map((i: Import) => {
    if (typeof i === 'string') { return { name: i } }
    if (i.name === i.as) { i = { name: i.name } }
    // TODO: Ensure `name` and `as` are valid identifiers
    // TODO: Ensure `as` is provided for default import
    return i
  })

  const importsStr = _imports.map(i => i.as ? `${i.name} as ${i.as}` : i.name).join(', ')
  return `import { ${importsStr} } from ${genString(specifier, opts)}`
}

// genDynamicImport
export interface DynamicImportOptions extends CodegenOptions {
  comment?: string
  wrapper?: boolean
  interopDefault?: boolean
}
export function genDynamicImport (specifier: string, opts: DynamicImportOptions = {}) {
  const commentStr = opts.comment ? ` /* ${opts.comment} */` : ''
  const wrapperStr = (opts.wrapper === false) ? '' : '() => '
  const ineropStr = opts.interopDefault ? '.then(m => m.default || m)' : ''
  return `${wrapperStr}import(${genString(specifier, opts)}${commentStr})${ineropStr}`
}

export function genObjectFromRaw (obj: Record<string, any>, indent = ''): string {
  return genObjectFromRawEntries(Object.entries(obj), indent)
}

export function genArrayFromRaw (array: any[], indent = '') {
  const newIdent = indent + '  '
  return wrapInDelimiters(array.map(i => `${newIdent}${genRawValue(i, newIdent)}`), indent, '[]')
}

export function genObjectFromRawEntries (array: [key: string, value: any][], indent = '') {
  const newIdent = indent + '  '
  return wrapInDelimiters(array.map(([key, value]) => `${newIdent}${genObjectKey(key)}: ${genRawValue(value, newIdent)}`), indent, '{}')
}

// Internal
function wrapInDelimiters (lines: string[], indent = '', delimiters = '{}') {
  if (!lines.length) {
    return delimiters
  }
  const [start, end] = delimiters
  return `${start}\n` + lines.join(',\n') + `\n${indent}${end}`
}

function genString (input: string, opts: CodegenOptions = {}) {
  const str = JSON.stringify(input)
  if (!opts.singleQuotes) {
    return JSON.stringify(input)
  }
  return `'${escapeString(str)}'`
}

function genRawValue (value: unknown, indent = ''): string {
  if (typeof value === 'undefined') {
    return 'undefined'
  }
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return genArrayFromRaw(value, indent)
  }
  if (value && typeof value === 'object') {
    return genObjectFromRaw(value, indent)
  }
  return value.toString()
}

const VALID_IDENTIFIER_RE = /^[$_]?[\w\d]*$/

function genObjectKey (key: string) {
  return key.match(VALID_IDENTIFIER_RE) ? key : genString(key)
}

// https://github.com/rollup/rollup/blob/master/src/utils/escapeId.ts
const NEEDS_ESCAPE_RE = /[\\'\r\n\u2028\u2029]/
const QUOTE_NEWLINE_RE = /(['\r\n\u2028\u2029])/g
const BACKSLASH_RE = /\\/g

function escapeString (id: string): string {
  if (!id.match(NEEDS_ESCAPE_RE)) {
    return id
  }
  return id.replace(BACKSLASH_RE, '\\\\').replace(QUOTE_NEWLINE_RE, '\\$1')
}
