import { realpathSync } from 'node:fs'
import { moduleResolve } from 'import-meta-resolve'
import { pathToFileURL } from 'node:url'
import { fileURLToPath, normalizeid } from './utils.mjs'
import { pcall, BUILTIN_MODULES } from './_utils.mjs'

const DEFAULT_CONDITIONS_SET = new Set(['node', 'import'])
const DEFAULT_URL = pathToFileURL(process.cwd())
const DEFAULT_EXTENSIONS = ['.mjs', '.cjs', '.js', '.json']
const NOT_FOUND_ERRORS = new Set(['ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT', 'MODULE_NOT_FOUND'])

function _tryModuleResolve (id, url, conditions) {
  try {
    return moduleResolve(id, url, conditions)
  } catch (err) {
    if (!NOT_FOUND_ERRORS.has(err.code)) {
      throw err
    }
    return null
  }
}

function _resolve (id, opts = {}) {
  // console.log('> resolve ', id, 'from', opts.url)

  // Skip if already has a protocol
  if (/(node|data|http|https):/.test(id)) {
    return id
  }

  // Skip builtins
  if (BUILTIN_MODULES.has(id)) {
    return 'node:' + id
  }

  // Defaults
  const conditionsSet = opts.conditions ? new Set(opts.conditions) : DEFAULT_CONDITIONS_SET
  const url = opts.url ? normalizeid(opts.url) : DEFAULT_URL

  // Try simple resolve
  let resolved = _tryModuleResolve(id, url, conditionsSet)

  // Try other extensions if not found
  if (!resolved) {
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
    const err = new Error(`Cannot find module ${id} imported from ${url}`)
    err.code = 'ERR_MODULE_NOT_FOUND'
    throw err
  }

  // Resolve realPath and normalize slash
  const realPath = realpathSync(fileURLToPath(resolved))
  return pathToFileURL(realPath).toString()
}

export function resolveSync (id, opts) {
  return _resolve(id, opts)
}

export function resolve (id, opts) {
  return pcall(resolveSync, id, opts)
}

export function resolvePathSync (id, opts) {
  return fileURLToPath(resolveSync(id, opts))
}

export function resolvePath (id, opts) {
  return pcall(resolvePathSync, id, opts)
}

export function createResolve (defaults) {
  return (id, url) => {
    return resolve(id, { url, ...defaults })
  }
}
