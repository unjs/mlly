import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "./utils";
import { isObject } from "./_utils";

export interface CommonjsContext {
  __filename: string;
  __dirname: string;
  // TODO!
  // eslint-disable-next-line no-undef
  require: NodeRequire;
}

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
  if (typeof defaultValue !== "object") {
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
    } catch {}
  }
  return defaultValue;
}
