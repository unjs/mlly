import { promises as fsp } from "node:fs";
import { extname } from "pathe";
import { readPackageJSON } from "pkg-types";
import { ResolveOptions, resolvePath } from "./resolve";
import { isNodeBuiltin, getProtocol } from "./utils";

const ESM_RE =
  /(?:[\s;]|^)(?:import[\s\w*,{}]*from|import\s*["'*{]|export\b\s*(?:[*{]|default|class|type|function|const|var|let|async function)|import\.meta\b)/m;

const CJS_RE =
  /(?:[\s;]|^)(?:module\.exports\b|exports\.\w|require\s*\(|global\.\w)/m;

const CHAR_SLASH = 47; // /
const CHAR_STAR = 42; // *
const CHAR_BACKSLASH = 92; // \
const CHAR_LF = 10;
const CHAR_CR = 13;
const CHAR_DOUBLE_QUOTE = 34; // "
const CHAR_SINGLE_QUOTE = 39; // '
const CHAR_BACKTICK = 96; // `

/**
 * Skips over a string literal starting at `start` (the opening quote) and
 * returns the index just past its closing quote. An unterminated single- or
 * double-quoted literal ends at the line break, so a stray quote in the source
 * cannot swallow the rest of the input.
 */
function skipString(code: string, start: number): number {
  const quote = code.charCodeAt(start);
  const isTemplate = quote === CHAR_BACKTICK;
  for (let index = start + 1; index < code.length; index++) {
    const char = code.charCodeAt(index);
    if (char === CHAR_BACKSLASH) {
      index++; // Skip the escaped character.
      continue;
    }
    if (char === quote) {
      return index + 1;
    }
    if (!isTemplate && (char === CHAR_LF || char === CHAR_CR)) {
      return index; // Unterminated literal: stop at the line break.
    }
  }
  return code.length;
}

/**
 * Removes line and block comments from `code` while leaving `//` and `/* *\/`
 * sequences that appear inside string or template literals untouched.
 *
 * Each comment is replaced by a space, or by a line break when it spanned one,
 * so that neighbouring tokens are not glued together and the line structure the
 * syntax patterns rely on is preserved.
 */
function stripComments(code: string): string {
  if (!code.includes("/")) {
    return code;
  }

  let result = "";
  let chunkStart = 0;
  let index = 0;

  while (index < code.length) {
    const char = code.charCodeAt(index);

    if (char === CHAR_DOUBLE_QUOTE || char === CHAR_SINGLE_QUOTE) {
      index = skipString(code, index);
      continue;
    }

    if (char === CHAR_BACKTICK) {
      // A template literal may embed `${...}` expressions containing comments,
      // but skipping the whole literal keeps the scanner simple and can only
      // leave a comment in place, never remove real code.
      index = skipString(code, index);
      continue;
    }

    if (char !== CHAR_SLASH) {
      index++;
      continue;
    }

    const next = code.charCodeAt(index + 1);

    if (next === CHAR_SLASH) {
      result += code.slice(chunkStart, index) + " ";
      index += 2;
      while (index < code.length) {
        const inner = code.charCodeAt(index);
        if (inner === CHAR_LF || inner === CHAR_CR) {
          break;
        }
        index++;
      }
      chunkStart = index;
      continue;
    }

    if (next === CHAR_STAR) {
      const end = code.indexOf("*/", index + 2);
      const stop = end === -1 ? code.length : end + 2;
      const spansLines = /[\n\r]/.test(code.slice(index + 2, stop));
      result += code.slice(chunkStart, index) + (spansLines ? "\n" : " ");
      index = stop;
      chunkStart = index;
      continue;
    }

    index++;
  }

  return result + code.slice(chunkStart);
}

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

  if (/\.(?:\w+-)?esm?(?:-\w+)?\.js$|\/esm?\//.test(resolvedPath)) {
    return false;
  }

  const code =
    options.code ||
    (await fsp.readFile(resolvedPath, "utf8").catch(() => {})) ||
    "";

  return !hasESMSyntax(code, { stripComments: options.stripComments });
}
