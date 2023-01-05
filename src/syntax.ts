import { promises as fsp } from "node:fs";
import { extname } from "pathe";
import { readPackageJSON } from "pkg-types";
import { ResolveOptions, resolvePath } from "./resolve";
import { isNodeBuiltin, getProtocol } from "./utils";

const ESM_RE =
  /([\s;]|^)(import[\s\w*,{}]*from|import\s*["'*{]|export\b\s*(?:[*{]|default|class|type|function|const|var|let|async function)|import\.meta\b)/m;

const BUILTIN_EXTENSIONS = new Set([".mjs", ".cjs", ".node", ".wasm"]);

export function hasESMSyntax(code: string): boolean {
  return ESM_RE.test(code);
}

const CJS_RE =
  /([\s;]|^)(module.exports\b|exports\.\w|require\s*\(|global\.\w)/m;
export function hasCJSSyntax(code: string): boolean {
  return CJS_RE.test(code);
}

export function detectSyntax(code: string) {
  const hasESM = hasESMSyntax(code);
  const hasCJS = hasCJSSyntax(code);

  return {
    hasESM,
    hasCJS,
    isMixed: hasESM && hasCJS,
  };
}

export interface ValidNodeImportOptions extends ResolveOptions {
  /**
   * The contents of the import, which may be analyzed to see if it contains
   * CJS or ESM syntax as a last step in checking whether it is a valid import.
   */
  code?: string;
  /**
   * Protocols that are allowed as valid node imports.
   *
   * Default: ['node', 'file', 'data']
   */
  allowedProtocols?: Array<string>;
}

const validNodeImportDefaults: ValidNodeImportOptions = {
  allowedProtocols: ["node", "file", "data"],
};

export async function isValidNodeImport(
  id: string,
  _options: ValidNodeImportOptions = {}
): Promise<boolean> {
  if (isNodeBuiltin(id)) {
    return true;
  }

  const options = { ...validNodeImportDefaults, ..._options };

  const proto = getProtocol(id);
  if (proto && !options.allowedProtocols.includes(proto)) {
    return false;
  }

  // node is already validated by isNodeBuiltin and file will be normalized by resolvePath
  if (proto === "data") {
    return true;
  }

  const resolvedPath = await resolvePath(id, options);
  const extension = extname(resolvedPath);

  if (BUILTIN_EXTENSIONS.has(extension)) {
    return true;
  }

  if (extension !== ".js") {
    return false;
  }

  const package_ = await readPackageJSON(resolvedPath).catch(() => {});
  // @ts-ignore
  if (package_?.type === "module") {
    return true;
  }

  if (/\.(\w+-)?esm?(-\w+)?\.js$|\/(esm?)\//.test(resolvedPath)) {
    return false;
  }

  const code =
    options.code ||
    (await fsp.readFile(resolvedPath, "utf8").catch(() => {})) ||
    "";

  return hasCJSSyntax(code) || !hasESMSyntax(code);
}
