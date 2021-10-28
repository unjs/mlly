import { promises as fsp } from 'fs'
import { extname } from 'pathe'
import { readPackageJSON } from 'pkg-types'
import { ResolveOptions, resolvePath } from './resolve'
import { isNodeBuiltin } from './utils'
import { getProtocol } from './_utils'

const ESM_RE = /([\s;]|^)(import[\w,{}\s*]*from|import\s*['"*{]|export\b\s*([*{]|default|type)|import\.meta\b)/m

const BUILTIN_EXTENSIONS = new Set(['.mjs', '.cjs', '.node', '.wasm'])

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

export interface ValidNodeImportOptions extends ResolveOptions {
  /**
   * The contents of the import, which may be analyzed to see if it contains
   * CJS or ESM syntax as a last step in checking whether it is a valid import.
   */
  code?: string
  /**
   * Protocols that are allowed as valid node imports.
   *
   * Default: ['node', 'file', 'data']
   */
  allowedProtocols?: Array<string>
  /**
   * Custom normalizers for each protocol, returning a normalized id
   * (or a boolean to short-circuit the validation process).
   *
   * If a normalizer is missing for an allowed protocol, the function will
   * return true.
   */
  protocolNormalizers?: { [protocol: string]: (id: string) => string | boolean }
}

const validNodeImportDefaults: ValidNodeImportOptions = {
  allowedProtocols: ['node', 'file', 'data'],
  protocolNormalizers: {
    node: id => isNodeBuiltin(id) ? id : false,
    data: () => true,
    file: url => url
  }
}

export async function isValidNodeImport (id: string, _opts: ValidNodeImportOptions = {}): Promise<boolean> {
  if (isNodeBuiltin(id)) {
    return true
  }

  const opts = { ...validNodeImportDefaults, ..._opts }

  const proto = getProtocol(id)
  if (proto && !opts.allowedProtocols.includes(proto)) {
    return false
  }

  if (proto && proto in opts.protocolNormalizers) {
    const result = opts.protocolNormalizers[proto]?.(id) || true
    if (typeof result !== 'string') {
      return result
    }
    id = result
  }

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
