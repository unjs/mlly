import { describe, it, expect } from "vitest";
import {
  findDynamicImports,
  findStaticImports,
  parseStaticImport,
} from "../src";

// -- Static import --

const staticTests = {
  'import defaultMember from "module-name";': {
    specifier: "module-name",
    defaultImport: "defaultMember",
  },
  'import *    as name from "module-name  ";': {
    specifier: "module-name",
    namespacedImport: "name",
  },
  'import *    as name from "module-name  "; //test': {
    specifier: "module-name",
    namespacedImport: "name",
  },
  'import { member } from "  module-name";': {
    specifier: "module-name",
    namedImports: { member: "member" },
  },
  'import { member as alias } from "module-name";': {
    specifier: "module-name",
    namedImports: { member: "alias" },
  },
  'import { member1, member2 as alias2, member3 as alias3 } from "module-name";':
    {
      specifier: "module-name",
      namedImports: {
        member1: "member1",
        member2: "alias2",
        member3: "alias3",
      },
    },
  'import { member1, /* member0point5, */ member2 as alias2, member3 as alias3 } from "module-name";':
    {
      specifier: "module-name",
      namedImports: {
        member1: "member1",
        member2: "alias2",
        member3: "alias3",
      },
    },
  'import defaultMember, { member, /* test */ member } from "module-name";': {
    specifier: "module-name",
    defaultImport: "defaultMember",
    namedImports: { member: "member" },
  },
  'import defaultMember, * as name from "module-name";': {
    specifier: "module-name",
    defaultImport: "defaultMember",
    namespacedImport: "name",
  },
  'import "module-name";': {
    specifier: "module-name",
  },
  'import { thing } from "module-name";import { other } from "other-module"': [
    {
      specifier: "module-name",
      namedImports: { thing: "thing" },
    },
    {
      specifier: "other-module",
      namedImports: { other: "other" },
    },
  ],
  // Edge cases
  '"import"===node.object.meta.name&&"': [],
};

staticTests[
  `
Object.freeze(['node', 'import'])
const a = 123

const b = new Set(['node', 'import'])
const c = ['.mjs', '.cjs', '.js', '.json']
`
] = [];

staticTests[
  `import {
  member1,
  // test
  member2
} from "module-name";`
] = {
  specifier: "module-name",
  namedImports: { member1: "member1", member2: "member2" },
};

staticTests[
  `import {
  member1,

  member2
} from "module-name";`
] = {
  specifier: "module-name",
  namedImports: { member1: "member1", member2: "member2" },
};

staticTests[
  `import {
  Component
} from '@angular2/core';`
] = {
  specifier: "@angular2/core",
  type: "static",
  namedImports: { Component: "Component" },
};

staticTests['import { foo, type Foo } from "foo"'] = {
  specifier: "foo",
  namedImports: { foo: "foo" },
};

// -- Dynamic import --
const dynamicTests = {
  'const { test, /* here */, another, } = await import ( "module-name" );': {
    expression: '"module-name"',
  },
  'var promise = import ( "module-name" );': {
    expression: '"module-name"',
  },
  'import ( "module-name" );': {
    expression: '"module-name"',
  },
  'import(foo("123"))': {
    expression: 'foo("123")',
  },
  'import("abc").then(r => r.default)': {
    expression: '"abc"',
  },
};

describe("findStaticImports", () => {
  for (const [input, _results] of Object.entries(staticTests)) {
    it(input.replace(/\n/g, "\\n"), () => {
      const matches = findStaticImports(input);
      const results = Array.isArray(_results) ? _results : [_results];
      expect(matches.length).toEqual(results.length);
      for (const [index, test] of results.entries()) {
        const match = matches[index];
        expect(match.type).to.equal("static");

        expect(match.specifier).to.equal(test.specifier);

        const parsed = parseStaticImport(match);
        if (test.defaultImport) {
          expect(parsed.defaultImport).to.equals(test.defaultImport);
        }
        if (test.namedImports) {
          expect(parsed.namedImports).to.eql(test.namedImports);
        }
        if (test.namespacedImport) {
          expect(parsed.namespacedImport).to.eql(test.namespacedImport);
        }
      }
    });
  }
});

describe("findDynamicImports", () => {
  for (const [input, test] of Object.entries(dynamicTests)) {
    it(input.replace(/\n/g, "\\n"), () => {
      const matches = findDynamicImports(input);
      expect(matches.length).to.equal(1);
      const match = matches[0];
      expect(match.type).to.equal("dynamic");
      expect(match.expression.trim()).to.equal(test.expression);
    });
  }
});
