import { existsSync } from "node:fs";
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
