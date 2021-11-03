import { fileURLToPath as _fileURLToPath } from 'url'
import { promises as fsp } from 'fs'
import { normalizeSlash, BUILTIN_MODULES } from './_utils'

export function fileURLToPath (id: string): string {
  if (typeof id === 'string' && !id.startsWith('file://')) {
    return normalizeSlash(id)
  }
  return normalizeSlash(_fileURLToPath(id))
}

// https://datatracker.ietf.org/doc/html/rfc2396
// eslint-disable-next-line no-control-regex
const INVALID_CHAR_RE = /[?*:\x00-\x1F\x7F<>#"{}|^[\]`]/g

export function sanitizeURIComponent (name: string = ''): string {
  return name.replace(INVALID_CHAR_RE, '_')
}

export function sanitizeFilePath (filePath: string = '') {
  return filePath.split(/[/\\]/g).map(p => sanitizeURIComponent(p)).join('/')
    .replace(/^([a-zA-Z])_\//, '$1:/')
}

export function normalizeid (id: string): string {
  if (typeof id !== 'string') {
    // @ts-ignore
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

export async function loadURL (url: string): Promise<string> {
  const code = await fsp.readFile(fileURLToPath(url), 'utf-8')
  return code
}

export function toDataURL (code: string): string {
  const base64 = Buffer.from(code).toString('base64')
  return `data:text/javascript;base64,${base64}`
}

export function isNodeBuiltin (id: string = '') {
  // node:fs/promises => fs
  id = id.replace(/^node:/, '').split('/')[0]
  return BUILTIN_MODULES.has(id)
}
