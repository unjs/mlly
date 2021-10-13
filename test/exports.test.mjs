import { expect } from 'chai'
import { findNamedExports } from '../lib/index.mjs'

describe('findNamedExports', () => {
  const fixture = `
export function useA () {
  return 'a'
}
function useB () {
  return 'b'
}
function _useC () {
  return 'c'
}
export const useD = () => {
  return 'd'
}
export { useB, _useC as useC }
`
  it('should extract name exports', () => {
    expect(findNamedExports(fixture).sort()).to.eql(['useA', 'useB', 'useC', 'useD'])
  })
})
