import { describe, it, expect } from "vitest";

import {
  isNodeBuiltin,
  sanitizeFilePath,
  getProtocol,
  parseNodeModulePath,
  lookupNodeModuleSubpath,
  fileURLToPath,
  pathToFileURL,
} from "../src";

describe("isNodeBuiltin", () => {
  const cases = {
    fs: true,
    fake: false,
    "node:fs": true,
    "node:fake": false,
    "fs/promises": true,
    "fs/fake": true, // invalid import
  };

  for (const [input, output] of Object.entries(cases)) {
    it(`'${input}': ${output}`, () => {
      expect(isNodeBuiltin(input)).to.equal(output);
    });
  }

  it("undefined", () => {
    expect(isNodeBuiltin()).to.equal(false);
  });
});

describe("sanitizeFilePath", () => {
  const cases = {
    "C:/te#st/[...slug].jsx": "C:/te_st/_...slug_.jsx",
    "C:\\te#st\\[...slug].jsx": "C:/te_st/_...slug_.jsx",
    "/te#st/[...slug].jsx": "/te_st/_...slug_.jsx",
    "/te#st/[].jsx": "/te_st/_.jsx",
    '\0a_b*c:d\u007Fe<f>g#h"i{j}k|l^m[n]o`p.jsx':
      "_a_b_c_d_e_f_g_h_i_j_k_l_m_n_o_p.jsx",
    "Foo.vue?vue&type=script&setup=true": "Foo.vue",
    "Foo.vue&vue&type=script&setup=true&generic=T%20extends%20any%2C%20O%20extends%20T%3CZ%7Ca%3E&lang":
      "Foo.vue_vue_type_script_setup_true_generic_T_extends_any__O_extends_T_Z_a__lang",
    "": "",
  } as const;
  for (const [input, output] of Object.entries(cases)) {
    it(`'${input}': ${output}`, () => {
      expect(sanitizeFilePath(input)).to.equal(output);
    });
  }

  it("undefined", () => {
    expect(sanitizeFilePath()).to.equal("");
  });
});

describe("getProtocol", () => {
  it("no protocol", () => {
    expect(getProtocol("/src/a.ts")).to.equal(undefined);
    expect(getProtocol("C:/src/a.ts")).to.equal(undefined);
  });

  it("file protocol", () => {
    expect(getProtocol("file://src/a.ts")).to.equal("file");
    expect(getProtocol("file://C:/src/a.ts")).to.equal("file");
    expect(getProtocol("file:///C:/src/a.ts")).to.equal("file");
  });
});

describe("parseNodeModulePath", () => {
  const tests = [
    {
      input: "/foo/bar",
      output: {},
    },
    {
      input: "/src/a/node_modules/thing",
      output: {
        dir: "/src/a/node_modules/",
        name: "thing",
      },
    },
    {
      input: "/src/a/node_modules/thing/dist/index.mjs",
      output: {
        dir: "/src/a/node_modules/",
        name: "thing",
        subpath: "./dist/index.mjs",
      },
    },
    {
      input: "C:\\src\\a\\node_modules\\thing\\dist\\index.mjs",
      output: {
        dir: "C:/src/a/node_modules/",
        name: "thing",
        subpath: "./dist/index.mjs",
      },
    },
  ];
  for (const t of tests) {
    it(t.input, () => {
      expect(parseNodeModulePath(t.input)).toMatchObject(t.output);
    });
  }
});

describe("lookupNodeModuleSubpath", () => {
  // eslint-disable-next-line unicorn/consistent-function-scoping
  const r = (p: string) => new URL(p, import.meta.url).toString();

  const tests = [
    // Resolve with exports
    {
      name: "resolves with exports field (root)",
      input: r("fixture/package/node_modules/subpaths/dist/index.mjs"),
      output: "./",
    },
    {
      name: "resolves with exports field (subpath)",
      input: r("fixture/package/node_modules/subpaths/dist/subpath.mjs"),
      output: "./subpath",
    },
    {
      name: "resolves with exports field (with conditions)",
      input: r("fixture/package/node_modules/postgres/src/index.js"),
      output: "./",
    },
    // Fallbacks
    {
      name: "resolves with fallback (non resolved module)",
      input: r("fixture/package/node_modules/alien/lib/subpath.json5"),
      output: "./lib/subpath.json5",
    },
    {
      name: "resolves with fallback subpath guess (non existing file)",
      input: r("fixture/package/node_modules/subpaths/foo/bar.mjs"),
      output: "./foo/bar.mjs",
    },
    // Invalid
    {
      name: "ignores invalid paths",
      input: r("/foo/bar/lib/subpath.mjs"),
      output: undefined,
    },
    {
      name: "resolves main export",
      input: r("fixture/package/node_modules/subpaths/"),
      output: "./",
    },
  ];

  for (const t of tests) {
    it(t.name, async () => {
      const result = await lookupNodeModuleSubpath(t.input);
      expect(result).toBe(t.output);
    });
  }
});

describe("fileURLToPath", () => {
  const tests = [
    // ["file:///C:/path/", "C:\\path\\"], // TODO
    // ["file://nas/foo.txt", "\\\\nas\\foo.txt"], // TODO
    ["file:///你好.txt", "/你好.txt"],
    ["file:///hello world", "/hello world"],
  ] as const;
  for (const t of tests) {
    it(`${t[0]} should resolve to ${t[1]}`, () => {
      expect(fileURLToPath(t[0])).toBe(t[1]);
    });
  }
});

describe("pathToFileURL", () => {
  const tests = [
    ["/foo#1", "file:///foo%231"],
    ["/some/path%.c", "file:///some/path%25.c"],
  ] as const;
  for (const t of tests) {
    it(`${t[0]} should resolve to ${t[1]}`, () => {
      expect(pathToFileURL(t[0])).toBe(t[1]);
    });
  }
});
