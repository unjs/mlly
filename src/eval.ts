import { resolve } from "./resolve";
import { loadURL, toDataURL } from "./utils";
import type { ResolveOptions } from "./resolve";

export interface EvaluateOptions extends ResolveOptions {
  url?: string;
}

const EVAL_ESM_IMPORT_RE =
  /(?<=import .* from ["'])([^"']+)(?=["'])|(?<=export .* from ["'])([^"']+)(?=["'])|(?<=import\s*["'])([^"']+)(?=["'])|(?<=import\s*\(["'])([^"']+)(?=["']\))/g;

export async function loadModule(
  id: string,
  options: EvaluateOptions = {}
): Promise<any> {
  const url = await resolve(id, options);
  const code = await loadURL(url);
  return evalModule(code, { ...options, url });
}

export async function evalModule(
  code: string,
  options: EvaluateOptions = {}
): Promise<any> {
  const transformed = await transformModule(code, options);
  const dataURL = toDataURL(transformed);
  return import(dataURL).catch((error) => {
    error.stack = error.stack.replace(
      new RegExp(dataURL, "g"),
      options.url || "_mlly_eval_"
    );
    throw error;
  });
}

export function transformModule(
  code: string,
  options?: EvaluateOptions
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

export async function resolveImports(
  code: string,
  options?: EvaluateOptions
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
    })
  );

  const re = new RegExp(
    uniqueImports.map((index) => `(${index})`).join("|"),
    "g"
  );
  return code.replace(re, (id) => resolved.get(id));
}
