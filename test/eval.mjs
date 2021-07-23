import { evalModule, loadModule, fileURLToPath } from 'mlly'

await evalModule('console.log("Eval works!")')

await evalModule(`
  import { reverse } from './utils.mjs'
  console.log(reverse('!emosewa si sj'))
`, {
  from: fileURLToPath(import.meta.url)
})

await loadModule('./hello.mjs', { from: import.meta.url })

console.log(await loadModule('../package.json', { from: import.meta.url }).then(r => r.default.name))
