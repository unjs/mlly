# 🤝 mlly

> [ECMAScript module](https://nodejs.org/api/esm.html) utils for Node.js

## Usage

### Install

Install npm package:

```sh
# using yarn
yarn add mlly

# using npm
npm install mlly
```

### CommonJS Context

This utility creates a compatible context that we loose when migrating to ECMA modules.

```js
import { createCommonJS } from 'mlly'

const { __dirname, __filename, require } = createCommonJS(import.meta)
```

## License

MIT
