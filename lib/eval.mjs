import { resolve } from './resolve.mjs'
import { loadURL, toDataURL } from './utils.mjs'

const EVAL_ESM_IMPORT_RE = /(?<=import .* from ['"])([^'"]+)(?=['"])|(?<=export .* from ['"])([^'"]+)(?=['"])|(?<=import\s*['"])([^'"]+)(?=['"])|(?<=import\s*\(['"])([^'"]+)(?=['"]\))/g

export async function loadModule (id, opts = {}) {
  const url = await resolve(id, opts)
  const code = await loadURL(url)
  return evalModule(code, { ...opts, url })
}

export async function evalModule (code, opts = {}) {
  const transformed = await transformModule(code, opts)
  const dataURL = toDataURL(transformed, opts)
  return import(dataURL).catch((err) => {
    err.stack = err.stack.replace(new RegExp(dataURL, 'g'), opts.url || '_mlly_eval_.mjs')
    throw err
  })
}

export async function transformModule (code, opts) {
  // Convert JSON to module
  if (opts.url && opts.url.endsWith('.json')) {
    return 'export default ' + code
  }

  // Resolve relative imports
  code = await resolveImports(code, opts)

  // Rewrite import.meta.url
  if (opts.url) {
    code = code.replace(/import\.meta\.url/g, `'${opts.url}'`)
  }

  return code
}

export async function resolveImports (code, opts) {
  const imports = Array.from(code.matchAll(EVAL_ESM_IMPORT_RE)).map(m => m[0])
  if (!imports.length) {
    return code
  }

  const uniqueImports = Array.from(new Set(imports))
  const resolved = new Map()
  await Promise.all(uniqueImports.map(async (id) => {
    let url = await resolve(id, opts)
    if (url.endsWith('.json')) {
      const code = await loadURL(url)
      url = toDataURL(await transformModule(code, { url }))
    }
    resolved.set(id, url)
  }))

  const re = new RegExp(uniqueImports.map(i => `(${i})`).join('|'), 'g')
  return code.replace(re, id => resolved.get(id))
}
