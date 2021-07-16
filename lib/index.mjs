import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createRequire } from 'module'

export function createCommonJS (importMeta) {
  const __filename = fileURLToPath(importMeta.url).replace(/\\/g, '/')
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
