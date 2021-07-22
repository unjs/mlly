import { createResolve } from 'mlly'

const _resolve = createResolve(import.meta)

console.log(await _resolve('./cjs.mjs'))
