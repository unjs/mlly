import { describe, it, expect } from "vitest";
import {
  findDynamicImports,
  findStaticImports,
  parseStaticImport,
  findTypeImports,
  parseTypeImport,
} from "../src";

// -- Static import --

type MaybeArray<T> = T | T[];
const staticTests: Record<
  string,
  MaybeArray<{
    specifier: string;
    defaultImport?: string;
    namespacedImport?: string;
    namedImports?: Record<string, string>;
    type?: string;
  }>
> = {
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
  'import { memberFormattedWithPrettier, } from "module-name";': {
    specifier: "module-name",
    namedImports: {
      memberFormattedWithPrettier: "memberFormattedWithPrettier",
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
  'import { SpecialÜ } from "#components"': [
    {
      namedImports: { SpecialÜ: "SpecialÜ" },
      specifier: "#components",
    },
  ],
  'import type { foo } from "bar"': [
    {
      type: "static",
      defaultImport: "type",
      namedImports: { foo: "foo" },
      specifier: "bar",
    },
  ],
  "function a(){}import baz, { x, y as z } from 'baz'": [
    {
      defaultImport: "baz",
      namedImports: { x: "x", y: "z" },
      specifier: "baz",
    },
  ],
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
  // @hello.123
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

staticTests[
  `
  // import { foo } from "foo"
  import { too } from "too"

  /**
   * import { zoo } from "zoo"
   */

  const start = '/*'
  import { ioo } from "ioo"
  const end = '*/'
`
] = [
  {
    specifier: "too",
    type: "static",
    namedImports: { too: "too" },
  },
  {
    specifier: "ioo",
    type: "static",
    namedImports: { ioo: "ioo" },
  },
];

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
  '// import("abc").then(r => r.default)': [],
  '/* import("abc").then(r => r.default) */': [],
} as const;

const TypeTests = {
  'import { type Foo, Bar } from "module-name";': {
    specifier: "module-name",
    namedImports: {
      Foo: "Foo",
    },
    type: "static",
  },
  'import { member,/* hello */  type Foo as Baz, Bar } from "module-name";': {
    specifier: "module-name",
    namedImports: {
      Foo: "Baz",
    },
    type: "static",
  },
  'import type { Foo, Bar } from "module-name";': {
    specifier: "module-name",
    namedImports: {
      Foo: "Foo",
      Bar: "Bar",
    },
    type: "type",
  },
  'import type Foo from "module-name";': {
    specifier: "module-name",
    defaultImport: "Foo",
    type: "type",
  },
  'import type { Foo as Baz, Bar } from "module-name";': {
    specifier: "module-name",
    namedImports: {
      Foo: "Baz",
      Bar: "Bar",
    },
    type: "type",
  },
  'import { type member } from "  module-name";': {
    specifier: "module-name",
    namedImports: { member: "member" },
    type: "static",
  },
  'import { type member, type Foo as Bar } from "  module-name";': {
    specifier: "module-name",
    namedImports: {
      member: "member",
      Foo: "Bar",
    },
    type: "static",
  },
};

describe("findStaticImports", () => {
  for (const [input, _results] of Object.entries(staticTests)) {
    it(input.replace(/\n/g, String.raw`\n`), () => {
      const matches = findStaticImports(input);
      const expected = Array.isArray(_results) ? _results : [_results];
      expect(matches.length).toEqual(expected.length);
      for (const [index, test] of expected.entries()) {
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

  it("ignores strings containing import keywords (#225)", () => {
    const code = `
// Examples of strings (backticks and single quote)
const a = \`// Empty comment\n import Nodes from "\\$\\{v\\}";\`
const b = '// Empty comment\n import myString from "module-string";'

// Code from "highlight.js" qml language
var main = {
  keyword: ' import',
  dn: '',
};
`;
    expect(findStaticImports(code)).toEqual([]);
  });

  it("preserves real static imports after strings containing import words", () => {
    const singleQuoteBeforeImport = `var main = {\n  keyword: ' import',\n};\nimport foo from 'bar';`;
    const matches1 = findStaticImports(singleQuoteBeforeImport);
    expect(matches1).toHaveLength(1);
    expect(matches1[0]).toMatchObject({
      type: "static",
      imports: "foo ",
      specifier: "bar",
      code: "import foo from 'bar';",
    });
    expect(
      singleQuoteBeforeImport.slice(matches1[0].start, matches1[0].end),
    ).toBe("import foo from 'bar';");
    expect(parseStaticImport(matches1[0]).defaultImport).toBe("foo");

    const noSemicolonBeforeImport = `const msg = "Please use import"\nimport foo from "bar"`;
    const matches2 = findStaticImports(noSemicolonBeforeImport);
    expect(matches2).toHaveLength(1);
    expect(matches2[0]).toMatchObject({
      type: "static",
      imports: "foo ",
      specifier: "bar",
      code: 'import foo from "bar"',
    });
    expect(parseStaticImport(matches2[0]).defaultImport).toBe("foo");
  });

  it("handles import.meta, member access, dynamic imports, and keyword specifiers", () => {
    const code = [
      "const url = import.meta.url",
      "const a = obj.import",
      "const b = obj?.import",
      "const c = obj.\n  import",
      'const d = import("dyn-mod")',
      'import { import as imp } from "pkg-a"',
      "import broken",
      'import { real } from "pkg-b"',
    ].join("\n");

    const matches = findStaticImports(code);
    expect(matches).toHaveLength(2);
    expect(parseStaticImport(matches[0])).toMatchObject({
      specifier: "pkg-a",
      namedImports: { import: "imp" },
    });
    expect(parseStaticImport(matches[1])).toMatchObject({
      specifier: "pkg-b",
      namedImports: { real: "real" },
    });
  });

  it("ignores strings, templates, comments, and regexes when acorn fallback scanner runs", () => {
    const tsAndJsxCode = [
      "#!/usr/bin/env node",
      'import { type Config } from "./config";',
      "// import fakeComment from 'comment'",
      "/* import fakeBlock from 'block' */",
      String.raw`const escaped = 'don\'t import fakeEscaped from "escaped"';`,
      "const emoji = \"🚀 import fakeEmoji from 'emoji'\";",
      String.raw`const re = /['"/] import fakeRegex from "regex"/gi;`,
      "const ratio = a! / b! + 10 / 2;",
      "const inc = idx++ / 2;",
      "const opt = obj?.import;",
      String.raw`const arrowRe = () => /a\/b import fakeArrow from 'arrow'/;`,
      "const multilineDiv = +\n  1;",
      "const tpl = `head ${",
      '  { nested: `inner ${1 + 2} import fakeInner from "inner"` }',
      '} ${"mid"} tail import fakeOuter from "outer"`;',
      "const view = () => <Comp prop={1}>hi</Comp>;",
      'import realDefault from "./real";',
      "// trailing comment",
    ].join("\n");

    const matches = findStaticImports(tsAndJsxCode);
    expect(matches).toHaveLength(2);
    expect(matches[0].specifier).toBe("./config");
    expect(tsAndJsxCode.slice(matches[0].start, matches[0].end)).toBe(
      matches[0].code,
    );
    expect(matches[1].specifier).toBe("./real");
    expect(tsAndJsxCode.slice(matches[1].start, matches[1].end)).toBe(
      matches[1].code,
    );
    expect(parseStaticImport(matches[1]).defaultImport).toBe("realDefault");
  });
});

describe("findDynamicImports", () => {
  for (const [input, test] of Object.entries(dynamicTests)) {
    it(input.replace(/\n/g, String.raw`\n`), () => {
      const matches = findDynamicImports(input);
      expect(matches.length).to.equal(Array.isArray(test) ? test.length : 1);
      const match = matches[0];
      if (match) {
        expect(match.type).to.equal("dynamic");
        expect(match.expression.trim()).to.equal((test as any).expression);
      }
    });
  }
});

describe("findTypeImports", () => {
  for (const [input, _results] of Object.entries(TypeTests)) {
    it(input.replace(/\n/g, String.raw`\n`), () => {
      const matches = findTypeImports(input);
      const results = Array.isArray(_results) ? _results : [_results];
      expect(matches.length).toEqual(results.length);
      for (const [index, test] of results.entries()) {
        const match = matches[index];
        expect(match.specifier).to.equal(test.specifier);

        const parsed = parseTypeImport(match);
        if (test.type) {
          expect(parsed.type).to.equals(test.type);
        }
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
