export interface CodegenOptions {
  singleQuotes?: Boolean
}

// genImport and genExport
export type Name = string | { name: string, as?: string }

export function genImport (specifier: string, imports?: Name | Name[], opts: CodegenOptions = {}) {
  return genStatement('import', specifier, imports, opts)
}

export function genExport (specifier: string, imports?: Name | Name[], opts: CodegenOptions = {}) {
  return genStatement('export', specifier, imports, opts)
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

// genImportName

// Internal

function genStatement (type: 'import' | 'export', specifier: string, names?: Name | Name[], opts: CodegenOptions = {}) {
  const specifierStr = genString(specifier, opts)
  if (!names) {
    return `${type} ${specifierStr};`
  }

  const nameArray = Array.isArray(names)

  const _names = (nameArray ? names : [names]).map((i: Name) => {
    if (typeof i === 'string') { return { name: i } }
    if (i.name === i.as) { i = { name: i.name } }
    // TODO: Ensure `name` and `as` are valid identifiers
    // TODO: Ensure `as` is provided for default import
    return i
  })

  const namesStr = _names.map(i => i.as ? `${i.name} as ${i.as}` : i.name).join(', ')
  if (nameArray) {
    return `${type} { ${namesStr} } from ${genString(specifier, opts)};`
  }
  return `${type} ${namesStr} from ${genString(specifier, opts)};`
}

function genString (input: string, opts: CodegenOptions = {}) {
  const str = JSON.stringify(input)
  if (!opts.singleQuotes) {
    return JSON.stringify(input)
  }
  return `'${str.replace(/'/g, "\\'")}'`
}
