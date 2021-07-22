import { resolvePath, createResolve, resolveImports } from 'mlly'

import.meta.resolve = createResolve({ from : import.meta.url })
console.log(await import.meta.resolve('./cjs.mjs'))

console.log(await resolvePath('./cjs.mjs', { from: import.meta.url }))

console.log(await resolveImports(`import foo from './eval.mjs'`, { from: import.meta.url }))
