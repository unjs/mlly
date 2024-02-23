import { tokenizer } from "acorn";
import { matchAll, clearImports, getImportNames } from "./_utils";
import { resolvePath, ResolveOptions } from "./resolve";
import { loadURL } from "./utils";

export interface ESMImport {
  type: "static" | "dynamic";
  code: string;
  start: number;
  end: number;
}

export interface StaticImport extends ESMImport {
  type: "static";
  imports: string;
  specifier: string;
}

export interface ParsedStaticImport extends StaticImport {
  defaultImport?: string;
  namespacedImport?: string;
  namedImports?: { [name: string]: string };
}

export interface DynamicImport extends ESMImport {
  type: "dynamic";
  expression: string;
}

export interface TypeImport extends Omit<ESMImport, "type"> {
  type: "type";
  imports: string;
  specifier: string;
}

export interface ESMExport {
  _type?: "declaration" | "named" | "default" | "star";
  type: "declaration" | "named" | "default" | "star";
  declarationType?:
    | "let"
    | "var"
    | "const"
    | "enum"
    | "const enum"
    | "class"
    | "function"
    | "async function";
  code: string;
  start: number;
  end: number;
  name?: string;
  defaultName?: string;
  names: string[];
  specifier?: string;
}

export interface DeclarationExport extends ESMExport {
  type: "declaration";
  declaration: string;
  name: string;
}

export interface NamedExport extends ESMExport {
  type: "named";
  exports: string;
  names: string[];
  specifier?: string;
}

export interface DefaultExport extends ESMExport {
  type: "default";
}

export const ESM_STATIC_IMPORT_RE =
  /(?<=\s|^|;|\})import\s*([\s"']*(?<imports>[\p{L}\p{M}\w\t\n\r $*,/{}@.]+)from\s*)?["']\s*(?<specifier>(?<="\s*)[^"]*[^\s"](?=\s*")|(?<='\s*)[^']*[^\s'](?=\s*'))\s*["'][\s;]*/gmu;
export const DYNAMIC_IMPORT_RE =
  /import\s*\((?<expression>(?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*)\)/gm;
const IMPORT_NAMED_TYPE_RE =
  /(?<=\s|^|;|})import\s*type\s+([\s"']*(?<imports>[\w\t\n\r $*,/{}]+)from\s*)?["']\s*(?<specifier>(?<="\s*)[^"]*[^\s"](?=\s*")|(?<='\s*)[^']*[^\s'](?=\s*'))\s*["'][\s;]*/gm;

export const EXPORT_DECAL_RE =
  /\bexport\s+(?<declaration>(async function\s*\*?|function\s*\*?|let|const enum|const|enum|var|class))\s+\*?(?<name>[\w$]+)(?<extraNames>.*,\s*[\w$]+)*/g;
export const EXPORT_DECAL_TYPE_RE =
  /\bexport\s+(?<declaration>(interface|type|declare (async function|function|let|const enum|const|enum|var|class)))\s+(?<name>[\w$]+)/g;
const EXPORT_NAMED_RE =
  /\bexport\s+{(?<exports>[^}]+?)[\s,]*}(\s*from\s*["']\s*(?<specifier>(?<="\s*)[^"]*[^\s"](?=\s*")|(?<='\s*)[^']*[^\s'](?=\s*'))\s*["'][^\n;]*)?/g;
const EXPORT_NAMED_TYPE_RE =
  /\bexport\s+type\s+{(?<exports>[^}]+?)[\s,]*}(\s*from\s*["']\s*(?<specifier>(?<="\s*)[^"]*[^\s"](?=\s*")|(?<='\s*)[^']*[^\s'](?=\s*'))\s*["'][^\n;]*)?/g;
const EXPORT_NAMED_DESTRUCT =
  /\bexport\s+(let|var|const)\s+(?:{(?<exports1>[^}]+?)[\s,]*}|\[(?<exports2>[^\]]+?)[\s,]*])\s+=/gm;
const EXPORT_STAR_RE =
  /\bexport\s*(\*)(\s*as\s+(?<name>[\w$]+)\s+)?\s*(\s*from\s*["']\s*(?<specifier>(?<="\s*)[^"]*[^\s"](?=\s*")|(?<='\s*)[^']*[^\s'](?=\s*'))\s*["'][^\n;]*)?/g;
const EXPORT_DEFAULT_RE =
  /\bexport\s+default\s+(async function|function|class|true|false|\W|\d)|\bexport\s+default\s+(?<defaultName>.*)/g;
const TYPE_RE = /^\s*?type\s/;

export function findStaticImports(code: string): StaticImport[] {
  return _filterStatement(
    _tryGetLocations(code, "import"),
    matchAll(ESM_STATIC_IMPORT_RE, code, { type: "static" }),
  );
}

export function findDynamicImports(code: string): DynamicImport[] {
  return _filterStatement(
    _tryGetLocations(code, "import"),
    matchAll(DYNAMIC_IMPORT_RE, code, { type: "dynamic" }),
  );
}

export function findTypeImports(code: string): TypeImport[] {
  return [
    ...matchAll(IMPORT_NAMED_TYPE_RE, code, { type: "type" }),
    ...matchAll(ESM_STATIC_IMPORT_RE, code, { type: "static" }).filter(
      (match) => /[^A-Za-z]type\s/.test(match.imports),
    ),
  ];
}

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
      const extraNames = matchAll(/,\s*(?<name>\w+)/g, extraNamesStr, {}).map(
        (m) => m.name,
      );
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
  // eslint-disable-next-line unicorn/no-array-push-push
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

export function findExportNames(code: string): string[] {
  return findExports(code)
    .flatMap((exp) => exp.names)
    .filter(Boolean);
}

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
  } catch {}
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
