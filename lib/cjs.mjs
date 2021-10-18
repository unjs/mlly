
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from './utils.mjs'

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
