import { expect } from 'chai'
import { matchESMImports } from '../lib/index.mjs'

const tests = {
  'import defaultMember from "module-name";': {
    from: 'module-name',
    type: 'static',
    defaultImport: 'defaultMember',
    namespacedImport: undefined,
    namedImports: {}
  },
  'import *    as name from "module-name  ";': {
    from: 'module-name',
    type: 'static',
    defaultImport: undefined,
    namespacedImport: 'name',
    namedImports: {}
  },
  'import *    as name from "module-name  "; //test': {
    from: 'module-name',
    type: 'static',
    defaultImport: undefined,
    namespacedImport: 'name',
    namedImports: {}
  },
  'import { member } from "  module-name";': {
    from: 'module-name',
    type: 'static',
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: { member: 'member' }
  },
  'import { member as alias } from "module-name";': {
    from: 'module-name',
    type: 'static',
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: { member: 'alias' }
  },
  'import { member1, member2 as alias2, member3 as alias3 } from "module-name";': {
    from: 'module-name',
    type: 'static',
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: { member1: 'member1', member2: 'alias2', member3: 'alias3' }
  },
  'import { member1, /* member0point5, */ member2 as alias2, member3 as alias3 } from "module-name";': {
    from: 'module-name',
    type: 'static',
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: { member1: 'member1', member2: 'alias2', member3: 'alias3' }
  },
  'import defaultMember, { member, /* test */ member } from "module-name";': {
    from: 'module-name',
    type: 'static',
    defaultImport: 'defaultMember',
    namespacedImport: undefined,
    namedImports: { member: 'member' }
  },
  'import defaultMember, * as name from "module-name";': {
    from: 'module-name',
    type: 'static',
    defaultImport: 'defaultMember',
    namespacedImport: 'name',
    namedImports: {}
  },
  'import "module-name";': {
    from: 'module-name',
    type: 'static',
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: {}
  },
  'import Foo, { type Baz, bar, type Type as RenamedType } from "module-name";': {
    from: 'module-name',
    type: 'static',
    defaultImport: 'Foo',
    namespacedImport: undefined,
    namedImports: { bar: 'bar' }
  },
  'import type { Type } from "module-name";': {
    from: 'module-name',
    type: 'type'
  },
  'import Foo, type { Type } from "module-name";': {
    from: 'module-name',
    type: 'static',
    defaultImport: 'Foo',
    namespacedImport: undefined,
    namedImports: {}
  },
  'const { test, /* here */, another, } = await import ( "module-name" );': {
    from: 'module-name',
    type: 'dynamic',
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: {
      test: 'test',
      another: 'another'
    }
  },
  'var promise = import ( "module-name" );': {
    from: 'module-name',
    type: 'dynamic',
    defaultImport: 'promise',
    namespacedImport: undefined,
    namedImports: {}
  }
}

tests[`import {
  member1,
  // test
  member2
} from "module-name";`] = {
  from: 'module-name',
  type: 'static',
  defaultImport: undefined,
  namespacedImport: undefined,
  namedImports: { member1: 'member1', member2: 'member2' }
}

tests[`import {
  member1,

  member2
} from "module-name";`] = {
  from: 'module-name',
  type: 'static',
  defaultImport: undefined,
  namespacedImport: undefined,
  namedImports: { member1: 'member1', member2: 'member2' }
}

tests[`import {
  Component
} from '@angular2/core';`] = {
  from: '@angular2/core',
  type: 'static',
  defaultImport: undefined,
  namespacedImport: undefined,
  namedImports: { Component: 'Component' }
}

describe('matchESMImports', () => {
  for (const test in tests) {
    it(test.replace(/\n/g, '\\n'), () => {
      const matched = matchESMImports(test).filter(details => !details.isType)
      expect(matched.length).to.equal(1)
      delete matched[0].code
      delete matched[0].location
      delete matched[0].imports
      expect(matched[0]).to.deep.equal(tests[test])
    })
  }
})
