import { builtinModules } from "node:module";

export const BUILTIN_MODULES = new Set(builtinModules);

export function normalizeSlash(string_) {
  return string_.replace(/\\/g, "/");
}

export function pcall<TFn extends (...args: any[]) => any>(
  function_: TFn,
  ...arguments_: Parameters<TFn>
): Promise<ReturnType<TFn>> {
  try {
    return Promise.resolve(function_(...arguments_)).catch((error) =>
      perr(error)
    );
  } catch (error) {
    return perr(error);
  }
}

export function perr(_error) {
  const error = new Error(_error);
  error.code = _error.code;
  Error.captureStackTrace(error, pcall);
  return Promise.reject(error);
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
