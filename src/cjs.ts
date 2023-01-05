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
  let _nativeRequire;
  const getNativeRequire = () =>
    _nativeRequire || (_nativeRequire = createRequire(url));
  function require(id) {
    return getNativeRequire()(id);
  }
  require.resolve = (id, options) => getNativeRequire().resolve(id, options);

  return {
    __filename,
    __dirname,
    require,
  } as CommonjsContext;
}

export function interopDefault(sourceModule: any): any {
  if (!isObject(sourceModule) || !("default" in sourceModule)) {
    return sourceModule;
  }
  const newModule = sourceModule.default;
  for (const key in sourceModule) {
    if (key === "default") {
      try {
        if (!(key in newModule)) {
          Object.defineProperty(newModule, key, {
            enumerable: false,
            configurable: false,
            get() {
              return newModule;
            },
          });
        }
      } catch {}
    } else {
      try {
        if (!(key in newModule)) {
          Object.defineProperty(newModule, key, {
            enumerable: true,
            configurable: true,
            get() {
              return sourceModule[key];
            },
          });
        }
      } catch {}
    }
  }
  return newModule;
}
