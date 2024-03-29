import { statSync } from "node:fs";
import { joinURL } from "ufo";
import { isAbsolute, normalize } from "pathe";
import { moduleResolve } from "import-meta-resolve";
import { PackageJson, readPackageJSON } from "pkg-types";
import { fileURLToPath, pathToFileURL, normalizeid } from "./utils";
import { BUILTIN_MODULES } from "./_utils";

const DEFAULT_CONDITIONS_SET = new Set(["node", "import"]);
const DEFAULT_EXTENSIONS = [".mjs", ".cjs", ".js", ".json"];
const NOT_FOUND_ERRORS = new Set([
  "ERR_MODULE_NOT_FOUND",
  "ERR_UNSUPPORTED_DIR_IMPORT",
  "MODULE_NOT_FOUND",
  "ERR_PACKAGE_PATH_NOT_EXPORTED",
]);

export interface ResolveOptions {
  url?: string | URL | (string | URL)[];
  extensions?: string[];
  conditions?: string[];
}

function _tryModuleResolve(
  id: string,
  url: URL,
  conditions: any,
): URL | undefined {
  try {
    return moduleResolve(id, url, conditions);
  } catch (error: any) {
    if (!NOT_FOUND_ERRORS.has(error?.code)) {
      throw error;
    }
  }
}

function _resolve(id: string | URL, options: ResolveOptions = {}): string {
  if (typeof id !== "string") {
    if (id instanceof URL) {
      id = fileURLToPath(id);
    } else {
      throw new TypeError("input must be a `string` or `URL`");
    }
  }

  // Skip if already has a protocol
  if (/(node|data|http|https):/.test(id)) {
    return id;
  }

  // Skip builtins
  if (BUILTIN_MODULES.has(id)) {
    return "node:" + id;
  }

  // Enable fast path for file urls
  if (id.startsWith("file://")) {
    id = fileURLToPath(id);
  }

  // Skip resolve for absolute paths (fast path)
  if (isAbsolute(id)) {
    try {
      const stat = statSync(id);
      if (stat.isFile()) {
        return pathToFileURL(id);
      }
    } catch (error: any) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }

  // Condition set
  const conditionsSet = options.conditions
    ? new Set(options.conditions)
    : DEFAULT_CONDITIONS_SET;

  // Search paths
  const _urls: URL[] = (
    (Array.isArray(options.url) ? options.url : [options.url]) as URL[]
  )
    .filter(Boolean)
    .map((url) => new URL(normalizeid(url.toString())));
  if (_urls.length === 0) {
    _urls.push(new URL(pathToFileURL(process.cwd())));
  }
  const urls = [..._urls];
  for (const url of _urls) {
    if (url.protocol === "file:") {
      urls.push(
        new URL("./", url),
        // If url is directory
        new URL(joinURL(url.pathname, "_index.js"), url),
        // TODO: Remove in next major version?
        new URL("node_modules", url),
      );
    }
  }

  let resolved: URL | undefined;
  for (const url of urls) {
    // Try simple resolve
    resolved = _tryModuleResolve(id, url, conditionsSet);
    if (resolved) {
      break;
    }
    // Try other extensions if not found
    for (const prefix of ["", "/index"]) {
      for (const extension of options.extensions || DEFAULT_EXTENSIONS) {
        resolved = _tryModuleResolve(
          id + prefix + extension,
          url,
          conditionsSet,
        );
        if (resolved) {
          break;
        }
      }
      if (resolved) {
        break;
      }
    }
    if (resolved) {
      break;
    }
  }

  // Throw error if not found
  if (!resolved) {
    const error = new Error(
      `Cannot find module ${id} imported from ${urls.join(", ")}`,
    );
    // @ts-ignore
    error.code = "ERR_MODULE_NOT_FOUND";
    throw error;
  }

  return pathToFileURL(resolved);
}

export function resolveSync(id: string, options?: ResolveOptions): string {
  return _resolve(id, options);
}

export function resolve(id: string, options?: ResolveOptions): Promise<string> {
  try {
    return Promise.resolve(resolveSync(id, options));
  } catch (error) {
    return Promise.reject(error);
  }
}

export function resolvePathSync(id: string, options?: ResolveOptions): string {
  return fileURLToPath(resolveSync(id, options));
}

export function resolvePath(
  id: string,
  options?: ResolveOptions,
): Promise<string> {
  try {
    return Promise.resolve(resolvePathSync(id, options));
  } catch (error) {
    return Promise.reject(error);
  }
}

export function createResolve(defaults?: ResolveOptions) {
  return (id: string, url?: ResolveOptions["url"]) => {
    return resolve(id, { url, ...defaults });
  };
}

const NODE_MODULES_RE = /^(.+\/node_modules\/)([^/@]+|@[^/]+\/[^/]+)(\/?.*?)?$/;

export function parseNodeModulePath(path: string) {
  if (!path) {
    return {};
  }
  path = normalize(fileURLToPath(path));
  const match = NODE_MODULES_RE.exec(path);
  if (!match) {
    return {};
  }
  const [, dir, name, subpath] = match;
  return {
    dir,
    name,
    subpath: subpath ? `.${subpath}` : undefined,
  };
}

/** Reverse engineer a subpath export if possible */
export async function lookupNodeModuleSubpath(
  path: string,
): Promise<string | undefined> {
  path = normalize(fileURLToPath(path));
  const { name, subpath } = parseNodeModulePath(path);

  if (!name || !subpath) {
    return subpath;
  }

  const { exports } = (await readPackageJSON(path).catch(() => {})) || {};
  if (exports) {
    const resolvedSubpath = _findSubpath(subpath, exports);
    if (resolvedSubpath) {
      return resolvedSubpath;
    }
  }

  return subpath;
}

// --- Internal ---

function _findSubpath(subpath: string, exports: PackageJson["exports"]) {
  if (typeof exports === "string") {
    exports = { ".": exports };
  }

  if (!subpath.startsWith(".")) {
    subpath = subpath.startsWith("/") ? `.${subpath}` : `./${subpath}`;
  }

  if (subpath in (exports || {})) {
    return subpath;
  }

  return _flattenExports(exports).find((p) => p.fsPath === subpath)?.subpath;
}

function _flattenExports(
  exports: Exclude<PackageJson["exports"], string> = {},
  parentSubpath = "./",
): { subpath: string; fsPath: string; condition?: string }[] {
  return Object.entries(exports).flatMap(([key, value]) => {
    const [subpath, condition] = key.startsWith(".")
      ? [key.slice(1), undefined]
      : ["", key];
    const _subPath = joinURL(parentSubpath, subpath);
    // eslint-disable-next-line unicorn/prefer-ternary
    if (typeof value === "string") {
      return [{ subpath: _subPath, fsPath: value, condition }];
    } else {
      return _flattenExports(value, _subPath);
    }
  });
}
