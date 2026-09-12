import { join } from "pathe";
import { describe, it, expect } from "vitest";
import { detectSyntax, hasESMSyntax, isValidNodeImport } from "../src";

const staticTests = {
  // ESM
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#syntax
  'import defaultExport from "module-name";': {
    hasESM: true,
    hasCJS: false,
    isMixed: false,
  },
  'import * as name from "module-name";': {
    hasESM: true,
    hasCJS: false,
    isMixed: false,
  },
  'import { export1 } from "module-name";': {
    hasESM: true,
    hasCJS: false,
    isMixed: false,
  },
  'import { export1 as alias1 } from "module-name";': {
    hasESM: true,
    hasCJS: false,
    isMixed: false,
  },
  'import { export1, export2 } from "module-name";': {
    hasESM: true,
    hasCJS: false,
    isMixed: false,
  },
  'import { export1, export2 as alias2, export3 } from "module-name";': {
    hasESM: true,
    hasCJS: false,
    isMixed: false,
  },
  'import defaultExport, { export1, export2 } from "module-name";': {
    hasESM: true,
    hasCJS: false,
    isMixed: false,
  },
  'import defaultExport, * as name from"module-name";': {
    hasESM: true,
    hasCJS: false,
    isMixed: false,
  },
  'import"module-name"': { hasESM: true, hasCJS: false, isMixed: false },
  'import defaultMember from "module-name";': {
    hasESM: true,
    hasCJS: false,
    isMixed: false,
  },
  'import "./file.mjs"': { hasESM: true, hasCJS: false, isMixed: false },
  'export default b=""': { hasESM: true, hasCJS: false, isMixed: false },
  "export const a = 1": { hasESM: true, hasCJS: false, isMixed: false },
  "export function hi() {}": { hasESM: true, hasCJS: false, isMixed: false },
  "export async function foo() {}": {
    hasESM: true,
    hasCJS: false,
    isMixed: false,
  },
  "export class": { hasESM: true, hasCJS: false, isMixed: false },
  "const start = '/* ';import foo from 'bar';const end = ' */'": {
    hasESM: true,
    hasCJS: false,
    isMixed: false,
  },
  // CJS
  "exports.c={}": { hasESM: false, hasCJS: true, isMixed: false },
  "const b=true;module.exports={b};": {
    hasESM: false,
    hasCJS: true,
    isMixed: false,
  },
  // Mixed
  'import"module-name";module.exports={};': {
    hasESM: true,
    hasCJS: true,
    isMixed: true,
  },
  // No clues
  'import("./file.mjs")': { hasESM: false, hasCJS: false, isMixed: false },
  "console.log(process.version)": {
    hasESM: false,
    hasCJS: false,
    isMixed: false,
  },
  "const a={};": { hasESM: false, hasCJS: false, isMixed: false },
};

const staticTestsWithComments = {
  '// They\'re exposed using "export import" so that types are passed along as expected\nmodule.exports={};':
    { hasESM: false, hasCJS: true, isMixed: false },
};

describe("detectSyntax", () => {
  for (const [input, result] of Object.entries(staticTests)) {
    it(input, () => {
      expect(detectSyntax(input)).to.deep.equal(result);
    });
  }
});

describe("detectSyntax (with comment)", () => {
  for (const [input, result] of Object.entries(staticTestsWithComments)) {
    it(input, () => {
      expect(detectSyntax(input, { stripComments: true })).to.deep.equal(
        result,
      );
    });
  }
});

describe.each([{}, { stripComments: true }])(
  "ESM token detection (%j)",
  (opts) => {
    it.each([
      `module.exports = "example export default value";`,
      `module.exports = "Cannot use 'export import' here";`,
      `module.exports = 'example import "package" text';`,
      "module.exports = `example export default text`;",
      'module.exports = `example ${" export default text"}`;',
      "module.exports = / export default /;",
      String.raw`module.exports = "escaped \" export default text";`,
      "module.exports = fn(\n importingFile,\n fromCacheOnly\n);",
      'module.exports = object.import("package");',
      "module.exports = object?.export;",
    ])("ignores non-syntax in %s", (code) => {
      expect(hasESMSyntax(code, opts)).toBe(false);
      expect(detectSyntax(code, opts)).toEqual({
        hasESM: false,
        hasCJS: true,
        isMixed: false,
      });
    });

    it.each([
      'const text = " export default fake"; export const value = 1;',
      'const text = " export default fake"; import "package";',
      'importingFile\nimport value from "package";',
      'import/* comment */"package";',
      'import /* comment */ value /* comment */ from "package";',
      "export/* comment */const value = 1;",
      "const text = `raw ${ import.meta.url }`;",
      'const start = "/* ";import foo from "bar";const end = " */";',
      "export class",
    ])("retains actual syntax in %s", (code) => {
      expect(hasESMSyntax(code, opts)).toBe(true);
      expect(detectSyntax(code, opts).hasESM).toBe(true);
    });

    it("does not classify a dynamic import as ESM", () => {
      expect(hasESMSyntax('module.exports = import("package");', opts)).toBe(
        false,
      );
    });

    it("retains the heuristic for input the tokenizer cannot read", () => {
      expect(hasESMSyntax("@decorator\nexport class Example {}", opts)).toBe(
        true,
      );
    });
  },
);

describe("ESM comments", () => {
  it.each([
    "// export default example\nmodule.exports = {};",
    "/*\n export default example\n*/\nmodule.exports = {};",
    "module.exports = `text ${ /* export default example */ 1 }`;",
  ])("preserves the opt-in comment behavior for %s", (code) => {
    expect(hasESMSyntax(code)).toBe(true);
    expect(detectSyntax(code).hasESM).toBe(true);
    expect(hasESMSyntax(code, { stripComments: true })).toBe(false);
    expect(detectSyntax(code, { stripComments: true }).hasESM).toBe(false);
  });
});

const nodeImportTests = {
  "node:fs": true,
  fs: true,
  "fs/promises": true,
  "node:fs/promises": true,
  // We can't detect these are invalid node imports
  "fs/fake": true,
  "node:fs/fake": true,
  vue: "error",
  [join(import.meta.url, "../invalid")]: "error",
  'data:text/javascript,console.log("hello!");': true,
  [join(import.meta.url, "../fixture/imports/cjs")]: true,
  [join(import.meta.url, "../fixture/imports/esm")]: true,
  [join(import.meta.url, "../fixture/imports/esm-module")]: true,
  [join(import.meta.url, "../fixture/imports/js-cjs")]: true,
  [join(import.meta.url, "../fixture/imports/js-cjs-syntax-text")]: true,
  [join(import.meta.url, "../fixture/imports/js-esm")]: false,
  [join(import.meta.url, "../fixture/imports/js-esm/es/index.mjs")]: true,
  [join(import.meta.url, "../fixture/imports/js-esm/es/index.js")]: false,
  [join(import.meta.url, "../fixture/imports/mixed")]: false,
};

describe("isValidNodeImport", () => {
  it("ignores non-syntax with comments stripped", async () => {
    expect(
      await isValidNodeImport(
        join(import.meta.url, "../fixture/imports/js-cjs-syntax-text"),
        { stripComments: true },
      ),
    ).toBe(true);
  });

  it("preserves the comment option when validating CommonJS", async () => {
    const id = join(import.meta.url, "../fixture/imports/js-cjs");
    const code = "/*\n export default example\n*/\nmodule.exports = {};";
    expect(await isValidNodeImport(id, { code })).toBe(false);
    expect(await isValidNodeImport(id, { code, stripComments: true })).toBe(
      true,
    );
  });

  for (const [input, result] of Object.entries(nodeImportTests)) {
    it(input, async () => {
      try {
        expect(await isValidNodeImport(input)).to.equal(result);
      } catch (error) {
        if (result !== "error") {
          throw error;
        }
        expect(result).to.equal("error");
      }
    });
  }
});
