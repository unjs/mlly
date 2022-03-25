import { existsSync, realpathSync } from 'fs'
import { pathToFileURL } from 'url'
import { isAbsolute } from 'pathe'
import { moduleResolve } from '../lib/import-meta-resolve'
import { fileURLToPath, normalizeid } from './utils'
import { pcall, BUILTIN_MODULES } from './_utils'

const DEFAULT_CONDITIONS_SET = new Set(['node', 'import'])
const DEFAULT_URL = pathToFileURL(process.cwd())
const DEFAULT_EXTENSIONS = ['.mjs', '.cjs', '.js', '.json']
const NOT_FOUND_ERRORS = new Set(['ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT', 'MODULE_NOT_FOUND'])

export interface ResolveOptions {
  url?: string | URL | (string | URL)[]
  extensions?: string[]
  conditions?: string[]
}

function _tryModuleResolve (id: string, url: URL, conditions: any): any | null {
  try {
    return moduleResolve(id, url, conditions)
  } catch (err) {
    if (!NOT_FOUND_ERRORS.has(err.code)) {
      throw err
    }
    return null
  }
}

function _resolve (id: string, opts: ResolveOptions = {}): string {
  // Skip if already has a protocol
  if (/(node|data|http|https):/.test(id)) {
    return id
  }

  // Skip builtins
  if (BUILTIN_MODULES.has(id)) {
    return 'node:' + id
  }

  // Skip resolve for absolute paths
  if (isAbsolute(id) && existsSync(id)) {
    // Resolve realPath and normalize slash
    const realPath = realpathSync(fileURLToPath(id))
    return pathToFileURL(realPath).toString()
  }

  // Condition set
  const conditionsSet = opts.conditions ? new Set(opts.conditions) : DEFAULT_CONDITIONS_SET

  // Search paths
  const _urls: URL[] = (Array.isArray(opts.url) ? opts.url : [opts.url])
    .filter(Boolean)
    .map(u => new URL(normalizeid(u.toString())))
  if (!_urls.length) {
    _urls.push(DEFAULT_URL)
  }
  const urls = [..._urls]
  // TODO: Consider pnp
  for (const url of _urls) {
    if (url.protocol === 'file:' && !url.pathname.includes('node_modules')) {
      const newURL = new URL(url)
      newURL.pathname += '/node_modules'
      urls.push(newURL)
    }
  }

  let resolved
  for (const url of urls) {
    // Try simple resolve
    resolved = _tryModuleResolve(id, url, conditionsSet)
    if (resolved) {
      break
    }
    // Try other extensions if not found
    for (const prefix of ['', '/index']) {
      for (const ext of opts.extensions || DEFAULT_EXTENSIONS) {
        resolved = _tryModuleResolve(id + prefix + ext, url, conditionsSet)
        if (resolved) { break }
      }
      if (resolved) { break }
    }
  }

  // Throw error if not found
  if (!resolved) {
    const err = new Error(`Cannot find module ${id} imported from ${urls.join(', ')}`)
    // @ts-ignore
    err.code = 'ERR_MODULE_NOT_FOUND'
    throw err
  }

  // Resolve realPath and normalize slash
  const realPath = realpathSync(fileURLToPath(resolved))
  return pathToFileURL(realPath).toString()
}

/**
 * @deprecated please use `resolve` instead of `resolveSync`
 */
export function resolveSync (id: string, opts?: ResolveOptions): string {
  return _resolve(id, opts)
}

export function resolve (id: string, opts?: ResolveOptions): Promise<string> {
  return pcall(resolveSync, id, opts)
}

/**
 * @deprecated please use `resolvePath` instead of `resolvePathSync`
 */
export function resolvePathSync (id: string, opts?: ResolveOptions) {
  return fileURLToPath(resolveSync(id, opts))
}

export function resolvePath (id: string, opts?: ResolveOptions) {
  return pcall(resolvePathSync, id, opts)
}

export function createResolve (defaults?: ResolveOptions) {
  return (id, url) => {
    return resolve(id, { url, ...defaults })
  }
}
