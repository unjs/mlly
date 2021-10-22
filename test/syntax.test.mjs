import { expect } from 'chai'
import { detectSyntax } from 'mlly'

const staticTests = {
  'import defaultMember from "module-name";': 'esm',
  'import"module-name  ";': 'esm',
  'export default b=""': 'esm',
  'import "./file.mjs"': 'esm',
  'exports.c={}': 'cjs',
  'const b=true;module.exports={b};': 'cjs',
  'import"module-name";module.exports={};': 'mixed',
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
