import { resolve } from "./resolve";
import { loadURL, toDataURL } from "./utils";
import type { ResolveOptions } from "./resolve";

/**
 * Options for evaluating or transforming modules, extending resolution options with optional URL specifications.
 */
export interface EvaluateOptions extends ResolveOptions {
  /**
   * The URL of the module, which can be specified to override the URL resolved from the module identifier.
   * @optional
   */
  url?: string;
}

const EVAL_ESM_IMPORT_RE =
  /(?<=import .* from ["'])[^"']+(?=["'])|(?<=export .* from ["'])[^"']+(?=["'])|(?<=import\s*["'])[^"']+(?=["'])|(?<=import\s*\(["'])[^"']+(?=["']\))/g;

/**
 * Loads a module by resolving its identifier to a URL, fetching the module's code and evaluating it.
 *
 * @param {string} id - The identifier of the module to load.
 * @param {EvaluateOptions} options - Optional parameters to resolve and load the module. See {@link EvaluateOptions}.
 * @returns {Promise<any>} A promise to resolve to the evaluated module.
 * });
 */
export async function loadModule(
  id: string,
  options: EvaluateOptions = {},
): Promise<any> {
  const url = await resolve(id, options);
  const code = await loadURL(url);
  return evalModule(code, { ...options, url });
}

/**
 * Evaluates JavaScript code as a module using a dynamic import from a data URL.
 *
 * @param {string} code - The code of the module to evaluate.
 * @param {EvaluateOptions} options - Includes the original URL of the module for better error mapping. See {@link EvaluateOptions}.
 * @returns {Promise<any>} A promise that resolves to the evaluated module or throws an error if the evaluation fails.
 */
export async function evalModule(
  code: string,
  options: EvaluateOptions = {},
): Promise<any> {
  const transformed = await transformModule(code, options);
  const dataURL = toDataURL(transformed);
  return import(dataURL).catch((error) => {
    error.stack = error.stack.replace(
      new RegExp(dataURL, "g"),
      options.url || "_mlly_eval_",
    );
    throw error;
  });
}

/**
 * Transform module code to handle specific scenarios, such as converting JSON to a module or rewriting import.meta.url.
 *
 * @param {string} code - The code of the module to transform.
 * @param {EvaluateOptions} options - Options to control how the code is transformed. See {@link EvaluateOptions}.
 * @returns {Promise<string>} A promise that resolves to the transformed code.
 */
export function transformModule(
  code: string,
  options: EvaluateOptions = {},
): Promise<string> {
  // Convert JSON to module
  if (options.url && options.url.endsWith(".json")) {
    return Promise.resolve("export default " + code);
  }

  // Rewrite import.meta.url
  if (options.url) {
    code = code.replace(/import\.meta\.url/g, `'${options.url}'`);
  }

  return Promise.resolve(code);
}

/**
 * Resolves all import URLs found within the provided code to their absolute URLs, based on the given options.
 *
 * @param {string} code - The code containing the import directives to resolve.
 * @param {EvaluateOptions} [options] - Options to use for resolving imports. See {@link EvaluateOptions}.
 * @returns {Promise<string>} A promise that resolves to the code, replacing import URLs with resolved URLs.
 */
export async function resolveImports(
  code: string,
  options?: EvaluateOptions,
): Promise<string> {
  const imports = [...code.matchAll(EVAL_ESM_IMPORT_RE)].map((m) => m[0]);
  if (imports.length === 0) {
    return code;
  }

  const uniqueImports = [...new Set(imports)];
  const resolved = new Map();
  await Promise.all(
    uniqueImports.map(async (id) => {
      let url = await resolve(id, options);
      if (url.endsWith(".json")) {
        const code = await loadURL(url);
        url = toDataURL(await transformModule(code, { url }));
      }
      resolved.set(id, url);
    }),
  );

  const re = new RegExp(
    uniqueImports.map((index) => `(?:${index})`).join("|"),
    "g",
  );
  return code.replace(re, (id) => resolved.get(id));
}
