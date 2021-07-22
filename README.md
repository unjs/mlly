# 🤝 mlly

> Missing [ECMAScript module](https://nodejs.org/api/esm.html) utils for Node.js


## Install

> This package is ESM only. Node.js 12+ is needed to use it and it must be imported instead of required.

Install npm package:

```sh
# using yarn
yarn add mlly

# using npm
npm install mlly
```

Import utils:

```js
import {} from 'mlly'
```

## CommonJS Context

### `createCommonJS`

This utility creates a compatible context that we loose when migrating to ECMA modules.

```js
import { createCommonJS } from 'mlly'

const { __dirname, __filename, require } = createCommonJS(import.meta)
```

## Resolving Modules

There are several utils exposed allow resolving another module URL or Path. (internally using [wooorm/import-meta-resolve](https://github.com/wooorm/import-meta-resolve) that re-exports Node.js code).

- **`resolve(id, resolveOptions?)`**
- **`resolvePath(id, resolveOptions?)`**
- **`createResolve(import.meta)`** | **`createResolve(base)`**
- `resolveSync(id, resolveOptions?)`
- `resolvePathSync(id, resolveOptions?)`

It is recommended to use `resolve` and `createResolve` since module resolution spec allows aync resolution.

```js
import { resolve, resolvePath, createResolve } from 'mlly'

// //home/user/project/module.mjs
console.log(await resolvePath('./module.mjs', { from: import.meta.url }))

// file:///home/user/project/module.mjs
console.log(await resolve('./module.mjs', { from: import.meta.url }))

// file:///home/user/project/module.mjs
const _resolve = createResolve(import.meta)

console.log(await _resolve('./module.mjs'))
```

**Resolve options:**

- `from`: URL or string (default is `pwd()`)
- `conditions`: Array of conditions used for resolution algorithm (default is `['node', 'import']`)


## Evaluating Moduls

### `loadModule`

Dynamically loads a module by evaluating source code. (useful to bypass import cache)

```js
import { loadModule } from 'mlly'

await loadModule('./hello.mjs', { from: import.meta.url })
```

### `evalModule`

Evaluates JavaScript module code using dynamic [`data:`](https://nodejs.org/api/esm.html#esm_data_imports) import.

```js
import { evalModule } from 'mlly'

await evalModule(`console.log("Hello World!")`)

await evalModule(`
  import { reverse } from './utils.mjs'
  console.log(reverse('!emosewa si sj'))
`, {
  from: import.meta.url
})
```

### `readModule`

Resolves id using `resolve` and reads source code.

```js
import { readModule } from 'mlly'

console.log(await readModule('./index.mjs', import.meta.url))
```

### `toDataURL`

Convert code to [`data:`](https://nodejs.org/api/esm.html#esm_data_imports) URL using base64 encoding.

```js
import { toDataURL } from 'mlly'

console.log(await toDataURL(`
  // This is an example
  console.log('Hello world')
`))
```

## Path utils

### `fileURLToPath`

Similar to [url.fileURLToPath](https://nodejs.org/api/url.html#url_url_fileurltopath_url) but also converts windows backslash `\` to unix slash `/`

```js
import { fileURLToPath } from 'mlly'

// /foo/bar.js
console.log(fileURLToPath('file:///foo/bar.js'))

// C:/path
console.log(fileURLToPath('file:///C:/path/'))
```

## License

MIT
