import { createCommonJS } from "mlly";

const cjs = createCommonJS(import.meta.url);

console.log(cjs);
console.log(cjs.require.resolve("../../package.json"));
