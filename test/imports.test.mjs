import { expect } from 'chai'
import { findDynamicImports, findStaticImports, parseStaticImport } from '../lib/index.mjs'

// -- Static import --

const staticTests = {

  'import defaultMember from "module-name";': {
    specifier: 'module-name',
    type: 'static',
    defaultImport: 'defaultMember',
    namespacedImport: undefined,
    namedImports: {}
  },
  'import *    as name from "module-name  ";': {
    specifier: 'module-name',
    type: 'static',
    defaultImport: undefined,
    namespacedImport: 'name',
    namedImports: {}
  },
  'import *    as name from "module-name  "; //test': {
    specifier: 'module-name',
    type: 'static',
    defaultImport: undefined,
    namespacedImport: 'name',
    namedImports: {}
  },
  'import { member } from "  module-name";': {
    specifier: 'module-name',
    type: 'static',
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: { member: 'member' }
  },
  'import { member as alias } from "module-name";': {
    specifier: 'module-name',
    type: 'static',
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: { member: 'alias' }
  },
  'import { member1, member2 as alias2, member3 as alias3 } from "module-name";': {
    specifier: 'module-name',
    type: 'static',
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: { member1: 'member1', member2: 'alias2', member3: 'alias3' }
  },
  'import { member1, /* member0point5, */ member2 as alias2, member3 as alias3 } from "module-name";': {
    specifier: 'module-name',
    type: 'static',
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: { member1: 'member1', member2: 'alias2', member3: 'alias3' }
  },
  'import defaultMember, { member, /* test */ member } from "module-name";': {
    specifier: 'module-name',
    type: 'static',
    defaultImport: 'defaultMember',
    namespacedImport: undefined,
    namedImports: { member: 'member' }
  },
  'import defaultMember, * as name from "module-name";': {
    specifier: 'module-name',
    type: 'static',
    defaultImport: 'defaultMember',
    namespacedImport: 'name',
    namedImports: {}
  },
  'import "module-name";': {
    specifier: 'module-name',
    type: 'static',
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: {}
  }
}

staticTests[`import {
  member1,
  // test
  member2
} from "module-name";`] = {
  specifier: 'module-name',
  type: 'static',
  defaultImport: undefined,
  namespacedImport: undefined,
  namedImports: { member1: 'member1', member2: 'member2' }
}

staticTests[`import {
  member1,

  member2
} from "module-name";`] = {
  specifier: 'module-name',
  type: 'static',
  defaultImport: undefined,
  namespacedImport: undefined,
  namedImports: { member1: 'member1', member2: 'member2' }
}

staticTests[`import {
  Component
} from '@angular2/core';`] = {
  specifier: '@angular2/core',
  type: 'static',
  defaultImport: undefined,
  namespacedImport: undefined,
  namedImports: { Component: 'Component' }
}

// -- Dynamic import --
const dynamicTests = {
  'const { test, /* here */, another, } = await import ( "module-name" );': {
    expression: '"module-name"',
    type: 'dynamic',
    defaultImport: undefined,
    namespacedImport: undefined,
    namedImports: {
      test: 'test',
      another: 'another'
    }
  },
  'var promise = import ( "module-name" );': {
    expression: '"module-name"',
    type: 'dynamic',
    defaultImport: 'promise',
    namespacedImport: undefined,
    namedImports: {}
  }
}

describe('findStaticImports', () => {
  for (const [input, test] of Object.entries(staticTests)) {
    it(input.replace(/\n/g, '\\n'), () => {
      const matches = findStaticImports(input)
      expect(matches.length).to.equal(1)

      const match = matches[0]
      expect(match.type).to.equal('static')

      expect(match.specifier).to.equal(test.specifier)

      const parsed = parseStaticImport(match)
      expect(parsed.defaultImport).to.equals(test.defaultImport)
      expect(parsed.namedImports).to.eql(test.namedImports)
      expect(parsed.namespacedImport).to.eql(test.namespacedImport)
    })
  }
})

describe('findDynamicImports', () => {
  for (const [input, test] of Object.entries(dynamicTests)) {
    it(input.replace(/\n/g, '\\n'), () => {
      const matches = findDynamicImports(input)
      expect(matches.length).to.equal(1)
      const match = matches[0]
      expect(match.type).to.equal('dynamic')
      expect(match.expression.trim()).to.equal(test.expression)
    })
  }
})
