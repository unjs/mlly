import { isBuiltin } from 'mlly'
import { expect } from 'chai'

describe('isBuiltin', () => {
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
      expect(isBuiltin(id)).to.equal(cases[id])
    })
  }

  it('undefined', () => {
    expect(isBuiltin()).to.equal(false)
  })
})
