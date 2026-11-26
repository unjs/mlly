import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveSync, resolvePathSync, fileURLToPath } from "../src";
import { parseFilename } from "ufo";

const tests = [
  // Resolve to path
  { input: "ufo", action: "resolves" },
  { input: "./fixture/cjs.mjs", action: "resolves" },
  { input: "./fixture/foo", action: "resolves" },
  // Return same input as-is
  { input: "https://foo.com/a/b.js?a=1", action: "same" },
  // Throw error
  { input: 'script:alert("a")', action: "throws" },
  { input: "/non/existent", action: "throws" },
] as const;

describe("resolveSync", () => {
  for (const test of tests) {
    it(`${test.input} should ${test.action}`, () => {
      switch (test.action) {
        case "resolves": {
          const resolved = resolveSync(test.input, { url: import.meta.url });
          expect(existsSync(fileURLToPath(resolved))).toBe(true);
          break;
        }
        case "same": {
          const resolved = resolveSync(test.input, { url: import.meta.url });
          expect(resolved).toBe(test.input);
          break;
        }
        case "throws": {
          expect(() => resolveSync(test.input)).toThrow();
          break;
        }
      }
    });
  }

  it("follows symlinks", () => {
    const resolved = resolveSync("./fixture/hello.link", {
      url: import.meta.url,
    });
    expect(fileURLToPath(resolved)).match(/fixture\/hello\.mjs$/);

    const resolved2 = resolveSync("./fixture/test.link.txt", {
      url: import.meta.url,
    });
    expect(fileURLToPath(resolved2)).match(/fixture\/test.txt$/);
  });

  it("resolves node built-ints", () => {
    expect(resolveSync("node:fs")).toBe("node:fs");
    expect(resolveSync("fs")).toBe("node:fs");
    expect(resolveSync("node:foo")).toBe("node:foo");
  });
});

describe("resolvePathSync", () => {
  for (const test of tests) {
    it(`${test.input} should ${test.action}`, () => {
      switch (test.action) {
        case "resolves": {
          const resolved = resolvePathSync(test.input, {
            url: import.meta.url,
          });
          expect(existsSync(resolved)).toBe(true);
          break;
        }
        case "same": {
          const resolved = resolvePathSync(test.input, {
            url: import.meta.url,
          });
          expect(resolved).toBe(test.input);
          break;
        }
        case "throws": {
          expect(() => resolvePathSync(test.input)).toThrow();
          break;
        }
      }
    });
  }
});

// https://github.com/unjs/mlly/pull/278
describe("tryModuleResolve", async () => {
  const { mockedResolve } = await vi.hoisted(async () => {
    const importMetaResolve = await vi.importActual<
      Record<string, (...args: unknown[]) => unknown>
    >("import-meta-resolve");
    return {
      mockedResolve: vi.fn((id, url, conditions) => {
        return importMetaResolve.moduleResolve(id, url, conditions);
      }),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create correct url", () => {
    vi.mock("import-meta-resolve", () => {
      return {
        moduleResolve: mockedResolve,
      };
    });
    expect(() =>
      resolvePathSync("tslib/", {
        url: import.meta.url.replace(
          parseFilename(import.meta.url, { strict: false }) || "",
          "",
        ),
      }),
    ).toThrow();
    expect(mockedResolve).toHaveBeenCalled();
    expect(
      mockedResolve.mock.calls.some((call) => call[0].includes("//")),
    ).toBe(false);
  });
});

// https://github.com/unjs/mlly/issues/374
describe("resolve from process.cwd()", () => {
  it("prefers node_modules in the working directory over its parent", () => {
    const root = mkdtempSync(join(tmpdir(), "mlly-resolve-"));
    const child = join(root, "child");
    const parentPackage = join(root, "node_modules", "ambiguous");
    const childPackage = join(child, "node_modules", "ambiguous");
    mkdirSync(parentPackage, { recursive: true });
    mkdirSync(childPackage, { recursive: true });
    writeFileSync(join(parentPackage, "index.js"), "module.exports = 'parent'");
    writeFileSync(join(childPackage, "index.js"), "module.exports = 'child'");

    const cwd = process.cwd();
    try {
      process.chdir(child);
      expect(resolvePathSync("ambiguous")).toBe(
        fileURLToPath(realpathSync(join(childPackage, "index.js"))),
      );
    } finally {
      process.chdir(cwd);
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("treats an explicit directory URL without a trailing slash as a directory", () => {
    const root = mkdtempSync(join(tmpdir(), "mlly-resolve-"));
    const child = join(root, "child");
    const parentPackage = join(root, "node_modules", "ambiguous");
    const childPackage = join(child, "node_modules", "ambiguous");
    mkdirSync(parentPackage, { recursive: true });
    mkdirSync(childPackage, { recursive: true });
    writeFileSync(join(parentPackage, "index.js"), "module.exports = 'parent'");
    writeFileSync(join(childPackage, "index.js"), "module.exports = 'child'");

    try {
      expect(resolvePathSync("ambiguous", { url: child })).toBe(
        fileURLToPath(realpathSync(join(childPackage, "index.js"))),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
