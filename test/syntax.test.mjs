import { expect, AssertionError } from 'chai'
import { detectSyntax, isValidNodeImport } from 'mlly'
import { join } from 'pathe'

const staticTests = {
  // ESM
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#syntax
  'import defaultExport from "module-name";': { hasESM: true, hasCJS: false, isMixed: false },
  'import * as name from "module-name";': { hasESM: true, hasCJS: false, isMixed: false },
  'import { export1 } from "module-name";': { hasESM: true, hasCJS: false, isMixed: false },
  'import { export1 as alias1 } from "module-name";': { hasESM: true, hasCJS: false, isMixed: false },
  'import { export1, export2 } from "module-name";': { hasESM: true, hasCJS: false, isMixed: false },
  'import { export1, export2 as alias2, export3 } from "module-name";': { hasESM: true, hasCJS: false, isMixed: false },
  'import defaultExport, { export1, export2 } from "module-name";': { hasESM: true, hasCJS: false, isMixed: false },
  'import defaultExport, * as name from"module-name";': { hasESM: true, hasCJS: false, isMixed: false },
  'import"module-name"': { hasESM: true, hasCJS: false, isMixed: false },
  'import defaultMember from "module-name";': { hasESM: true, hasCJS: false, isMixed: false },
  'import "./file.mjs"': { hasESM: true, hasCJS: false, isMixed: false },
  'export default b=""': { hasESM: true, hasCJS: false, isMixed: false },
  'export const a = 1': { hasESM: true, hasCJS: false, isMixed: false },
  'export function hi() {}': { hasESM: true, hasCJS: false, isMixed: false },
  'export async function foo() {}': { hasESM: true, hasCJS: false, isMixed: false },
  // CJS
  'exports.c={}': { hasESM: false, hasCJS: true, isMixed: false },
  'const b=true;module.exports={b};': { hasESM: false, hasCJS: true, isMixed: false },
  // Mixed
  'import"module-name";module.exports={};': { hasESM: true, hasCJS: true, isMixed: true },
  // No clues
  'import("./file.mjs")': { hasESM: false, hasCJS: false, isMixed: false },
  'console.log(process.version)': { hasESM: false, hasCJS: false, isMixed: false },
  'const a={};': { hasESM: false, hasCJS: false, isMixed: false }
}

describe('detectSyntax', () => {
  for (const [input, result] of Object.entries(staticTests)) {
    it(input, () => {
      expect(detectSyntax(input)).to.deep.equal(result)
    })
  }
})

const nodeImportTests = {
  [import.meta.url]: true,
  'node:fs': true,
  fs: true,
  'fs/promises': true,
  'node:fs/promises': true,
  // We can't detect these are invalid node imports
  'fs/fake': true,
  'node:fs/fake': true,
  vue: 'error',
  [join(import.meta.url, '../invalid')]: 'error',
  'data:text/javascript,console.log("hello!");': true,
  [join(import.meta.url, '../fixture/imports/cjs')]: true,
  [join(import.meta.url, '../fixture/imports/esm')]: true,
  [join(import.meta.url, '../fixture/imports/esm-module')]: true,
  [join(import.meta.url, '../fixture/imports/js-cjs')]: true,
  [join(import.meta.url, '../fixture/imports/js-esm')]: false
}

describe('isValidNodeImport', () => {
  for (const [input, result] of Object.entries(nodeImportTests)) {
    it(input, async () => {
      try {
        expect(await isValidNodeImport(input)).to.equal(result)
      } catch (e) {
        if (e instanceof AssertionError) {
          throw e
        }
        expect(result).to.equal('error')
      }
    })
  }
})
