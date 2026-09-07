import { describe, it, expect } from "vitest";
import * as resolver from "../src/resolver";

describe("resolver subpath", () => {
  it("exports resolver methods", () => {
    expect(typeof resolver.resolve).toBe("function");
    expect(typeof resolver.resolvePath).toBe("function");
    expect(typeof resolver.resolveSync).toBe("function");
    expect(typeof resolver.resolvePathSync).toBe("function");
    expect(typeof resolver.createResolve).toBe("function");
  });
});
