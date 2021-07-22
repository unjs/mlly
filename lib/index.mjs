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
const DEFAULT_PARENT = process.cwd()

function _resolve (specifier, parent = DEFAULT_PARENT, conditions) {
  if (/(node|data|http|https):/.test(specifier)) {
    return specifier
  }
  const conditionsSet = conditions ? new Set(conditions) : DEFAULT_CONDITIONS_SET
  const resolved = moduleResolve(specifier, parent, conditionsSet)
  const realPath = realpathSync(fileURLToPath(resolved))
  return realPath
}

function _pcall (fn, ...args) {
  try {
    return fn(...args)
  } catch (err) {
    Error.captureStackTrace(_pcall, err)
    return Promise.reject(err)
  }
}

export function resolveSync (specifier, parent, conditions) {
  return pathToFileURL(_resolve(specifier, parent, conditions)).toString()
}

export function resolve (specifier, parent, conditions) {
  return _pcall(resolveSync, specifier, parent, conditions)
}

export function resolvePathSync (specifier, parent, conditions) {
  return fileURLToPath(resolveSync(specifier, parent, conditions))
}

export function resolvePath (specifier, parent, conditions) {
  return _pcall(resolvePathSync, specifier, parent, conditions)
}

export function createResolve (importMeta) {
  const defaultParent = typeof importMeta === 'string' ? importMeta : importMeta.url
  return (specifier, parent = defaultParent) => {
    return resolve(specifier, parent)
  }
}
