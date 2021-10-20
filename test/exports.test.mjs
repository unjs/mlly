import { expect } from 'chai'
import { findExports } from 'mlly'

describe('findExports', () => {
  const tests = {
    'export function useA () { return \'a\' }': { name: 'useA', type: 'declaration' },
    'export const useD = () => { return \'d\' }': { name: 'useD', type: 'declaration' },
    'export { useB, _useC as useC }': { names: ['useB', 'useC'], type: 'named' },
    'export default foo': { type: 'default' }
  }

  describe('findExports', () => {
    for (const [input, test] of Object.entries(tests)) {
      it(input.replace(/\n/g, '\\n'), () => {
        const matches = findExports(input)
        expect(matches.length).to.equal(1)
        const match = matches[0]
        if (test.type) {
          expect(match.type).to.eql(test.type)
        }
        if (test.name) {
          expect(match.name).to.eql(test.name)
        }
        if (test.names) {
          expect(match.names).to.deep.eql(test.names)
        }
      })
    }
  })
})
