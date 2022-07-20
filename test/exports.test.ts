import { describe, it, expect } from 'vitest'
import { ESMExport, findExports } from '../src'

describe('findExports', () => {
  const tests: Record<string, Partial<ESMExport>> = {
    'export function useA () { return \'a\' }': { name: 'useA', type: 'declaration' },
    'export const useD = () => { return \'d\' }': { name: 'useD', type: 'declaration' },
    'export { useB, _useC as useC }': { names: ['useB', 'useC'], type: 'named' },
    'export default foo': { type: 'default', name: 'default', names: ['default'] },
    'export { default } from "./other"': { type: 'default', name: 'default', names: ['default'], specifier: './other' },
    'export { default , } from "./other"': { type: 'default', name: 'default', names: ['default'], specifier: './other' },
    'export async function foo ()': { type: 'declaration', names: ['foo'] },
    'export const $foo = () => {}': { type: 'declaration', names: ['$foo'] },
    'export { foo as default }': { type: 'default', name: 'default', names: ['default'] },
    'export * from "./other"': { type: 'star', specifier: './other' },
    'export * as foo from "./other"': { type: 'star', specifier: './other', name: 'foo' }
  }

  for (const [input, test] of Object.entries(tests)) {
    it(input.replace(/\n/g, '\\n'), () => {
      const matches = findExports(input)
      expect(matches.length).toEqual(1)
      const match = matches[0]
      if (test.type) {
        expect(match.type).toEqual(test.type)
      }
      if (test.name) {
        expect(match.name).toEqual(test.name)
      }
      if (test.names) {
        expect(match.names).toEqual(test.names)
      }
      if (test.specifier) {
        expect(match.specifier).toEqual(test.specifier)
      }
    })
  }
  it('handles multiple exports', () => {
    const matches = findExports(`
        export { useTestMe1 } from "@/test/foo1";
        export { useTestMe2 } from "@/test/foo2";
        export { useTestMe3 } from "@/test/foo3";
      `)
    expect(matches.length).to.eql(3)
  })

  it('works with multiple named exports', () => {
    const code = `
export { foo } from 'foo1';
export { bar } from 'foo2';
export { foobar } from 'foo2';
`
    const matches = findExports(code)
    expect(matches).to.have.lengthOf(3)
  })
})
