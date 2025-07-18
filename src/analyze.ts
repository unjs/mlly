import { tokenizer } from "acorn";
import { matchAll, clearImports, getImportNames } from "./_utils";
import { resolvePath, type ResolveOptions } from "./resolve";
import { loadURL } from "./utils";

/**
 * Represents a general structure for ECMAScript module imports.
 */
export interface ESMImport {
  /**
   * Specifies the type of import: "static" for static imports and "dynamic" for dynamic imports.
   */
  type: "static" | "dynamic";

  /**
   * The full import declaration code snippet as a string.
   */
  code: string;

  /**
   * The starting position (index) of the import declaration in the source code.
   */
  start: number;

  /**
   * The end position (index) of the import declaration in the source code.
   */
  end: number;
}

/**
 * Represents a static import declaration in an ECMAScript module.
 * Extends {@link ESMImport}.
 */
export interface StaticImport extends ESMImport {
  /**
   * Indicates the type of import, specifically a static import.
   */
  type: "static";

  /**
   * Contains the entire import statement as a string, excluding the module specifier.
   */
  imports: string;

  /**
   * The module specifier from which imports are being brought in.
   */
  specifier: string;
}

/**
 * Represents a parsed static import declaration with detailed components of the import.
 * Extends {@link StaticImport}.
 */
export interface ParsedStaticImport extends StaticImport {
  /**
   * The default import name, if any.
   * @optional
   */
  defaultImport?: string;

  /**
   * The namespace import name, if any, using the `* as` syntax.
   * @optional
   */
  namespacedImport?: string;

  /**
   * An object representing named imports, with their local aliases if specified.
   * Each property key is the original name and its value is the alias.
   * @optional
   */
  namedImports?: { [name: string]: string };
}

/**
 * Represents a dynamic import declaration that is loaded at runtime.
 * Extends {@link ESMImport}.
 */
export interface DynamicImport extends ESMImport {
  /**
   * Indicates that this is a dynamic import.
   */
  type: "dynamic";

  /**
   * The expression or path to be dynamically imported, typically a module path or URL.
   */
  expression: string;
}

/**
 * Represents a type-specific import, primarily used for importing types in TypeScript.
 * Extends {@link ESMImport} but omits the 'type' to redefine it specifically for type imports.
 */
export interface TypeImport extends Omit<ESMImport, "type"> {
  /**
   * Specifies that this is a type import.
   */
  type: "type";

  /**
   * Contains the entire type import statement as a string, excluding the module specifier.
   */
  imports: string;

  /**
   * The module specifier from which to import types.
   */
  specifier: string;
}

/**
 * Represents a general structure for ECMAScript module exports.
 */
export interface ESMExport {
  /**
   * Optional explicit type for complex scenarios, often used internally.
   * @optional
   */
  _type?: "declaration" | "named" | "default" | "star";

  /**
   * The type of export (declaration, named, default or star).
   */
  type: "declaration" | "named" | "default" | "star";

  /**
   * The specific type of declaration being exported, if applicable.
   * @optional
   */
  declarationType?:
    | "let"
    | "var"
    | "const"
    | "enum"
    | "const enum"
    | "class"
    | "function"
    | "async function";

  /**
   * The full code snippet of the export statement.
   */
  code: string;

  /**
   * The starting position (index) of the export declaration in the source code.
   */
  start: number;

  /**
   * The end position (index) of the export declaration in the source code.
   */
  end: number;

  /**
   * The name of the variable, function or class being exported, if given explicitly.
   * @optional
   */
  name?: string;

  /**
   * The name used for default exports when a specific identifier isn't given.
   * @optional
   */
  defaultName?: string;

  /**
   * An array of names to export, applicable to named and destructured exports.
   */
  names: string[];

  /**
   * The module specifier, if any, from which exports are being re-exported.
   * @optional
   */
  specifier?: string;
}

/**
 * Represents a declaration export within an ECMAScript module.
 * Extends {@link ESMExport}.
 */
export interface DeclarationExport extends ESMExport {
  /**
   * Indicates that this export is a declaration export.
   */
  type: "declaration";

  /**
   * The declaration string, such as 'let', 'const', 'class', etc., describing what is being exported.
   */
  declaration: string;

  /**
   * The name of the declaration to be exported.
   */
  name: string;
}

/**
 * Represents a named export within an ECMAScript module.
 * Extends {@link ESMExport}.
 */
export interface NamedExport extends ESMExport {
  /**
   * Specifies that this export is a named export.
   */
  type: "named";

  /**
   * The export string, containing all exported identifiers.
   */
  exports: string;

  /**
   * An array of names to export.
   */
  names: string[];

  /**
   * The module specifier, if any, from which exports are being re-exported.
   * @optional
   */
  specifier?: string;
}

/**
 * Represents a standard export within an ECMAScript module.
 * Extends {@link ESMExport}.
 */
export interface DefaultExport extends ESMExport {
  /**
   * Specifies that this export is a standard export.
   */
  type: "default";
}

/**
 * Regular expression to match static import statements in JavaScript/TypeScript code.
 * @example `import { foo, bar as baz } from 'module'`
 */
export const ESM_STATIC_IMPORT_RE =
  /(?<=\s|^|;|\})import\s*(?:[\s"']*(?<imports>[\p{L}\p{M}\w\t\n\r $*,/{}@.]+)from\s*)?["']\s*(?<specifier>(?<="\s*)[^"]*[^\s"](?=\s*")|(?<='\s*)[^']*[^\s'](?=\s*'))\s*["'][\s;]*/gmu;

/**
 * Regular expression to match dynamic import statements in JavaScript/TypeScript code.
 * @example `import('module')`
 */
export const DYNAMIC_IMPORT_RE =
  /import\s*\((?<expression>(?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*)\)/gm;
const IMPORT_NAMED_TYPE_RE =
  /(?<=\s|^|;|})import\s*type\s+(?:[\s"']*(?<imports>[\w\t\n\r $*,/{}]+)from\s*)?["']\s*(?<specifier>(?<="\s*)[^"]*[^\s"](?=\s*")|(?<='\s*)[^']*[^\s'](?=\s*'))\s*["'][\s;]*/gm;

/**
 * Regular expression to match various types of export declarations including variables, functions, and classes.
 * @example `export const num = 1, str = 'hello'; export class Example {}`
 */
export const EXPORT_DECAL_RE =
  /\bexport\s+(?<declaration>(?:async function\s*\*?|function\s*\*?|let|const enum|const|enum|var|class))\s+\*?(?<name>[\w$]+)(?<extraNames>.*,\s*[\s\w:[\]{}]*[\w$\]}]+)*/g;
/**
 * Regular expression to match export declarations specifically for types, interfaces, and type aliases in TypeScript.
 * @example `export type Result = { success: boolean; }; export interface User { name: string; age: number; };`
 */
export const EXPORT_DECAL_TYPE_RE =
  /\bexport\s+(?<declaration>(?:interface|type|declare (?:async function|function|let|const enum|const|enum|var|class)))\s+(?<name>[\w$]+)/g;
const EXPORT_NAMED_RE =
  /\bexport\s*{(?<exports>[^}]+?)[\s,]*}(?:\s*from\s*["']\s*(?<specifier>(?<="\s*)[^"]*[^\s"](?=\s*")|(?<='\s*)[^']*[^\s'](?=\s*'))\s*["'][^\n;]*)?/g;
const EXPORT_NAMED_TYPE_RE =
  /\bexport\s+type\s*{(?<exports>[^}]+?)[\s,]*}(?:\s*from\s*["']\s*(?<specifier>(?<="\s*)[^"]*[^\s"](?=\s*")|(?<='\s*)[^']*[^\s'](?=\s*'))\s*["'][^\n;]*)?/g;
const EXPORT_NAMED_DESTRUCT =
  /\bexport\s+(?:let|var|const)\s+(?:{(?<exports1>[^}]+?)[\s,]*}|\[(?<exports2>[^\]]+?)[\s,]*])\s+=/gm;
const EXPORT_STAR_RE =
  /\bexport\s*\*(?:\s*as\s+(?<name>[\w$]+)\s+)?\s*(?:\s*from\s*["']\s*(?<specifier>(?<="\s*)[^"]*[^\s"](?=\s*")|(?<='\s*)[^']*[^\s'](?=\s*'))\s*["'][^\n;]*)?/g;
const EXPORT_DEFAULT_RE =
  /\bexport\s+default\s+(async function|function|class|true|false|\W|\d)|\bexport\s+default\s+(?<defaultName>.*)/g;
const TYPE_RE = /^\s*?type\s/;

/**
 * Finds all static import statements within the given code string.
 * @param {string} code - The source code to search for static imports.
 * @returns {StaticImport[]} An array of {@link StaticImport} objects representing each static import found.
 */
export function findStaticImports(code: string): StaticImport[] {
  return _filterStatement(
    _tryGetLocations(code, "import"),
    matchAll(ESM_STATIC_IMPORT_RE, code, { type: "static" }),
  );
}

/**
 * Searches for dynamic import statements in the given source code.
 * @param {string} code - The source to search for dynamic imports in.
 * @returns {DynamicImport[]} An array of {@link DynamicImport} objects representing each dynamic import found.
 */
export function findDynamicImports(code: string): DynamicImport[] {
  return _filterStatement(
    _tryGetLocations(code, "import"),
    matchAll(DYNAMIC_IMPORT_RE, code, { type: "dynamic" }),
  );
}

/**
 * Identifies and returns all type import statements in the given source code.
 * This function is specifically targeted at type imports used in TypeScript.
 * @param {string} code - The source code to search for type imports.
 * @returns {TypeImport[]} An array of {@link TypeImport} objects representing each type import found.
 */
export function findTypeImports(code: string): TypeImport[] {
  return [
    ...matchAll(IMPORT_NAMED_TYPE_RE, code, { type: "type" }),
    ...matchAll(ESM_STATIC_IMPORT_RE, code, { type: "static" }).filter(
      (match) => /[^A-Za-z]type\s/.test(match.imports),
    ),
  ];
}

/**
 * Parses a static import or type import to extract detailed import elements such as default, namespace and named imports.
 * @param {StaticImport | TypeImport} matched - The matched import statement to parse. See {@link StaticImport} and {@link TypeImport}.
 * @returns {ParsedStaticImport} A structured object representing the parsed static import. See {@link ParsedStaticImport}.
 */
export function parseStaticImport(
  matched: StaticImport | TypeImport,
): ParsedStaticImport {
  const cleanedImports = clearImports(matched.imports);

  const namedImports: Record<string, string> = {};
  const _matches = cleanedImports.match(/{([^}]*)}/)?.[1]?.split(",") || [];
  for (const namedImport of _matches) {
    const _match = namedImport.match(/^\s*(\S*) as (\S*)\s*$/);
    const source = _match?.[1] || namedImport.trim();
    const importName = _match?.[2] || source;
    if (source && !TYPE_RE.test(source)) {
      namedImports[source] = importName;
    }
  }
  const { namespacedImport, defaultImport } = getImportNames(cleanedImports);

  return {
    ...matched,
    defaultImport,
    namespacedImport,
    namedImports,
  } as ParsedStaticImport;
}

/**
 * Parses a static import or type import to extract detailed import elements such as default, namespace and named imports.
 * @param {StaticImport | TypeImport} matched - The matched import statement to parse. See {@link StaticImport} and {@link TypeImport}.
 * @returns {ParsedStaticImport} A structured object representing the parsed static import. See {@link ParsedStaticImport}.
 */
export function parseTypeImport(
  matched: TypeImport | StaticImport,
): ParsedStaticImport {
  if (matched.type === "type") {
    return parseStaticImport(matched);
  }

  const cleanedImports = clearImports(matched.imports);

  const namedImports: Record<string, string> = {};
  const _matches = cleanedImports.match(/{([^}]*)}/)?.[1]?.split(",") || [];
  for (const namedImport of _matches) {
    const _match = /\s+as\s+/.test(namedImport)
      ? namedImport.match(/^\s*type\s+(\S*) as (\S*)\s*$/)
      : namedImport.match(/^\s*type\s+(\S*)\s*$/);
    const source = _match?.[1] || namedImport.trim();
    const importName = _match?.[2] || source;
    if (source && TYPE_RE.test(namedImport)) {
      namedImports[source] = importName;
    }
  }

  const { namespacedImport, defaultImport } = getImportNames(cleanedImports);

  return {
    ...matched,
    defaultImport,
    namespacedImport,
    namedImports,
  } as ParsedStaticImport;
}

/**
 * Identifies all export statements in the supplied source code and categorises them into different types such as declarations, named, default and star exports.
 * This function processes the code to capture different forms of export statements and normalise their representation for further processing.
 *
 * @param {string} code - The source code containing the export statements to be analysed.
 * @returns {ESMExport[]} An array of {@link ESMExport} objects representing each export found, properly categorised and structured.
 */
export function findExports(code: string): ESMExport[] {
  // Find declarations like export const foo = 'bar'
  const declaredExports: DeclarationExport[] = matchAll(EXPORT_DECAL_RE, code, {
    type: "declaration",
  });
  // Parse extra names (foo, bar)
  for (const declaredExport of declaredExports) {
    const extraNamesStr = (declaredExport as any).extraNames as
      | string
      | undefined;
    if (extraNamesStr) {
      const extraNames = matchAll(
        /({.*?})|(\[.*?])|(,\s*(?<name>\w+))/g,
        extraNamesStr,
        {},
      )
        .map((m) => m.name)
        .filter(Boolean);
      declaredExport.names = [declaredExport.name, ...extraNames];
    }
    delete (declaredExport as any).extraNames;
  }

  // Find named exports
  const namedExports: NamedExport[] = normalizeNamedExports(
    matchAll(EXPORT_NAMED_RE, code, {
      type: "named",
    }),
  );

  const destructuredExports: NamedExport[] = matchAll(
    EXPORT_NAMED_DESTRUCT,
    code,
    { type: "named" },
  );
  for (const namedExport of destructuredExports) {
    // @ts-expect-error groups
    namedExport.exports = namedExport.exports1 || namedExport.exports2;
    namedExport.names = namedExport.exports
      .replace(/^\r?\n?/, "")
      .split(/\s*,\s*/g)
      .filter((name) => !TYPE_RE.test(name))
      .map((name) =>
        name
          .replace(/^.*?\s*:\s*/, "")
          .replace(/\s*=\s*.*$/, "")
          .trim(),
      );
  }

  // Find export default
  const defaultExport: DefaultExport[] = matchAll(EXPORT_DEFAULT_RE, code, {
    type: "default",
    name: "default",
  });

  // Find export star
  const starExports: ESMExport[] = matchAll(EXPORT_STAR_RE, code, {
    type: "star",
  });

  // Merge and normalize exports

  const exports: ESMExport[] = normalizeExports([
    ...declaredExports,
    ...namedExports,
    ...destructuredExports,
    ...defaultExport,
    ...starExports,
  ]);

  // Return early when there is no  export statement
  if (exports.length === 0) {
    return [];
  }
  const exportLocations = _tryGetLocations(code, "export");
  if (exportLocations && exportLocations.length === 0) {
    return [];
  }

  return (
    // Filter false positive export matches
    _filterStatement(exportLocations, exports)
      // Prevent multiple exports of same function, only keep latest iteration of signatures
      .filter((exp, index, exports) => {
        const nextExport = exports[index + 1];
        return (
          !nextExport ||
          exp.type !== nextExport.type ||
          !exp.name ||
          exp.name !== nextExport.name
        );
      })
  );
}

/**
 * Searches specifically for type-related exports in TypeScript code, such as exported interfaces, types, and declarations prefixed with 'declare'.
 * This function uses specialised regular expressions to identify type exports and normalises them for consistency.
 *
 * @param {string} code - The TypeScript source code to search for type exports.
 * @returns {ESMExport[]} An array of {@link ESMExport} objects representing each type export found.
 */
export function findTypeExports(code: string): ESMExport[] {
  // Find declarations like export const foo = 'bar'
  const declaredExports: DeclarationExport[] = matchAll(
    EXPORT_DECAL_TYPE_RE,
    code,
    { type: "declaration" },
  );

  // Find named exports
  const namedExports: NamedExport[] = normalizeNamedExports(
    matchAll(EXPORT_NAMED_TYPE_RE, code, {
      type: "named",
    }),
  );

  // Merge and normalize exports
  const exports: ESMExport[] = normalizeExports([
    ...declaredExports,
    ...namedExports,
  ]);

  // Return early when there is no  export statement
  if (exports.length === 0) {
    return [];
  }
  const exportLocations = _tryGetLocations(code, "export");
  if (exportLocations && exportLocations.length === 0) {
    return [];
  }

  return (
    // Filter false positive export matches
    _filterStatement(exportLocations, exports)
      // Prevent multiple exports of same function, only keep latest iteration of signatures
      .filter((exp, index, exports) => {
        const nextExport = exports[index + 1];
        return (
          !nextExport ||
          exp.type !== nextExport.type ||
          !exp.name ||
          exp.name !== nextExport.name
        );
      })
  );
}

function normalizeExports(exports: (ESMExport & { declaration?: string })[]) {
  for (const exp of exports) {
    if (!exp.name && exp.names && exp.names.length === 1) {
      exp.name = exp.names[0];
    }
    if (exp.name === "default" && exp.type !== "default") {
      exp._type = exp.type;
      exp.type = "default";
    }
    if (!exp.names && exp.name) {
      exp.names = [exp.name];
    }
    if (exp.type === "declaration" && exp.declaration) {
      exp.declarationType = exp.declaration.replace(
        /^declare\s*/,
        "",
      ) as ESMExport["declarationType"];
    }
  }
  return exports;
}

function normalizeNamedExports(namedExports: NamedExport[]) {
  for (const namedExport of namedExports) {
    namedExport.names = namedExport.exports
      .replace(/^\r?\n?/, "")
      .split(/\s*,\s*/g)
      .filter((name) => !TYPE_RE.test(name))
      .map((name) => name.replace(/^.*?\sas\s/, "").trim());
  }
  return namedExports;
}

/**
 * Extracts and returns a list of all export names from the given source.
 * This function uses {@link findExports} to retrieve all types of exports and consolidates their names into a single array.
 *
 * @param {string} code - The source code to search for export names.
 * @returns {string[]} An array containing the names of all exports found in the code.
 */
export function findExportNames(code: string): string[] {
  return findExports(code)
    .flatMap((exp) => exp.names)
    .filter(Boolean);
}

/**
 * Asynchronously resolves and returns all export names from a module specified by its module identifier.
 * This function recursively resolves all explicitly named and asterisked (* as) exports to fully enumerate the exported identifiers.
 *
 * @param {string} id - The module identifier to resolve.
 * @param {ResolveOptions} [options] - Optional settings for resolving the module path, such as the base URL.
 * @returns {Promise<string[]>} A promise that resolves to an array of export names from the module.
 */
export async function resolveModuleExportNames(
  id: string,
  options?: ResolveOptions,
): Promise<string[]> {
  const url = await resolvePath(id, options);
  const code = await loadURL(url);
  const exports = findExports(code);

  // Explicit named exports
  const exportNames = new Set(
    exports.flatMap((exp) => exp.names).filter(Boolean),
  );

  // Recursive * exports
  for (const exp of exports) {
    if (exp.type !== "star" || !exp.specifier) {
      continue;
    }
    const subExports = await resolveModuleExportNames(exp.specifier, {
      ...options,
      url,
    });
    for (const subExport of subExports) {
      exportNames.add(subExport);
    }
  }

  return [...exportNames];
}

// --- Internal ---

interface TokenLocation {
  start: number;
  end: number;
}

function _filterStatement<T extends TokenLocation>(
  locations: TokenLocation[] | undefined,
  statements: T[],
): T[] {
  return statements.filter((exp) => {
    return (
      !locations ||
      locations.some((location) => {
        // AST token inside the regex match
        return exp.start <= location.start && exp.end >= location.end;
        // AST Token start or end is within the regex match
        // return (exp.start <= location.start && location.start <= exp.end) ||
        // (exp.start <= location.end && location.end <= exp.end)
      })
    );
  });
}

function _tryGetLocations(code: string, label: string) {
  try {
    return _getLocations(code, label);
  } catch {
    // Ignore error
  }
}

function _getLocations(code: string, label: string) {
  const tokens = tokenizer(code, {
    ecmaVersion: "latest",
    sourceType: "module",
    allowHashBang: true,
    allowAwaitOutsideFunction: true,
    allowImportExportEverywhere: true,
  });
  const locations: TokenLocation[] = [];
  for (const token of tokens) {
    if (token.type.label === label) {
      locations.push({
        start: token.start,
        end: token.end,
      });
    }
  }
  return locations;
}
