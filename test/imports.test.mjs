import { expect } from 'chai'
import { matchESMImports } from '../lib/index.mjs'

const tests = {
  'import defaultMember from "module-name";': {
    from: 'module-name',
    imports: {
      defaultImport: 'defaultMember',
      namespacedImport: undefined,
      namedImports: {}
    }
  },
  'import *    as name from "module-name  ";': {
    from: 'module-name',
    imports: {
      defaultImport: undefined,
      namespacedImport: 'name',
      namedImports: {}
    }
  },
  'import *    as name from "module-name  "; //test': {
    from: 'module-name',
    imports: {
      defaultImport: undefined,
      namespacedImport: 'name',
      namedImports: {}
    }
  },
  'import { member } from "  module-name";': {
    from: 'module-name',
    imports: {
      defaultImport: undefined,
      namespacedImport: undefined,
      namedImports: { member: 'member' }
    }
  },
  'import { member as alias } from "module-name";': {
    from: 'module-name',
    imports: {
      defaultImport: undefined,
      namespacedImport: undefined,
      namedImports: { member: 'alias' }
    }
  },
  'import { member1, member2 as alias2, member3 as alias3 } from "module-name";': {
    from: 'module-name',
    imports: {
      defaultImport: undefined,
      namespacedImport: undefined,
      namedImports: { member1: 'member1', member2: 'alias2', member3: 'alias3' }
    }
  },
  'import { member1, /* member0point5, */ member2 as alias2, member3 as alias3 } from "module-name";': {
    from: 'module-name',
    imports: {
      defaultImport: undefined,
      namespacedImport: undefined,
      namedImports: { member1: 'member1', member2: 'alias2', member3: 'alias3' }
    }
  },
  'import defaultMember, { member, /* test */ member } from "module-name";': {
    from: 'module-name',
    imports: {
      defaultImport: 'defaultMember',
      namespacedImport: undefined,
      namedImports: { member: 'member' }
    }
  },
  'import defaultMember, * as name from "module-name";': {
    from: 'module-name',
    imports: {
      defaultImport: 'defaultMember',
      namespacedImport: 'name',
      namedImports: {}
    }
  },
  'import "module-name";': {
    from: 'module-name',
    imports: {
      defaultImport: undefined,
      namespacedImport: undefined,
      namedImports: {}
    }
  }
}

tests[`import {
  member1,
  // test
  member2
} from "module-name";`] = {
  from: 'module-name',
  imports: {
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: { member1: 'member1', member2: 'member2' }
  }
}

tests[`import {
  member1,

  member2
} from "module-name";`] = {
  from: 'module-name',
  imports: {
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: { member1: 'member1', member2: 'member2' }
  }
}

tests[`import {
  Component
} from '@angular2/core';`] = {
  from: '@angular2/core',
  imports: {
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: { Component: 'Component' }
  }
}

describe('matchESMImports', () => {
  for (const test in tests) {
    it(test.replace(/\n/g, '\\n'), () => {
      const matched = matchESMImports(test)
      expect(matched.length).to.equal(1)
      expect(matched[0].from).to.equal(tests[test].from)
      expect(matched[0].imports).to.deep.equal(tests[test].imports)
    })
  }
})
