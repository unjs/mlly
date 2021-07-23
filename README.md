# 🤝 mlly

> Missing [ECMAScript module](https://nodejs.org/api/esm.html) utils for Node.js


## Usage

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
import { } from 'mlly'
```

## At a glance

While ESM Modules are evolving in Node.js ecosystem, there are still many required features that are still experimental or missing. This package tries to fill in the gap for them.

- Utils to create compatible CommonJS context
- Resolve Utils
  - Exposed from native Node.js implementation
  - Windows paths normalized
  - Supporting custom `extensions` and `/index` resolution
  - Supporting custom `conditions`
- Module Evaluation
  - Allow evaluating modules using `data:` imports
  - Automatic import rewrite to resolved path using static analyzes
  - Allow bypass ESM Cache
  - Stack-trace support
  - `.json` loader
- Multiple composable module utils exposed

## CommonJS Context

### `createCommonJS`

This utility creates a compatible CommonJS context that is missing in ECMAScript modules.

```js
import { createCommonJS } from 'mlly'

const { __dirname, __filename, require } = createCommonJS(import.meta.url)
```

Note: `require` and `require.resolve` implementation are lazy functions. [`createRequire`](https://nodejs.org/api/module.html#module_module_createrequire_filename) will be called on first usage.

## Resolving Modules

### `resolve`

Resolve a module by respecting [ECMAScript Resolver algorithm](https://nodejs.org/dist/latest-v14.x/docs/api/esm.html#esm_resolver_algorithm)
(internally using [wooorm/import-meta-resolve](https://github.com/wooorm/import-meta-resolve) that exposes Node.js implementation).

Additionally supports resolving without extension and `/index` similar to CommonJS.

```js
import { resolve } from 'mlly'

// file:///home/user/project/module.mjs
console.log(await resolve('./module.mjs', { url: import.meta.url }))
```

**Resolve options:**

- `from`: URL or string (default is `pwd()`)
- `conditions`: Array of conditions used for resolution algorithm (default is `['node', 'import']`)
- `extensions`: Array of additional extensions to check if import failed (default is `['.mjs', '.cjs', '.js', '.json']`)

### `resolvePath`

Similar to `resolve` but returns a path instead of URL using `fileURLToPath`.

```js
import { resolvePath } from 'mlly'

// //home/user/project/module.mjs
console.log(await resolvePath('./module.mjs', { url: import.meta.url }))
```

### `createResolve`

Create a `resolve` function with defaults.

```js
import { createResolve } from 'mlly'

const _resolve = createResolve({ url: import.meta.url })

// file:///home/user/project/module.mjs
console.log(await _resolve('./module.mjs'))
```

**Example:** Ponyfill [import.meta.resolve](https://nodejs.org/api/esm.html#esm_import_meta_resolve_specifier_parent):

```js
import { createResolve } from 'mlly'

import.meta.resolve = createResolve({ url: import.meta.url })
```

### `resolveImports`

Resolve all static and dynamic imports with relative paths to full resolved path.

```js
import { resolveImports } from 'mlly'

// import foo from 'file:///home/user/project/bar.mjs'
console.log(await resolveImports(`import foo from './bar.mjs'`, { url: import.meta.url }))
```

## Evaluating Moduls

### `evalModule`

Transform and evaluates module code using dynamic imports.

```js
import { evalModule } from 'mlly'

await evalModule(`console.log("Hello World!")`)

await evalModule(`
  import { reverse } from './utils.mjs'
  console.log(reverse('!emosewa si sj'))
`, { url: import.meta.url })
```

**Options:**

- all `resolve` options
- `url`: File URL

### `loadModule`

Dynamically loads a module by evaluating source code.

```js
import { loadModule } from 'mlly'

await loadModule('./hello.mjs', { url: import.meta.url })
```

Options are same as `evalModule`.

### `transformModule`

- Resolves all relative imports will be resolved
- All usages of `import.meta.url` will be replaced with `url` or `from` option

```js
import { toDataURL } from 'mlly'
console.log(transformModule(`console.log(import.meta.url)`), { url: 'test.mjs' })
```

Options are same as `evalModule`.


## Other Utils

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

### `loadURL`

Read source contents of a URL. (currently only file protocol supported)

```js
import { resolve, loadURL } from 'mlly'

const url = await resolve('./index.mjs', { url: import.meta.url })
console.log(await loadURL(url))
```

### `toDataURL`

Convert code to [`data:`](https://nodejs.org/api/esm.html#esm_data_imports) URL using base64 encoding.

```js
import { toDataURL } from 'mlly'

console.log(toDataURL(`
  // This is an example
  console.log('Hello world')
`))
```

## License

MIT
