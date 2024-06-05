import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "./utils";
import { isObject } from "./_utils";

/**
 * Represents the context of a CommonJS environment, providing node-like module resolution capabilities within a module.
 */
export interface CommonjsContext {
  /**
   * The absolute path to the current module file.
   */
  __filename: string;

  /**
   * The directory name of the current module.
   */
  __dirname: string;
  // TODO!

  /**
   * A function to require modules as in CommonJS.
   */
  require: NodeRequire;
}

/**
 * Creates a CommonJS context for a given module URL, enabling `require`, `__filename` and `__dirname` support similar to Node.js.
 * This function dynamically generates a `require` function that is context-aware and bound to the location of the given module URL.
 *
 * @param {string} url - The URL of the module file to create a context for.
 * @returns {CommonjsContext} A context object containing `__filename`, `__dirname` and a custom `require` function. See {@link CommonjsContext}.
 */
export function createCommonJS(url: string): CommonjsContext {
  const __filename = fileURLToPath(url);
  const __dirname = dirname(__filename);

  // Lazy require
  let _nativeRequire: typeof require;
  const getNativeRequire = () => {
    if (!_nativeRequire) {
      _nativeRequire = createRequire(url);
    }
    return _nativeRequire;
  };
  function require(id: string): any {
    return getNativeRequire()(id);
  }
  require.resolve = function requireResolve(id: string, options: any): string {
    return getNativeRequire().resolve(id, options);
  };
  return {
    __filename,
    __dirname,
    require,
  } as CommonjsContext;
}

export function interopDefault(
  sourceModule: any,
  opts: { preferNamespace?: boolean } = {},
): any {
  if (!isObject(sourceModule) || !("default" in sourceModule)) {
    return sourceModule;
  }
  const defaultValue = sourceModule.default;
  if (defaultValue === undefined || defaultValue === null) {
    return sourceModule;
  }
  const _defaultType = typeof defaultValue;
  if (
    _defaultType !== "object" &&
    !(_defaultType === "function" && !opts.preferNamespace)
  ) {
    return opts.preferNamespace ? sourceModule : defaultValue;
  }
  for (const key in sourceModule) {
    try {
      if (!(key in defaultValue)) {
        Object.defineProperty(defaultValue, key, {
          enumerable: key !== "default",
          configurable: key !== "default",
          get() {
            return sourceModule[key];
          },
        });
      }
    } catch {
      // Ignore error
    }
  }
  return defaultValue;
}
