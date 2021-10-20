import { resolve } from './resolve'
import { loadURL, toDataURL } from './utils'
import type { ResolveOptions } from './resolve'

export interface EvaluateOptions extends ResolveOptions {
  url?: string
}

const EVAL_ESM_IMPORT_RE = /(?<=import .* from ['"])([^'"]+)(?=['"])|(?<=export .* from ['"])([^'"]+)(?=['"])|(?<=import\s*['"])([^'"]+)(?=['"])|(?<=import\s*\(['"])([^'"]+)(?=['"]\))/g

export async function loadModule (id: string, opts: EvaluateOptions = {}): Promise<any> {
  const url = await resolve(id, opts)
  const code = await loadURL(url)
  return evalModule(code, { ...opts, url })
}

export async function evalModule (code: string, opts: EvaluateOptions = {}): Promise<any> {
  const transformed = await transformModule(code, opts)
  const dataURL = toDataURL(transformed)
  return import(dataURL).catch((err) => {
    err.stack = err.stack.replace(new RegExp(dataURL, 'g'), opts.url || '_mlly_eval_')
    throw err
  })
}

export function transformModule (code: string, opts: EvaluateOptions): Promise<string> {
  // Convert JSON to module
  if (opts.url && opts.url.endsWith('.json')) {
    return Promise.resolve('export default ' + code)
  }

  // Rewrite import.meta.url
  if (opts.url) {
    code = code.replace(/import\.meta\.url/g, `'${opts.url}'`)
  }

  return Promise.resolve(code)
}

export async function resolveImports (code: string, opts: EvaluateOptions): Promise<string> {
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
