import { resolvePath, createResolve, resolveImports } from "mlly";

const resolve = createResolve({ url: import.meta.url });
console.log(await resolve("./cjs.mjs"));

console.log(await resolvePath("./cjs.mjs", { url: import.meta.url }));
console.log(await resolvePath("./foo", { url: import.meta.url }));

console.log(
  await resolveImports("import foo from './eval.mjs'", { url: import.meta.url })
);
