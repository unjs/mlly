import { promises as fsp } from 'fs'
import { extname } from 'pathe'
import { readPackageJSON } from 'pkg-types'
import { ResolveOptions, resolvePath } from './resolve'

const ESM_RE = /([\s;]|^)(import[\w,{}\s*]*from|import\s*['"*{]|export\b\s*([*{]|default|type)|import\.meta\b)/m

const BUILTIN_EXTENSIONS = new Set(['.mjs', '.cjs', '.node', '.wasm'])

export function hasESMSyntax (code: string): boolean {
  return ESM_RE.test(code)
}

const CJS_RE = /([\s;]|^)(module.exports\b|exports\.\w|require\s*\(|global\.\w)/m
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

export async function isValidNodeImport (id: string, opts: ResolveOptions & { code?: string } = {}): Promise<boolean> {
  const resolvedPath = await resolvePath(id, opts)
  const extension = extname(resolvedPath)

  if (BUILTIN_EXTENSIONS.has(extension)) {
    return true
  }

  if (extension !== '.js') {
    return false
  }

  if (resolvedPath.match(/\.(\w+-)?esm?(-\w+)?\.js$/)) {
    return false
  }

  const pkg = await readPackageJSON(resolvedPath).catch(() => null)
  if (pkg?.type === 'module') { return true }

  const code = opts.code || await fsp.readFile(resolvedPath, 'utf-8').catch(() => null)

  return hasCJSSyntax(code) || !hasESMSyntax(code)
}
