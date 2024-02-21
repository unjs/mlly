import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { resolveSync, resolvePathSync } from "../src";

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
    const resolved = resolveSync("./fixture/hello-linked", {
      url: import.meta.url,
    });
    expect(fileURLToPath(resolved)).match(/fixture\/hello\.mjs$/);
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
