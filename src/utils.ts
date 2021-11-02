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

// See https://github.com/rollup/rollup/blob/master/src/utils/sanitizeFileName.ts
export function sanitizeFilename (name: string = ''): string {
  const match = /^[a-z]:/i.exec(name)
  const driveLetter = match ? match[0] : ''

  // A `:` is only allowed as part of a windows drive letter (ex: C:\foo)
  // Otherwise, avoid them because they can refer to NTFS alternate data streams.
  return driveLetter + name.slice(driveLetter.length).replace(INVALID_CHAR_RE, '_')
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
