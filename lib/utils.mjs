
import { fileURLToPath as _fileURLToPath } from 'node:url'
import { promises as fsp } from 'node:fs'
import { normalizeSlash, BUILTIN_MODULES } from './_utils.mjs'

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
