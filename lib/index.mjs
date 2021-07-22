import { fileURLToPath as _fileURLToPath, pathToFileURL } from 'url'
import { dirname } from 'path'
import { realpathSync } from 'fs'
import { createRequire } from 'module'
import { moduleResolve } from 'import-meta-resolve'

// Utils

export function fileURLToPath (path) {
  return _fileURLToPath(path).replace(/\\/g, '/')
}

// CommonJS

export function createCommonJS (importMeta) {
  const __filename = fileURLToPath(importMeta.url)
  const __dirname = dirname(__filename)

  // Lazy require
  let _nativeRequire
  const getNativeRequire = () => _nativeRequire || (_nativeRequire = createRequire(importMeta.url))
  function require (specifier) { return getNativeRequire()(specifier) }
  require.resolve = (specifier, options) => getNativeRequire().resolve(specifier, options)

  return {
    __filename,
    __dirname,
    require
  }
}

// Resolve

const DEFAULT_CONDITIONS = Object.freeze(['node', 'import'])
const DEFAULT_CONDITIONS_SET = new Set(DEFAULT_CONDITIONS)

function _resolve (specifier, opts = {}) {
  if (/(node|data|http|https):/.test(specifier)) {
    return specifier
  }
  const conditions = opts.conditions ? new Set(opts.conditions) : DEFAULT_CONDITIONS_SET
  const resolved = moduleResolve(specifier, opts.parent, conditions)
  const realPath = realpathSync(fileURLToPath(resolved))
  return realPath
}

function _pcall (fn, ...args) {
  try {
    return fn(...args)
  } catch (err) {
    return Promise.reject(err)
  }
}

export function resolveSync (specifier, opts = {}) {
  return pathToFileURL(_resolve(specifier, opts)).toString()
}

export function resolve (specifier, opts = {}) {
  return _pcall(resolveSync, specifier, opts)
}

export function resolvePathSync (specifier, opts = {}) {
  return fileURLToPath(resolveSync(specifier, opts))
}

export function resolvePath (specifier, opts = {}) {
  return _pcall(resolvePathSync, specifier, opts)
}

export function createResolve (importMeta) {
  return (specifier, parent = importMeta.url) => {
    return resolve(specifier, { parent })
  }
}
