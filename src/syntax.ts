import { promises as fsp } from 'fs'
import { extname } from 'pathe'
import { readPackageJSON } from 'pkg-types'

const ESM_RE = /([\s;]|^)(import[\s'"*{]|export\b|import\.meta\b)/m

export function hasESMSyntax (code: string): boolean {
  return ESM_RE.test(code)
}

const CJS_RE = /([\s;]|^)(module.exports\b|exports\.|require\s*\(|global\b)/m
export function hasCJSSyntax (code: string): boolean {
  return CJS_RE.test(code)
}

export function detectSyntax (code: string) {
  const hasESM = hasESMSyntax(code)
  const hasCJS = hasCJSSyntax(code)

  return {
    hasESM,
    hasCJS,
    isMixed: hasESM && hasCJS
  }
}

export async function isValidNodeImport (id: string, code?: string): Promise<boolean> {
  const extension = extname(id)
  if (['.mjs', '.cjs', '.node', '.wasm'].includes(extension)) { return true }

  if (extension !== '.js') { return false }
  if (id.match(/\.(\w+-)?esm(-\w+)?\.js$/)) { return false }

  const pkg = await readPackageJSON(id)
  if (pkg?.type === 'module') { return true }

  code = code || await fsp.readFile(id, 'utf-8').catch(() => null)

  return !hasESMSyntax(code)
}
