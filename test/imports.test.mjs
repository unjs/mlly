import { expect } from 'chai'
import { matchESMImports } from '../lib/index.mjs'

const tests = [
  'import defaultMember from "module-name";',
  'import *    as name from "module-name  ";',
  'import *    as name from "module-name  "; //test',
  'import { member } from "  module-name";',
  'import { member as alias } from "module-name";',
  'import { member1, member2 as alias2, member3 as alias3 } from "module-name";',
  'import { member1, /* member0point5, */ member2 as alias2, member3 as alias3 } from "module-name";',
  'import defaultMember, { member, /* test */ member } from "module-name";',
  'import defaultMember, * as name from "module-name";',
  'import "module-name";',
`import {
  member1,
  // test
  member2
} from "module-name";`,
`import {
  member1,

  member2
} from "module-name";
`, `import {
  Component
} from '@angular2/core';`
]

describe('matchESMImports', () => {
  for (const test of tests) {
    it(test, () => {
      const matched = matchESMImports(test)
      expect(matched.length).to.equal(1)
    })
  }
})
