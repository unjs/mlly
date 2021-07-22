import { fileURLToPath as _fileURLToPath, pathToFileURL } from 'url'
import { dirname } from 'path'
import { realpathSync, promises as fsp } from 'fs'
import { createRequire, builtinModules } from 'module'
import { moduleResolve } from 'import-meta-resolve'

// CommonJS

export function createCommonJS (importMeta) {
  const __filename = fileURLToPath(importMeta.url)
  const __dirname = dirname(__filename)

  // Lazy require
  let _nativeRequire
  const getNativeRequire = () => _nativeRequire || (_nativeRequire = createRequire(importMeta.url))
  function require (id) { return getNativeRequire()(id) }
  require.resolve = (id, options) => getNativeRequire().resolve(id, options)

  return {
    __filename,
    __dirname,
    require
  }
}

// Resolve

const DEFAULT_CONDITIONS_SET = new Set(['node', 'import'])
const BUILُTIN_MODULES = new Set(builtinModules)
const DEFAULT_FROM = pathToFileURL(process.cwd())

function _resolve (id, opts = {}) {
  if (/(node|data|http|https):/.test(id)) {
    return id
  }
  if (BUILُTIN_MODULES.has(id)) {
    return 'node:' + id
  }
  const conditionsSet = opts.conditions ? new Set(opts.conditions) : DEFAULT_CONDITIONS_SET
  const resolved = moduleResolve(id, opts.from || DEFAULT_FROM, conditionsSet)
  const realPath = realpathSync(fileURLToPath(resolved))
  return pathToFileURL(realPath).toString()
}

export function resolveSync (id, opts) {
  return _resolve(id, opts)
}

export function resolve (id, opts) {
  return _pcall(resolveSync, id, opts)
}

export function resolvePathSync (id, opts) {
  return fileURLToPath(resolveSync(id, opts))
}

export function resolvePath (id, opts) {
  return _pcall(resolvePathSync, id, opts)
}

export function createResolve (defaults) {
  return (id, from) => {
    return resolve(id, { ...defaults, from: from || defaults.from })
  }
}

// Evaluate

const ESM_IMPORT_RE = /(?<=import .* from ['"])([^'"]+)(?=['"])|(?<=export .* from ['"])([^'"]+)(?=['"])|(?<=import\s*['"])([^'"]+)(?=['"])|(?<=import\s*\(['"])([^'"]+)(?=['"]\))/g

export async function loadModule (id, opts = {}) {
  const code = await readModule(id, opts)
  return evalModule(code, opts)
}

export async function evalModule (code, opts = {}) {
  return import(await toDataURL(code, opts))
}

export async function readModule (id, opts) {
  const resolved = await resolve(id, opts)
  const code = await fsp.readFile(fileURLToPath(resolved), 'utf-8')
  return code
}

export async function toDataURL (code, opts) {
  code = await resolveImports(code, opts)
  const base64 = Buffer.from(code).toString('base64')
  return `data:text/javascript;base64,${base64}`
}

export function resolveImports (code, opts) {
  // TODO: Reimplement with resolve (async replace)
  return Promise.resolve(code.replace(ESM_IMPORT_RE, id => resolveSync(id, opts)))
}

// Utils

export function fileURLToPath (id) {
  return _fileURLToPath(id).replace(/\\/g, '/')
}

function _pcall (fn, ...args) {
  try {
    return fn(...args)
  } catch (err) {
    Error.captureStackTrace(_pcall, err)
    return Promise.reject(err)
  }
}
