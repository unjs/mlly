import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

import {
  isNodeBuiltin,
  sanitizeFilePath,
  getProtocol,
  parseNodeModulePath,
  resolveSubpath,
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

  for (const id in cases) {
    it(`'${id}': ${cases[id]}`, () => {
      expect(isNodeBuiltin(id)).to.equal(cases[id]);
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
  };
  for (const id in cases) {
    it(`'${id}': ${cases[id]}`, () => {
      expect(sanitizeFilePath(id)).to.equal(cases[id]);
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
  it("parses paths", () => {
    const paths = [
      "/src/a/node_modules/thing/dist/index.mjs",
      "C:\\src\\a\\node_modules\\thing\\dist\\index.mjs",
    ];
    for (const path of paths) {
      expect(parseNodeModulePath(path)).toEqual({
        baseDir: expect.stringContaining("/src/a/node_modules/"),
        pkgName: "thing",
        subpath: "/dist/index.mjs",
      });
    }
  });
});

describe("resolveSubpath", () => {
  it("resolves correctly", async () => {
    const path = fileURLToPath(
      new URL("fixture/node_modules/subpaths/lib/subpath.mjs", import.meta.url)
    );
    const result = await resolveSubpath(path);
    expect(result).toMatchInlineSnapshot('"subpaths/subpath"');
  });
  it("ignores invalid paths", async () => {
    const path = fileURLToPath(
      new URL("fixture/subpaths/lib/subpath.mjs", import.meta.url)
    );
    const result = await resolveSubpath(path);
    expect(result).toEqual(path.replace(".mjs", ""));
  });
});
