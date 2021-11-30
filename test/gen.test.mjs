import { expect } from 'chai'
import { genImport, genExport, genDynamicImport } from 'mlly'

const genImportTests = [
  { names: 'foo', code: 'import foo from "pkg";' },
  { names: ['foo'], code: 'import { foo } from "pkg";' },
  { names: [{ name: 'foo', as: 'bar' }], code: 'import { foo as bar } from "pkg";' },
  { names: { name: '*', as: 'bar' }, code: 'import * as bar from "pkg";' },
  { names: [{ name: 'default', as: 'Test' }], code: 'import { default as Test } from "pkg";' }
]

describe('genImport', () => {
  for (const t of genImportTests) {
    it(t.code, () => {
      const code = genImport(t.specifier || 'pkg', t.names || 'default', t.opts)
      expect(code).to.equal(t.code)
    })
  }
})
Y
const genExportTests = [
  { names: 'foo', code: 'export foo from "pkg";' },
  { names: ['foo'], code: 'export { foo } from "pkg";' },
  { names: [{ name: 'foo', as: 'bar' }], code: 'export { foo as bar } from "pkg";' },
  { names: { name: '*', as: 'bar' }, code: 'export * as bar from "pkg";' },
  { names: ['default'], code: 'export { default } from "pkg";' }
]

describe('genExport', () => {
  for (const t of genExportTests) {
    it(t.code, () => {
      const code = genExport(t.specifier || 'pkg', t.names || 'default', t.opts)
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
