import { fileURLToPath as _fileURLToPath } from 'url'
import { promises as fsp } from 'fs'
import { normalizeSlash, BUILTIN_MODULES } from './_utils'

export function fileURLToPath (id: string): string {
  if (typeof id === 'string' && !id.startsWith('file://')) {
    return normalizeSlash(id)
  }
  return normalizeSlash(_fileURLToPath(id))
}

const ProtocolRegex = /^(?<proto>.+):.+$/

export function getProtocol (id: string): string | null {
  const proto = id.match(ProtocolRegex)
  return proto ? proto.groups.proto : null
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
