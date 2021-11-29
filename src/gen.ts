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

// genImportName

// Internal
function genString (input: string, opts: CodegenOptions = {}) {
  const str = JSON.stringify(input)
  if (!opts.singleQuotes) {
    return JSON.stringify(input)
  }
  return `'${str.replace(/'/g, "\\'")}'`
}
