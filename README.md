# 🤝 mlly

> [ECMAScript module](https://nodejs.org/api/esm.html) helpers for Node.js


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
import { resolve } from 'mlly'
```

## Resolving Modules

There are several utils exposed allow resolving another module URL or Path. (internally using [wooorm/import-meta-resolve](https://github.com/wooorm/import-meta-resolve) that re-exports Node.js code).

- **`resolve(specifier, opts)`**
- **`resolvePath(specifier, opts)`**
- **`createResolve(import.meta)`**
- `resolveSync(specifier, opts)`
- `resolvePathSync(specifier, opts)`

It is recommended to use `resolve` and `createResolve` since module resolution spec allows aync resolution.

**Options:**

- `parent`: (required) Parent module to resolve relative from
- `conditions`: Default is `['node', 'import']`

## CommonJS Context

### `createCommonJS`

This utility creates a compatible context that we loose when migrating to ECMA modules.

```js
import { createCommonJS } from 'mlly'

const { __dirname, __filename, require } = createCommonJS(import.meta)
```

## Utils

### `fileURLToPath`

Similar to [url.fileURLToPath](https://nodejs.org/api/url.html#url_url_fileurltopath_url) but also converts windows backslash `\` to unix slash `/`


## License

MIT
