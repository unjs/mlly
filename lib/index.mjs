import { fileURLToPath as _fileURLToPath, pathToFileURL } from 'url'
import { dirname } from 'path'
import { realpathSync, promises as fsp } from 'fs'
import { createRequire, builtinModules } from 'module'
import { moduleResolve } from 'import-meta-resolve'

// CommonJS

export function createCommonJS (url) {
  const __filename = fileURLToPath(url)
  const __dirname = dirname(__filename)

  // Lazy require
  let _nativeRequire
  const getNativeRequire = () => _nativeRequire || (_nativeRequire = createRequire(url))
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
const BUILTIN_MODULES = new Set(builtinModules)
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
  return _pcall(resolveSync, id, opts)
}

export function resolvePathSync (id, opts) {
  return fileURLToPath(resolveSync(id, opts))
}

export function resolvePath (id, opts) {
  return _pcall(resolvePathSync, id, opts)
}

export function createResolve (defaults) {
  return (id, url) => {
    return resolve(id, { url, ...defaults })
  }
}

export function interopDefault (sourceModule) {
  if (!(sourceModule && 'default' in sourceModule)) {
    return sourceModule
  }
  const newModule = sourceModule.default
  for (const key in sourceModule) {
    if (key === 'default') {
      try {
        Object.defineProperty(newModule, key, {
          enumerable: false,
          configurable: false,
          get () { return newModule }
        })
      } catch (_err) {}
    } else {
      try {
        Object.defineProperty(newModule, key, {
          enumerable: true,
          configurable: true,
          get () { return sourceModule[key] }
        })
      } catch (_err) {}
    }
  }
  return newModule
}

// Evaluate

// TODO: Migrate to new Regexes
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

// Import analyzes

export const ESM_STATIC_IMPORT_RE = /^(?<=\s*)import\s*(["'\s]*(?<imports>[\w*${}\n\r\t, /]+)from\s*)?["']\s*(?<specifier>.*[@\w_-]+)\s*["'][^\n]*$/gm
export const DYNAMIC_IMPORT_RE = /import\s*\((?<expression>(?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gm
const EXPORT_DECAL_RE = /\bexport\s+(?:function|let|const|var)\s+([\w$_]+)/g
const OBJECT_EXPORT_RE = /\bexport\s+{([^}]+)}/g
const AS_RENAME_RE = /^.*?\sas\s/
const IDENTIFIER_RE = /^[\w$_]+$/

function _matchAll (regex, string, addition) {
  const matches = []
  for (const match of string.matchAll(regex)) {
    matches.push({
      ...addition,
      ...match.groups,
      code: match[0],
      start: match.index,
      end: match.index + match[0].length
    })
  }
  return matches
}

export function findStaticImports (code) {
  return _matchAll(ESM_STATIC_IMPORT_RE, code, { type: 'static' })
}

export function findDynamicImports (code) {
  return _matchAll(DYNAMIC_IMPORT_RE, code, { type: 'dynamic' })
}

export function parseStaticImport (matched) {
  const cleanedImports = (matched.imports || '')
    .replace(/(\/\/[^\n]*\n|\/\*.*\*\/)/g, '')
    .replace(/\s+/g, ' ')

  const namedImports = {}
  for (const namedImport of cleanedImports.match(/\{([^}]*)\}/)?.[1]?.split(',') || []) {
    const [, source = namedImport.trim(), importName = source] = namedImport.match(/^\s*([^\s]*) as ([^\s]*)\s*$/) || []
    if (source) {
      namedImports[source] = importName
    }
  }
  const topLevelImports = cleanedImports.replace(/\{([^}]*)\}/, '')
  const namespacedImport = topLevelImports.match(/\* as \s*([^\s]*)/)?.[1]
  const defaultImport = topLevelImports.split(',').find(i => !i.match(/[*{}]/))?.trim() || undefined

  return {
    ...matched,
    defaultImport,
    namespacedImport,
    namedImports
  }
}

export function findNamedExports (code) {
  const nameExports = new Set()

  Array.from(code.matchAll(EXPORT_DECAL_RE))
    .forEach(([, name]) => nameExports.add(name))

  Array.from(code.matchAll(OBJECT_EXPORT_RE))
    .forEach(([, body]) => {
      body.split(/,/g)
        .map(name => name.replace(AS_RENAME_RE, '').trim())
        .filter(name => IDENTIFIER_RE.test(name))
        .forEach(name => nameExports.add(name))
    })

  return Array.from(nameExports)
}

// Utils

export function fileURLToPath (id) {
  if (typeof id === 'string' && !id.startsWith('file://')) {
    return normalizeSlash(id)
  }
  return normalizeSlash(_fileURLToPath(id))
}

export function normalizeid (id) {
  if (typeof id !== 'string') {
    id = id.toString()
  }
  if (/(node|data|http|https|file):/.test(id)) {
    return id
  }
  if (BUILTIN_MODULES.has(id)) {
    return 'node:' + id
  }
  return 'file://' + normalizeSlash(id)
}

export async function loadURL (url) {
  const code = await fsp.readFile(fileURLToPath(url), 'utf-8')
  return code
}

export function toDataURL (code) {
  const base64 = Buffer.from(code).toString('base64')
  return `data:text/javascript;base64,${base64}`
}

function normalizeSlash (str) {
  return str.replace(/\\/g, '/')
}

function _pcall (fn, ...args) {
  try {
    return Promise.resolve(fn(...args)).catch(err => _perr(err))
  } catch (err) {
    return _perr(err)
  }
}

function _perr (_err) {
  const err = new Error(_err)
  err.code = _err.code
  Error.captureStackTrace(err, _pcall)
  return Promise.reject(err)
}
