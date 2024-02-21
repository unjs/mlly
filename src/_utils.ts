import { builtinModules } from "node:module";

export const BUILTIN_MODULES = new Set(builtinModules);

export function normalizeSlash(string_) {
  return string_.replace(/\\/g, "/");
}

export function isObject(value) {
  return value !== null && typeof value === "object";
}

export function matchAll(regex, string, addition) {
  const matches = [];
  for (const match of string.matchAll(regex)) {
    matches.push({
      ...addition,
      ...match.groups,
      code: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return matches;
}

export function clearImports(imports: string) {
  return (imports || "")
    .replace(/(\/\/[^\n]*\n|\/\*.*\*\/)/g, "")
    .replace(/\s+/g, " ");
}

export function getImportNames(cleanedImports: string) {
  const topLevelImports = cleanedImports.replace(/{([^}]*)}/, "");
  const namespacedImport = topLevelImports.match(/\* as \s*(\S*)/)?.[1];
  const defaultImport =
    topLevelImports
      .split(",")
      .find((index) => !/[*{}]/.test(index))
      ?.trim() || undefined;

  return {
    namespacedImport,
    defaultImport,
  };
}
