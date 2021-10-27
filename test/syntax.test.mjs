import { expect } from 'chai'
import { detectSyntax } from 'mlly'

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
  //
  'import defaultMember from "module-name";': { hasESM: true, hasCJS: false, isMixed: false },
  'import "./file.mjs"': { hasESM: true, hasCJS: false, isMixed: false },
  'export default b=""': { hasESM: true, hasCJS: false, isMixed: false },
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
