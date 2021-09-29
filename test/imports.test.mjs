import { expect } from 'chai'
import { matchESMImports } from '../lib/index.mjs'

const tests = {
  'import defaultMember from "module-name";': { from: 'module-name', imports: [] },
  'import *    as name from "module-name  ";': { from: 'module-name', imports: [] },
  'import *    as name from "module-name  "; //test': { from: 'module-name', imports: [] },
  'import { member } from "  module-name";': { from: 'module-name', imports: [] },
  'import { member as alias } from "module-name";': { from: 'module-name', imports: [] },
  'import { member1, member2 as alias2, member3 as alias3 } from "module-name";': { from: 'module-name', imports: [] },
  'import { member1, /* member0point5, */ member2 as alias2, member3 as alias3 } from "module-name";': { from: 'module-name', imports: [] },
  'import defaultMember, { member, /* test */ member } from "module-name";': { from: 'module-name', imports: [] },
  'import defaultMember, * as name from "module-name";': { from: 'module-name', imports: [] },
  'import "module-name";': { from: 'module-name', imports: [] }
}

tests[`import {
  member1,
  // test
  member2
} from "module-name";`] = { from: 'module-name', imports: [] }

tests[`import {
  member1,

  member2
} from "module-name";`] = { from: 'module-name', imports: [] }

tests[`import {
  Component
} from '@angular2/core';`] = { from: '@angular2/core', imports: [] }

describe('matchESMImports', () => {
  for (const test in tests) {
    it(test.replace(/\n/g, '\\n'), () => {
      const matched = matchESMImports(test)
      expect(matched.length).to.equal(1)
      expect(matched[0].from).to.equal(tests[test].from)
      // expect(matched[0].imports).to.eql(tests[test].imports)
    })
  }
})
