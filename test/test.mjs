import { createCommonJS } from 'mlly'

const cjs = createCommonJS(import.meta)

console.log(cjs.require('../package.json'))
console.log(cjs)
