import { expect } from 'chai'
import { detectSyntax } from 'mlly'

const staticTests = {
  // ESM
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#syntax
  'import defaultExport from "module-name";': 'esm',
  'import * as name from "module-name";': 'esm',
  'import { export1 } from "module-name";': 'esm',
  'import { export1 as alias1 } from "module-name";': 'esm',
  'import { export1, export2 } from "module-name";': 'esm',
  'import { export1, export2 as alias2, export3 } from "module-name";': 'esm',
  'import defaultExport, { export1, export2 } from "module-name";': 'esm',
  'import defaultExport, * as name from"module-name";': 'esm',
  'import"module-name"': 'esm',
  //
  'import defaultMember from "module-name";': 'esm',
  'import "./file.mjs"': 'esm',
  'export default b=""': 'esm',
  // CJS
  'exports.c={}': 'cjs',
  'const b=true;module.exports={b};': 'cjs',
  // Mixed
  'import"module-name";module.exports={};': 'mixed',
  // No clues
  'import("./file.mjs")': 'unknown',
  'console.log(process.version)': 'unknown',
  'const a={};': 'unknown'
}

describe('detectSyntax', () => {
  for (const [input, result] of Object.entries(staticTests)) {
    it(input, () => {
      expect(detectSyntax(input)).to.equal(result)
    })
  }
})
