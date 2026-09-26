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

  it("does not try the same search URL twice", () => {
    vi.spyOn(process, "cwd").mockReturnValue(
      fileURLToPath(new URL("fixture", import.meta.url)),
    );
    mockedResolve.mockClear();
    expect(() =>
      resolvePathSync("missing-pkg-for-dedupe", { extensions: [] }),
    ).toThrow();
    const seen = mockedResolve.mock.calls.map(
      (call) => `${call[0]} ${call[1].toString()}`,
    );
    expect(seen.length).toBeGreaterThan(0);
    expect(new Set(seen).size).toBe(seen.length);
    expect(mockedResolve.mock.calls[0][1].toString()).toMatch(/\/fixture\/$/);
  });
});

describe("resolve against process.cwd() (no url option)", () => {
  let root: string;

  function writePkg(dir: string, name: string) {
    const pkgDir = join(dir, "node_modules", name);
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(
      join(pkgDir, "package.json"),
      JSON.stringify({ name, main: "index.js" }),
    );
    writeFileSync(join(pkgDir, "index.js"), "module.exports = 1;");
  }

  function useCwd(dir: string) {
    vi.spyOn(process, "cwd").mockReturnValue(dir);
  }

  afterEach(() => {
    vi.restoreAllMocks();
    if (root) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  function setup(childName = "child") {
    root = realpathSync(mkdtempSync(join(tmpdir(), "mlly-cwd-")));
    const child = join(root, childName);
    mkdirSync(child, { recursive: true });
    return child;
  }

  it("prefers cwd node_modules over the parent directory", () => {
    const child = setup();
    writePkg(root, "dup-pkg");
    writePkg(child, "dup-pkg");
    useCwd(child);
    expect(resolvePathSync("dup-pkg")).toBe(
      fileURLToPath(join(child, "node_modules/dup-pkg/index.js")),
    );
  });

  it("resolves relative ids against cwd, not its parent", () => {
    const child = setup();
    writeFileSync(join(root, "entry.mjs"), "");
    writeFileSync(join(child, "entry.mjs"), "");
    useCwd(child);
    expect(resolvePathSync("./entry.mjs")).toBe(
      fileURLToPath(join(child, "entry.mjs")),
    );
  });

  it("still finds packages installed only in a parent directory", () => {
    const child = setup();
    writePkg(root, "parent-only");
    useCwd(child);
    expect(resolvePathSync("parent-only")).toBe(
      fileURLToPath(join(root, "node_modules/parent-only/index.js")),
    );
  });

  it("handles cwd with a trailing separator", () => {
    const child = setup();
    writePkg(root, "dup-pkg");
    writePkg(child, "dup-pkg");
    useCwd(child + (process.platform === "win32" ? "\\" : "/"));
    expect(resolvePathSync("dup-pkg")).toBe(
      fileURLToPath(join(child, "node_modules/dup-pkg/index.js")),
    );
  });

  it("handles cwd with spaces and non-ASCII characters", () => {
    const child = setup("한글 dir #1");
    writePkg(root, "dup-pkg");
    writePkg(child, "dup-pkg");
    useCwd(child);
    expect(resolvePathSync("dup-pkg")).toBe(
      fileURLToPath(join(child, "node_modules/dup-pkg/index.js")),
    );
  });
});
