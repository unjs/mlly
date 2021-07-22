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

This utility creates a compatible CommonJS context that is missing in ECMAScript modules.

```js
import { createCommonJS } from 'mlly'

const { __dirname, __filename, require } = createCommonJS(import.meta)
```

## Resolving Modules

### `resolve`

Resolve a module by respecting [ECMAScript Resolver algorithm](https://nodejs.org/dist/latest-v14.x/docs/api/esm.html#esm_resolver_algorithm)
(internally using [wooorm/import-meta-resolve](https://github.com/wooorm/import-meta-resolve) that exposes Node.js implementation).

```js
import { resolve } from 'mlly'

// file:///home/user/project/module.mjs
console.log(await resolve('./module.mjs', { from: import.meta.url }))
```

**Resolve options:**

- `from`: URL or string (default is `pwd()`)
- `conditions`: Array of conditions used for resolution algorithm (default is `['node', 'import']`)

### `resolvePath`

Similar to `resolve` but returns a path instead of URL using `fileURLToPath`.

```js
import { resolvePath } from 'mlly'

// //home/user/project/module.mjs
console.log(await resolvePath('./module.mjs', { from: import.meta.url }))
```

### `createResolve`

Create a `resolve` function with defaults.

```js
import { createResolve } from 'mlly'

const _resolve = createResolve({ from: import.meta.url })

// file:///home/user/project/module.mjs
console.log(await _resolve('./module.mjs'))
```

**Example:** Ponyfill [import.meta.resolve](https://nodejs.org/api/esm.html#esm_import_meta_resolve_specifier_parent):

```js
import { createResolve } from 'mlly'

import.meta.resolve = createResolve({ from: import.meta.url })
```

### `resolveImports`

Resolve all static and dynamic imports with relative paths to full resolved path.

```js
import { resolveImports } from 'mlly'

// import foo from 'file:///home/user/project/bar.mjs'
console.log(await resolveImports(`import foo from './bar.mjs'`, { from: import.meta.url }))
```

## Evaluating Moduls

### `loadModule`

Dynamically loads a module by evaluating source code.

```js
import { loadModule } from 'mlly'

await loadModule('./hello.mjs', { from: import.meta.url })
```

Options are same as `evalModule`.

### `evalModule`

Evaluates JavaScript module code using dynamic imports with [`data:`](https://nodejs.org/api/esm.html#esm_data_imports) using `toDataURL`.

```js
import { evalModule } from 'mlly'

await evalModule(`console.log("Hello World!")`)

await evalModule(`
  import { reverse } from './utils.mjs'
  console.log(reverse('!emosewa si sj'))
`, { from: import.meta.url })
```

**Options:**

- [all `resolve` options]
- `url`: File URL

### `readModule`

Resolve module path and read source contents. (currently only file protocol supported)

```js
import { resolve, readModule } from 'mlly'

const indexPath = await resolve('./index.mjs', { from: import.meta.url })

// { code: '...", url: '...' }
console.log(await readModule(indexPath))
```

Options are same as `resolve`.

### `toDataURL`

Convert code to [`data:`](https://nodejs.org/api/esm.html#esm_data_imports) URL using base64 encoding.

All relative imports will be automatically resolved with `from` param using `resolveImports`.

If `url` option is provided, all usages of `import.meta.url` will be rewritten too.

```js
import { toDataURL } from 'mlly'

console.log(await toDataURL(`
  // This is an example
  console.log('Hello world')
`))
```

Options are same as `evalModule`.

## Other utils

### `fileURLToPath`

Similar to [url.fileURLToPath](https://nodejs.org/api/url.html#url_url_fileurltopath_url) but also converts windows backslash `\` to unix slash `/` and handles if input is already a path.

```js
import { fileURLToPath } from 'mlly'

// /foo/bar.js
console.log(fileURLToPath('file:///foo/bar.js'))

// C:/path
console.log(fileURLToPath('file:///C:/path/'))
```

### `normalizeid`

Ensures id has either of `node:`, `data:`, `http:`, `https:` or `file:` protocols.

```js
import { ensureProtocol } from 'mlly'

// file:///foo/bar.js
console.log(normalizeid('/foo/bar.js'))
```

## License

MIT
