import { builtinModules } from 'node:module'

export const BUILTIN_MODULES = new Set(builtinModules)

export function normalizeSlash (str) {
  return str.replace(/\\/g, '/')
}

export function pcall (fn, ...args) {
  try {
    return Promise.resolve(fn(...args)).catch(err => perr(err))
  } catch (err) {
    return perr(err)
  }
}

export function perr (_err) {
  const err = new Error(_err)
  err.code = _err.code
  Error.captureStackTrace(err, pcall)
  return Promise.reject(err)
}

export function isObject (val) {
  return val !== null && typeof val === 'object'
}

export function matchAll (regex, string, addition) {
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
