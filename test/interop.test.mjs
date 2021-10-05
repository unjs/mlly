import { expect } from 'chai'
import { interopDefault } from '../lib/index.mjs'

const tests = [
  [{}, {}],
  [{ default: {} }, {}],
  [{ default: { x: 2 } }, { x: 2 }],
  [{ named: 2 }, { named: 2 }],
  [{ named: 2, default: {} }, { named: 2 }],
  [{ named: 1, default: { x: 2 } }, { named: 1, x: 2 }]
]

describe('interopDefault', () => {
  for (const [input, result] of tests) {
    it(JSON.stringify(input), () => {
      const interop = interopDefault(input)
      expect(interop).to.deep.equal(result)
      if ('default' in input) {
        expect(interop.default).to.deep.equal(result)
      }
    })
  }
})
