import { promises as fsp } from "node:fs";
import { parse } from "acorn";
import { extname } from "pathe";
import { readPackageJSON } from "pkg-types";
import { ResolveOptions, resolvePath } from "./resolve";
import { isNodeBuiltin, getProtocol } from "./utils";

const ESM_RE =
  /([\s;]|^)(import[\s\w*,{}]*from|import\s*["'*{]|export\b\s*(?:[*{]|default|class|type|function|const|var|let|async function)|import\.meta\b)/m;

const CJS_RE =
  /([\s;]|^)(module.exports\b|exports\.\w|require\s*\(|global\.\w)/m;

const BUILTIN_EXTENSIONS = new Set([".mjs", ".cjs", ".node", ".wasm"]);

/**
 * Options for detecting syntax within a code string.
 */
export type DetectSyntaxOptions = {
  /**
   * Indicates whether comments should be stripped from the code before syntax checking.
   * @default false
   */
  stripComments?: boolean;
};

interface TokenLocation {
  start: number;
  end: number;
}

function _getCommentLocations(code: string) {
  const locations: TokenLocation[] = [];
  parse(code, {
    ecmaVersion: "latest",
    allowHashBang: true,
    allowAwaitOutsideFunction: true,
    allowImportExportEverywhere: true,
    onComment(_isBlock, _text, start, end) {
      locations.push({ start, end });
    },
  });
  return locations;
}

/**
 * Strip comments from a string of source code
 *
 * @param code - The source code to remove comments from.
 */
export function stripComments(code: string) {
  const locations = _getCommentLocations(code);
  for (const location of locations.reverse()) {
    code = code.slice(0, location.start) + code.slice(location.end);
  }
  return code;
}

/**
 * Determines if a given code string contains ECMAScript module syntax.
 *
 * @param {string} code - The source code to analyse.
 * @param {DetectSyntaxOptions} opts - See {@link DetectSyntaxOptions}.
 * @returns {boolean} `true` if the code contains ESM syntax, otherwise `false`.
 */
export function hasESMSyntax(
  code: string,
  opts: DetectSyntaxOptions = {},
): boolean {
  if (opts.stripComments) {
    code = stripComments(code);
  }
  return ESM_RE.test(code);
}

/**
 * Determines if a given string of code contains CommonJS syntax.
 *
 * @param {string} code - The source code to analyse.
 * @param {DetectSyntaxOptions} opts - See {@link DetectSyntaxOptions}.
 * @returns {boolean} `true` if the code contains CommonJS syntax, `false` otherwise.
 */
export function hasCJSSyntax(
  code: string,
  opts: DetectSyntaxOptions = {},
): boolean {
  if (opts.stripComments) {
    code = stripComments(code);
  }
  return CJS_RE.test(code);
}

/**
 * Analyses the supplied code to determine if it contains ECMAScript module syntax, CommonJS syntax, or both.
 *
 * @param {string} code - The source code to analyse.
 * @param {DetectSyntaxOptions} opts - See {@link DetectSyntaxOptions}.
 * @returns {object} An object indicating the presence of ESM syntax (`hasESM`), CJS syntax (`hasCJS`) and whether both syntaxes are present (`isMixed`).
 */
export function detectSyntax(code: string, opts: DetectSyntaxOptions = {}) {
  if (opts.stripComments) {
    code = stripComments(code);
  }
  // We strip comments once hence not passing opts down to hasESMSyntax and hasCJSSyntax
  const hasESM = hasESMSyntax(code, {});
  const hasCJS = hasCJSSyntax(code, {});

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
   * @default ['node', 'file', 'data']
   *
   */
  allowedProtocols?: Array<string>;
  /**
   * Whether to strip comments from the code before checking for ESM syntax.
   *
   * @default false
   */
  stripComments?: boolean;
}

const validNodeImportDefaults: ValidNodeImportOptions = {
  allowedProtocols: ["node", "file", "data"],
};

/**
 * Validates whether a given identifier represents a valid node import, based on its protocol, file extension, and optionally its contents.
 *
 * @param {string} id - The identifier or URL of the import to validate.
 * @param {ValidNodeImportOptions} _options - Options for resolving and validating the import. See {@link ValidNodeImportOptions}.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the import is valid, otherwise `false`.
 */
export async function isValidNodeImport(
  id: string,
  _options: ValidNodeImportOptions = {},
): Promise<boolean> {
  if (isNodeBuiltin(id)) {
    return true;
  }

  const options = { ...validNodeImportDefaults, ..._options };

  const proto = getProtocol(id);
  if (proto && !options.allowedProtocols?.includes(proto)) {
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

  return !hasESMSyntax(code, { stripComments: options.stripComments });
}
