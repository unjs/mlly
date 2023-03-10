import { describe, it, expect } from "vitest";
import {
  ESMExport,
  findExports,
  findExportNames,
  resolveModuleExportNames,
  findTypeExports,
} from "../src";

describe("findExports", () => {
  const tests: Record<string, Partial<ESMExport>> = {
    "export function useA () { return 'a' }": {
      name: "useA",
      type: "declaration",
    },
    "export const useD = () => { return 'd' }": {
      name: "useD",
      type: "declaration",
    },
    "export { useB, _useC as useC }": {
      names: ["useB", "useC"],
      type: "named",
    },
    "export default foo": {
      type: "default",
      name: "default",
      names: ["default"],
    },
    'export { default } from "./other"': {
      type: "default",
      name: "default",
      names: ["default"],
      specifier: "./other",
    },
    'export { default , } from "./other"': {
      type: "default",
      name: "default",
      names: ["default"],
      specifier: "./other",
    },
    'export { useA , } from "./path"': {
      type: "named",
      name: "useA",
      names: ["useA"],
      specifier: "./path",
    },
    'export { useA , useB  , } from "./path"': {
      type: "named",
      names: ["useA", "useB"],
      specifier: "./path",
    },
    "export async function foo ()": { type: "declaration", names: ["foo"] },
    "export const $foo = () => {}": { type: "declaration", names: ["$foo"] },
    "export { foo as default }": {
      type: "default",
      name: "default",
      names: ["default"],
    },
    'export * from "./other"': { type: "star", specifier: "./other" },
    'export * as foo from "./other"': {
      type: "star",
      specifier: "./other",
      name: "foo",
    },
    // eslint-disable-next-line no-template-curly-in-string
    "const a = `<div${JSON.stringify({ class: 42 })}>`;\nexport default true;":
      { type: "default", name: "default", names: ["default"] },
    "export const enum foo { a = 'xx' }": {
      type: "declaration",
      names: ["foo"],
    },
    "export enum bar { a = 'xx' }": { type: "declaration", names: ["bar"] },
    "export const { a, b } = foo": { type: "named", names: ["a", "b"] },
    "export const [ a, b ] = foo": { type: "named", names: ["a", "b"] },
    "export const [\na\n, b ] = foo": { type: "named", names: ["a", "b"] },
    "export const [ a:b,\nc = 1] = foo": { type: "named", names: ["b", "c"] },
  };

  for (const [input, test] of Object.entries(tests)) {
    it(input.replace(/\n/g, "\\n"), () => {
      const matches = findExports(input);
      expect(matches.length).toEqual(1);
      const match = matches[0];
      if (test.type) {
        expect(match.type).toEqual(test.type);
      }
      if (test.name) {
        expect(match.name).toEqual(test.name);
      }
      if (test.names) {
        expect(match.names).toEqual(test.names);
      }
      if (test.specifier) {
        expect(match.specifier).toEqual(test.specifier);
      }
    });
  }
  it("handles multiple exports", () => {
    const matches = findExports(`
          export { useTestMe1 } from "@/test/foo1";
          export { useTestMe2 } from "@/test/foo2";
          export { useTestMe3 } from "@/test/foo3";
        `);
    expect(matches.length).to.eql(3);
  });

  it("works with multiple named exports", () => {
    const code = `
  export { foo } from 'foo1';
  export { bar } from 'foo2';
  export { foobar } from 'foo2';
  `;
    const matches = findExports(code);
    expect(matches).to.have.lengthOf(3);
  });

  it("the commented out export should be filtered out", () => {
    const code = `
        // export { foo } from 'foo1';
        // exports default 'foo';
        // export { useB, _useC as useC };
        // export function useA () { return 'a' }
        // export { default } from "./other"
        // export async function foo () {}
        // export { foo as default }
        //export * from "./other"
        //export * as foo from "./other"

        /**
         * export const a = 123
         * export { foo } from 'foo1';
         * exports default 'foo'
         * export function useA () { return 'a' }
         * export { useB, _useC as useC };
         *export { default } from "./other"
         *export async function foo () {}
         * export { foo as default }
         * export * from "./other"
         export * as foo from "./other"
         */
        export { bar } from 'foo2';
        export { foobar } from 'foo2';
      `;
    const matches = findExports(code);
    expect(matches).to.have.lengthOf(2);
  });
  it("export in string", () => {
    const tests: string[] = [
      "export function useA () { return 'a' }",
      "export const useD = () => { return 'd' }",
      "export { useB, _useC as useC }",
      "export default foo",
      'export { default } from "./other"',
      "export async function foo ()",
      "export const $foo = () => {}",
      "export { foo as default }",
      'export * from "./other"',
      'export * as foo from "./other"',
    ];
    // eslint-disable-next-line unicorn/no-array-reduce
    const code = tests.reduce((codeString, statement, index) => {
      codeString = `
        ${codeString}
        const test${index}0 = "${statement}"
        const test${index}1 = \`
          test1
          ${statement}
          test2
        \`
      `;
      return codeString;
    }, "export { bar } from 'foo2'; \n export { foobar } from 'foo2';");
    const matches = findExports(code);
    expect(matches).to.have.lengthOf(2);
  });

  it("works with line feed named exports", () => {
    const code = `
    export {
      _foo as foo,
      bar,
    };
    `;
    const matches = findExports(code);
    expect(matches[0].names).toEqual(["foo", "bar"]);
  });

  // https://github.com/nuxt/framework/issues/7658
  it("works the same with or without comment", () => {
    const code1 = `
export default function useMain() {}
`;
    const code2 = `
export default function useMain() {}
// export default function useMain() {}
`;
    const matches1 = findExports(code1);
    const matches2 = findExports(code2);
    expect(matches1).toHaveLength(1);
    expect(matches1[0].name).toEqual("default");
    expect(matches2).toEqual(matches1);
  });

  it("ignore export type", () => {
    const code = `
export { type AType, type B as BType, foo } from 'foo'
`;
    const matches = findExports(code);
    expect(matches).toHaveLength(1);
    expect(matches[0].names).toHaveLength(1);
    expect(matches[0].names[0]).toEqual("foo");
    expect(matches[0].name).toEqual("foo");
  });
});

describe("findExportNames", () => {
  it("findExportNames", () => {
    expect(
      findExportNames(`
    export const foo = 'bar'
    export { bar, baz }
    export default something
    `)
    ).toMatchInlineSnapshot(`
      [
        "foo",
        "bar",
        "baz",
        "default",
      ]
    `);
  });
});

describe("resolveModuleExportNames", () => {
  it("direct exports", async () => {
    expect(await resolveModuleExportNames("pathe")).toMatchInlineSnapshot(`
      [
        "basename",
        "default",
        "delimiter",
        "dirname",
        "extname",
        "format",
        "isAbsolute",
        "join",
        "normalize",
        "normalizeString",
        "parse",
        "relative",
        "resolve",
        "sep",
        "toNamespacedPath",
      ]
    `);
  });

  it("star exports", async () => {
    expect(
      await resolveModuleExportNames(
        new URL("fixture/exports.mjs", import.meta.url).toString()
      )
    ).toMatchInlineSnapshot(`
      [
        "foo",
        "_resolve",
        "basename",
        "default",
        "delimiter",
        "dirname",
        "extname",
        "format",
        "isAbsolute",
        "join",
        "normalize",
        "normalizeString",
        "parse",
        "relative",
        "resolve",
        "sep",
        "toNamespacedPath",
      ]
    `);
  });

  it("star exports with package", async () => {
    expect(
      await resolveModuleExportNames(
        new URL("fixture/package/exports.mjs", import.meta.url).toString()
      )
    ).toMatchInlineSnapshot(`
      [
        "StaticRouter",
        "unstable_StaticRouterProvider",
        "unstable_createStaticRouter",
      ]
    `);
  });

  it("multiple inline", () => {
    const code = `
export { foo } from 'foo1';export { bar } from 'foo2';export * as foobar from 'foo2';
`;
    const matches = findExports(code);
    expect(matches).to.have.lengthOf(3);
  });
});

describe("findTypeExports", () => {
  it("finds type exports", () => {
    const matches = findTypeExports(
      `
          export type { Foo } from "./foo";
          export type { Bar } from "./bar";
          interface Qux {}
          export type { Qux }
          export type Bing = Qux
          export declare function getWidget(n: number): Widget
        `
    );
    expect(matches).toMatchInlineSnapshot(`
      [
        {
          "code": "export type Bing",
          "declaration": "type",
          "end": 172,
          "name": "Bing",
          "names": [
            "Bing",
          ],
          "start": 156,
          "type": "declaration",
        },
        {
          "code": "export declare function getWidget",
          "declaration": "declare function",
          "end": 222,
          "name": "getWidget",
          "names": [
            "getWidget",
          ],
          "start": 189,
          "type": "declaration",
        },
        {
          "code": "export type { Foo } from \\"./foo\\"",
          "end": 43,
          "exports": " Foo",
          "name": "Foo",
          "names": [
            "Foo",
          ],
          "specifier": "./foo",
          "start": 11,
          "type": "named",
        },
        {
          "code": "export type { Bar } from \\"./bar\\"",
          "end": 87,
          "exports": " Bar",
          "name": "Bar",
          "names": [
            "Bar",
          ],
          "specifier": "./bar",
          "start": 55,
          "type": "named",
        },
        {
          "code": "export type { Qux }",
          "end": 145,
          "exports": " Qux",
          "name": "Qux",
          "names": [
            "Qux",
          ],
          "specifier": undefined,
          "start": 126,
          "type": "named",
        },
      ]
    `);
  });
});
