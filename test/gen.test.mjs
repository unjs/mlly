import { expect } from 'chai'
import { genImport, genDynamicImport } from 'mlly'

const genImportTests = [
  { imports: 'foo', code: 'import { foo } from "pkg"' },
  { imports: { name: 'foo', as: 'bar' }, code: 'import { foo as bar } from "pkg"' },
  { imports: { name: 'default', as: 'Test' }, code: 'import { default as Test } from "pkg"' }
]

describe('genImport', () => {
  for (const t of genImportTests) {
    it(t.code, () => {
      const code = genImport(t.specifier || 'pkg', t.imports || 'default', t.opts)
      expect(code).to.equal(t.code)
    })
  }
})

const genDynamicImportTests = [
  { code: '() => import("pkg")' },
  { opts: { wrapper: false }, code: 'import("pkg")' },
  { opts: { interopDefault: true }, code: '() => import("pkg").then(m => m.default || m)' },
  {
    opts: { comment: 'webpackChunkName: "chunks/dynamic"' },
    code: '() => import("pkg" /* webpackChunkName: "chunks/dynamic" */)'
  }
]

describe('genDynamicImport', () => {
  for (const t of genDynamicImportTests) {
    it(t.code, () => {
      const code = genDynamicImport(t.specifier || 'pkg', t.opts)
      expect(code).to.equal(t.code)
    })
  }
})
