import { describe, it, expect } from "vitest";
import { interopDefault } from "../src";

const tests = [
  [{}, {}],
  [{ default: {} }, {}],
  [true, true],
  [
    [1, 2, 3],
    [1, 2, 3],
  ],
  [{ default: { x: 2 } }, { x: 2 }],
  [{ named: 2 }, { named: 2 }],
  [{ named: 2, default: {} }, { named: 2 }],
  [
    { named: 1, default: { x: 2 } },
    { named: 1, x: 2 },
  ],
  [
    { default: null, x: 1 }, // eslint-disable-line unicorn/no-null
    { default: null, x: 1 }, // eslint-disable-line unicorn/no-null
  ],
  [
    { default: undefined, x: 1 },
    { default: undefined, x: 1 },
  ],
  [{ default: "test", x: 123 }, "test"],
  [
    { default: "test", x: 123 },
    { default: "test", x: 123 },
    { preferNamespace: true },
  ],
] as const;

describe("interopDefault", () => {
  for (const [input, result, opts] of tests) {
    it(JSON.stringify(input), () => {
      const interop = interopDefault(input, opts);
      expect(interop).to.deep.equal(result);
      if (
        typeof input === "object" &&
        typeof result === "object" &&
        "default" in input
      ) {
        expect(interop.default).to.deep.equal(
          "default" in result ? result.default : result,
        );
      } else {
        expect(interop).to.deep.equal(result);
      }
    });
  }
});
