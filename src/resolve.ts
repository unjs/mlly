import { statSync } from "node:fs";
import url from "node:url";
import { joinURL } from "ufo";
import { isAbsolute, normalize } from "pathe";
import { moduleResolve } from "import-meta-resolve";
import { PackageJson, readPackageJSON } from "pkg-types";
import { fileURLToPath, pathToFileURL } from "./utils";
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
  /**
   * A URL, path or array of URLs/paths to resolve against.
   */
  url?: string | URL | (string | URL)[];

  /**
   * File extensions to consider when resolving modules.
   */
  extensions?: string[];

  /**
   * Conditions to consider when resolving package exports.
   */
  conditions?: string[];
}

function _tryModuleResolve(
  id: string,
  url: URL,
  conditions: any,
): URL | undefined {
  try {
    return moduleResolve(id, url, conditions) as URL;
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
  const urls: URL[] = [];
  for (const input of Array.isArray(options.url)
    ? options.url
    : [options.url]) {
    if (!input) {
      continue;
    }
    if (input instanceof URL) {
      urls.push(input);
      continue;
    }
    if (typeof input !== "string") {
      continue;
    }
    if (/^(?:node|data|http|https|file):/.test(input)) {
      urls.push(new URL(input));
      continue;
    }
    try {
      if (input.endsWith("/") || statSync(input).isDirectory()) {
        urls.push(url.pathToFileURL(input + "/"));
      } else {
        urls.push(url.pathToFileURL(input));
      }
    } catch {
      // We can't know, so assume it is dir or file
      urls.push(url.pathToFileURL(input + "/"));
      urls.push(url.pathToFileURL(input));
    }
  }
  if (urls.length === 0) {
    urls.push(url.pathToFileURL("./"));
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
          joinURL(id, prefix) + extension,
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

/**
 * Synchronously resolves a module path based on the options provided.
 *
 * @param {string} id - The identifier or path of the module to resolve.
 * @param {ResolveOptions} [options] - Options to resolve the module. See {@link ResolveOptions}.
 * @returns {string} The resolved URL as a string.
 */
export function resolveSync(id: string, options?: ResolveOptions): string {
  return _resolve(id, options);
}

/**
 * Asynchronously resolves a module path based on the given options.
 *
 * @param {string} id - The identifier or path of the module to resolve.
 * @param {ResolveOptions} [options] - Options for resolving the module. See {@link ResolveOptions}.
 * @returns {Promise<string>} A promise to resolve the URL as a string.
 */
export function resolve(id: string, options?: ResolveOptions): Promise<string> {
  try {
    return Promise.resolve(resolveSync(id, options));
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * Synchronously resolves a module path to a local file path based on the given options.
 *
 * @param {string} id - The identifier or path of the module to resolve.
 * @param {ResolveOptions} [options] - Options to resolve the module. See {@link ResolveOptions}.
 * @returns {string} The resolved file path.
 */
export function resolvePathSync(id: string, options?: ResolveOptions): string {
  return fileURLToPath(resolveSync(id, options));
}

/**
 * Asynchronously resolves a module path to a local file path based on the options provided.
 *
 * @param {string} id - The identifier or path of the module to resolve.
 * @param {ResolveOptions} [options] - Options for resolving the module. See {@link ResolveOptions}.
 * @returns {Promise<string>} A promise to resolve to the file path.
 */
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

/**
 * Creates a resolver function with default options that can be used to resolve module identifiers.
 *
 * @param {ResolveOptions} [defaults] - Default options to use for all resolutions. See {@link ResolveOptions}.
 * @returns {Function} A resolver function that takes an identifier and an optional URL, and resolves the identifier using the default options and the given URL.
 */
export function createResolve(defaults?: ResolveOptions) {
  return (id: string, url?: ResolveOptions["url"]) => {
    return resolve(id, { url, ...defaults });
  };
}

const NODE_MODULES_RE = /^(.+\/node_modules\/)([^/@]+|@[^/]+\/[^/]+)(\/?.*?)?$/;

/**
 * Parses a node module path to extract the directory, name, and subpath.
 *
 * @param {string} path - The path to parse.
 * @returns {Object} An object containing the directory, module name, and subpath of the node module.
 */
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

/**
 * Attempts to reverse engineer a subpath export within a node module.
 *
 * @param {string} path - The path within the node module.
 * @returns {Promise<string | undefined>} A promise that resolves to the detected subpath or undefined if not found.
 */
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
