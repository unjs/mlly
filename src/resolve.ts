import { existsSync, realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { joinURL } from "ufo";
import { isAbsolute, join, normalize } from "pathe";
import { moduleResolve } from "import-meta-resolve";
import { PackageJson, readPackageJSON } from "pkg-types";
import { fileURLToPath, normalizeid } from "./utils";
import { pcall, BUILTIN_MODULES } from "./_utils";

const DEFAULT_CONDITIONS_SET = new Set(["node", "import"]);
const DEFAULT_URL = pathToFileURL(process.cwd());
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
  conditions: any
): any | undefined {
  try {
    return moduleResolve(id, url, conditions);
  } catch (error) {
    if (!NOT_FOUND_ERRORS.has(error.code)) {
      throw error;
    }
  }
}

function _resolve(id: string, options: ResolveOptions = {}): string {
  // Skip if already has a protocol
  if (/(node|data|http|https):/.test(id)) {
    return id;
  }

  // Skip builtins
  if (BUILTIN_MODULES.has(id)) {
    return "node:" + id;
  }

  // Skip resolve for absolute paths
  if (isAbsolute(id) && existsSync(id)) {
    // Resolve realPath and normalize slash
    const realPath = realpathSync(fileURLToPath(id));
    return pathToFileURL(realPath).toString();
  }

  // Condition set
  const conditionsSet = options.conditions
    ? new Set(options.conditions)
    : DEFAULT_CONDITIONS_SET;

  // Search paths
  const _urls: URL[] = (
    Array.isArray(options.url) ? options.url : [options.url]
  )
    .filter(Boolean)
    .map((u) => new URL(normalizeid(u.toString())));
  if (_urls.length === 0) {
    _urls.push(DEFAULT_URL);
  }
  const urls = [..._urls];
  for (const url of _urls) {
    if (url.protocol === "file:") {
      urls.push(
        new URL("./", url),
        // If url is directory
        new URL(joinURL(url.pathname, "_index.js"), url),
        // TODO: Remove in next major version?
        new URL("node_modules", url)
      );
    }
  }

  let resolved;
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
          conditionsSet
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
      `Cannot find module ${id} imported from ${urls.join(", ")}`
    );
    // @ts-ignore
    error.code = "ERR_MODULE_NOT_FOUND";
    throw error;
  }

  // Resolve realPath and normalize slash
  const realPath = realpathSync(fileURLToPath(resolved));
  return pathToFileURL(realPath).toString();
}

export function resolveSync(id: string, options?: ResolveOptions): string {
  return _resolve(id, options);
}

export function resolve(id: string, options?: ResolveOptions): Promise<string> {
  return pcall(resolveSync, id, options);
}

export function resolvePathSync(id: string, options?: ResolveOptions): string {
  return fileURLToPath(resolveSync(id, options));
}

export function resolvePath(
  id: string,
  options?: ResolveOptions
): Promise<string> {
  return pcall(resolvePathSync, id, options);
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
  const [, baseDir, pkgName, subpath] = match;
  return {
    baseDir,
    pkgName,
    subpath,
  };
}

/** Reverse engineer a subpath export if possible */
export async function resolveSubpath(path: string) {
  path = normalize(fileURLToPath(path));

  const { pkgName, subpath } = parseNodeModulePath(path);

  if (!pkgName || !subpath) {
    return path.replace(/\.[a-z]+$/, "");
  }

  const { exports } = (await readPackageJSON(path)) || {};
  if (exports) {
    const resolvedSubpath = _findSubpath(subpath.replace(/^\//, "./"), exports);
    if (resolvedSubpath) {
      return join(pkgName, resolvedSubpath);
    }
  }

  // Fallback to guessing
  return path.replace(/\.[a-z]+$/, "");
}

// --- Internal ---

function _findSubpath(path: string, exports: PackageJson["exports"]) {
  if (typeof exports === "string") {
    exports = { ".": exports };
  }

  const relativePath = path.startsWith(".") ? path : `./${path}`;
  if (relativePath in exports) {
    return relativePath;
  }

  const flattenedExports = _flattenExports(exports);
  const [foundPath] =
    flattenedExports.find(([_, resolved]) => resolved === path) || [];

  return foundPath;
}

function _flattenExports(
  exports: Exclude<PackageJson["exports"], string>,
  path?: string
) {
  return Object.entries(exports).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[path ?? key, value]]
      : _flattenExports(value, path ?? key)
  );
}
