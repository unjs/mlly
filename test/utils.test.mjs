import { isNodeBuiltin } from 'mlly'
import { expect } from 'chai'

describe('isNodeBuiltin', () => {
  const cases = {
    fs: true,
    fake: false,
    'node:fs': true,
    'node:fake': false,
    'fs/promises': true,
    'fs/fake': true // invalid import
  }

  for (const id in cases) {
    it(`'${id}': ${cases[id]}`, () => {
      expect(isNodeBuiltin(id)).to.equal(cases[id])
    })
  }

  it('undefined', () => {
    expect(isNodeBuiltin()).to.equal(false)
  })
})
