import { resolvePath, createResolve } from 'mlly'

const importResolve = createResolve(import.meta)
console.log(await importResolve('./cjs.mjs'))

console.log(await resolvePath('./cjs.mjs', import.meta.url))
