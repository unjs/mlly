import { isNodeBuiltin, sanitizeFilename } from 'mlly'
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

describe('sanitizeFilename', () => {
  const cases = {
    // [?*:\x00-\x1F\x7F<>#"{}|^[\]`]
    'C:/te#st/[...slug].jsx': 'C:/te_st/_...slug_.jsx',
    'C:\\te#st\\[...slug].jsx': 'C:\\te_st\\_...slug_.jsx',
    '/te#st/[...slug].jsx': '/te_st/_...slug_.jsx',
    '\0a?b*c:d\x7Fe<f>g#h"i{j}k|l^m[n]o`p.jsx': '_a_b_c_d_e_f_g_h_i_j_k_l_m_n_o_p.jsx',
    '': ''
  }
  for (const id in cases) {
    it(`'${id}': ${cases[id]}`, () => {
      expect(sanitizeFilename(id)).to.equal(cases[id])
    })
  }

  it('undefined', () => {
    expect(sanitizeFilename()).to.equal('')
  })
})
