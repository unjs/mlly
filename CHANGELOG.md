# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## v1.5.0

[compare changes](https://github.com/unjs/mlly/compare/v1.4.2...v1.5.0)

### 🚀 Enhancements

- Make `stripComments` optional for syntax detection ([#217](https://github.com/unjs/mlly/pull/217))
- **findExports:** Extract name of default exports ([#179](https://github.com/unjs/mlly/pull/179))
- **interopDefault:** Support `preferNamespace` ([5d23c98](https://github.com/unjs/mlly/commit/5d23c98))

### 🩹 Fixes

- Strip comment for syntax detection ([#196](https://github.com/unjs/mlly/pull/196))
- **analyze:** Ignore conmments for imports detection ([#155](https://github.com/unjs/mlly/pull/155))
- **lookupNodeModuleSubpath:** Handle conditions and nested exports ([#210](https://github.com/unjs/mlly/pull/210))
- **analyze:** Allow `import` statement after `}` ([#166](https://github.com/unjs/mlly/pull/166))
- **interopDefault:** Skip nullish values for `default` and explicitly return non-objects as-is ([14eb72d](https://github.com/unjs/mlly/commit/14eb72d))
- **findExports:** Support multiple variables in single export ([#211](https://github.com/unjs/mlly/pull/211))

### 🌊 Types

- **fileURLToPath:** Accept url as input ([34f6026](https://github.com/unjs/mlly/commit/34f6026))

### 🏡 Chore

- Update deps and lockfile ([7c8af63](https://github.com/unjs/mlly/commit/7c8af63))
- Add `defaultName` type to `ESMExport` ([4acaeaf](https://github.com/unjs/mlly/commit/4acaeaf))
- Update `import-meta-resolve` to v4 ([#215](https://github.com/unjs/mlly/pull/215))
- Add badges ([78d052b](https://github.com/unjs/mlly/commit/78d052b))

### ✅ Tests

- Add tests for resolve ([8c1bead](https://github.com/unjs/mlly/commit/8c1bead))
- Add more tests for resolve ([#15](https://github.com/unjs/mlly/pull/15))

### ❤️ Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))
- Mehmet <hi@productdevbook.com>
- Máté Nagy ([@mateenagy](http://github.com/mateenagy))
- Lishaobos 
- Julien Huang ([@huang-julien](http://github.com/huang-julien))

## v1.4.2

[compare changes](https://github.com/unjs/mlly/compare/v1.4.1...v1.4.2)

### 🩹 Fixes

- **findExports:** Support generator ([#189](https://github.com/unjs/mlly/pull/189))

### 🏡 Chore

- Update lockfile ([ad68cb7](https://github.com/unjs/mlly/commit/ad68cb7))

### ❤️ Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))
- Anthony Fu <anthonyfu117@hotmail.com>

## v1.4.1

[compare changes](https://github.com/unjs/mlly/compare/v1.4.0...v1.4.1)

### 🩹 Fixes

- **isValidNodeImport:** Detect invalid cjs modules ([#187](https://github.com/unjs/mlly/pull/187))

### 🏡 Chore

- Update dependencies ([1a25f45](https://github.com/unjs/mlly/commit/1a25f45))
- Add autofix ci ([b7adabf](https://github.com/unjs/mlly/commit/b7adabf))

### 🎨 Styles

- Format with prettier v3 ([914493c](https://github.com/unjs/mlly/commit/914493c))

### ❤️ Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))

## v1.4.0

[compare changes](https://github.com/unjs/mlly/compare/v1.3.0...v1.4.0)


### 🚀 Enhancements

  - `findTypeImports` for finding type imports ([#163](https://github.com/unjs/mlly/pull/163))
  - Add `parseNodeModulePath` and `lookupNodeModuleSubpath` utils ([#89](https://github.com/unjs/mlly/pull/89))

### 🩹 Fixes

  - Fix `resolvePath` return type ([#172](https://github.com/unjs/mlly/pull/172))
  - **findStaticImports:** Support special chars in import specifiers ([#169](https://github.com/unjs/mlly/pull/169))

### 🏡 Chore

  - **release:** V1.3.0 ([26063d3](https://github.com/unjs/mlly/commit/26063d3))
  - Update dependencies ([e075161](https://github.com/unjs/mlly/commit/e075161))
  - Lint ([7237b0b](https://github.com/unjs/mlly/commit/7237b0b))

### ✅ Tests

  - Add edge case test for `findStaticImports` ([f0b120b](https://github.com/unjs/mlly/commit/f0b120b))

### ❤️  Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))
- Daniel Roe <daniel@roe.dev>
- Lsh 
- Aaron Bassett <arbassett4@outlook.com>

## v1.3.0

[compare changes](https://github.com/unjs/mlly/compare/v1.2.1...v1.3.0)


### 🚀 Enhancements

  - Update `import-meta-url` to v3 ([208b323](https://github.com/unjs/mlly/commit/208b323))

### 💅 Refactors

  - Remove deprecated notice from sync resolve utils ([5223f5a](https://github.com/unjs/mlly/commit/5223f5a))

### 📖 Documentation

  - Mention `resolveSync` and `resolvePathSync` utils ([02a5efe](https://github.com/unjs/mlly/commit/02a5efe))

### 🏡 Chore

  - Update dependencies ([8bf8dcd](https://github.com/unjs/mlly/commit/8bf8dcd))

### ❤️  Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))

## v1.2.1

[compare changes](https://github.com/unjs/mlly/compare/v1.2.0...v1.2.1)


### 🩹 Fixes

  - **findStaticImports:** Allow accents in import names ([#170](https://github.com/unjs/mlly/pull/170))

### 📖 Documentation

  - Correct import name ([#167](https://github.com/unjs/mlly/pull/167))

### 🏡 Chore

  - Update lockfile ([7741f4a](https://github.com/unjs/mlly/commit/7741f4a))
  - Fix eslint ([86dd7f4](https://github.com/unjs/mlly/commit/86dd7f4))

### ❤️  Contributors

- Pooya Parsa ([@pi0](http://github.com/pi0))
- Daniel Roe <daniel@roe.dev>
- Mastercuber <e4d33vb85@mozmail.com>

## v1.2.0

[compare changes](https://github.com/unjs/mlly/compare/v1.1.1...v1.2.0)


### 🚀 Enhancements

  - `findTypeExports ` for finding type exports ([#156](https://github.com/unjs/mlly/pull/156))

### ❤️  Contributors

- Daniel Roe <daniel@roe.dev>

## v1.1.1

[compare changes](https://github.com/unjs/mlly/compare/v1.1.0...v1.1.1)


### 📦 Build

  - Add types field to exports ([190a5ec](https://github.com/unjs/mlly/commit/190a5ec))

### 🏡 Chore

  - Update ufo ([f1ee21c](https://github.com/unjs/mlly/commit/f1ee21c))
  - Switch to changelogen ([4b57ff9](https://github.com/unjs/mlly/commit/4b57ff9))

### ✅ Tests

  - Update snapshot ([3f2b36a](https://github.com/unjs/mlly/commit/3f2b36a))

### ❤️  Contributors

- Pooya Parsa <pooya@pi0.io>

## [1.1.0](https://github.com/unjs/mlly/compare/v1.0.0...v1.1.0) (2023-01-09)


### Features

* **findExports:** support for exports destructuring ([#133](https://github.com/unjs/mlly/issues/133)) ([7e877b6](https://github.com/unjs/mlly/commit/7e877b65b08fc24737ad688e86cfad72f5800654))


### Bug Fixes

* ignore `type` imports and exports ([#124](https://github.com/unjs/mlly/issues/124)) ([1523bbc](https://github.com/unjs/mlly/commit/1523bbc78654e34dc275281b6025cf0d645fcb5e))
* **resolve:** stop searching when module is resolved ([#135](https://github.com/unjs/mlly/issues/135)) ([f10e797](https://github.com/unjs/mlly/commit/f10e797e0df0bb89b37e5a684d7225461be18e81))
* **sanitizeFilePath:** remove query string ([#141](https://github.com/unjs/mlly/issues/141)) ([203676a](https://github.com/unjs/mlly/commit/203676af76d002e7524871881fe683e0aedd0c9f))
* **sanitizeURIComponent:** sanitize url escaping ([#137](https://github.com/unjs/mlly/issues/137)) ([f91da0d](https://github.com/unjs/mlly/commit/f91da0d82b9ff375c993df019a7da23fbc2db955))

## [1.0.0](https://github.com/unjs/mlly/compare/v0.5.17...v1.0.0) (2022-11-14)

### [0.5.17](https://github.com/unjs/mlly/compare/v0.5.16...v0.5.17) (2022-11-14)

### [0.5.16](https://github.com/unjs/mlly/compare/v0.5.15...v0.5.16) (2022-09-20)


### Features

* **isValidNodeImport:** mark unknown `/es/` path as invalid without depending on syntax detection (resolves [#23](https://github.com/unjs/mlly/issues/23)) ([70e2141](https://github.com/unjs/mlly/commit/70e2141df40fec20881650b45dc70fa2ee7651dc))


### Bug Fixes

* **findExports:** correctly dedup named exports ([#86](https://github.com/unjs/mlly/issues/86)) ([6b5df10](https://github.com/unjs/mlly/commit/6b5df10e5c346f173f0731a5f9d4dca77c99a4b4))

### [0.5.15](https://github.com/unjs/mlly/compare/v0.5.14...v0.5.15) (2022-09-19)


### Bug Fixes

* **findExports:** extract multi line named exports ([#75](https://github.com/unjs/mlly/issues/75)) ([e22ead6](https://github.com/unjs/mlly/commit/e22ead6281d00d1248563ceed5f839d4d32637bc))
* **isValidNodeImport:** check `type: module` before other detections ([8e866c3](https://github.com/unjs/mlly/commit/8e866c3459c04163bb59dd56469f8468add899b3))

### [0.5.14](https://github.com/unjs/mlly/compare/v0.5.13...v0.5.14) (2022-08-22)


### Bug Fixes

* **findExports:** support multiple exports terminated with `;` ([#72](https://github.com/unjs/mlly/issues/72)) ([e7a8de3](https://github.com/unjs/mlly/commit/e7a8de395ad5d2ef73c670c06fb07a97e1eb33fa))

### [0.5.13](https://github.com/unjs/mlly/compare/v0.5.12...v0.5.13) (2022-08-18)


### Features

* **findExports:** support typescript enum exports ([#69](https://github.com/unjs/mlly/issues/69)) ([ac7c37c](https://github.com/unjs/mlly/commit/ac7c37c079cdfa602d9e0d908292f51cd0472406))

### [0.5.12](https://github.com/unjs/mlly/compare/v0.5.11...v0.5.12) (2022-08-12)


### Bug Fixes

* **normalizeid:** encode file uri after normalizing slashes ([4569fa0](https://github.com/unjs/mlly/commit/4569fa0878004ac71d2539ab5ec7029b46b8eed4))

### [0.5.11](https://github.com/unjs/mlly/compare/v0.5.10...v0.5.11) (2022-08-12)


### Bug Fixes

* encode uri when constructing `file://` url ([#68](https://github.com/unjs/mlly/issues/68)) ([26c02d5](https://github.com/unjs/mlly/commit/26c02d5e01b14a7c166a967b44b617c87e4dcef0))

### [0.5.10](https://github.com/unjs/mlly/compare/v0.5.9...v0.5.10) (2022-08-11)


### Bug Fixes

* **resolve:** always try to resolve url as dir too ([#67](https://github.com/unjs/mlly/issues/67)) ([dd14c01](https://github.com/unjs/mlly/commit/dd14c01f6fcded538bff89e2845caad0e9745912))

### [0.5.9](https://github.com/unjs/mlly/compare/v0.5.8...v0.5.9) (2022-08-10)


### Bug Fixes

* **resolve:** properly resolve relative to file urls ([2099c28](https://github.com/unjs/mlly/commit/2099c28a1065cdaddcd1168f1d20293a15403a18))

### [0.5.8](https://github.com/unjs/mlly/compare/v0.5.7...v0.5.8) (2022-08-10)


### Features

* **resolveModuleExportNames:** resolve recursive star exports ([50991e4](https://github.com/unjs/mlly/commit/50991e491efba146dc3385da2b13a44eb3c13374))


### Bug Fixes

* **resolveModuleExportNames:** filter out star exports ([dd63a31](https://github.com/unjs/mlly/commit/dd63a31010d8b55d2fbdf4f910afda9b629b2bbb))

### [0.5.7](https://github.com/unjs/mlly/compare/v0.5.6...v0.5.7) (2022-08-03)


### Bug Fixes

* **findExports:** disable tokenizer if parsing fails (resolves [#64](https://github.com/unjs/mlly/issues/64)) ([4ed5c61](https://github.com/unjs/mlly/commit/4ed5c61108e2c6f809626a8b5ae1ae3268e0fc0a))

### [0.5.6](https://github.com/unjs/mlly/compare/v0.5.5...v0.5.6) (2022-08-03)


### Features

* `resolveModuleExportNames` and `findExportNames` ([#63](https://github.com/unjs/mlly/issues/63)) ([a699573](https://github.com/unjs/mlly/commit/a6995739fcf42f7f69b1df33caac8f5060e283d5))
* **findExports:** use acorn tokenizer to filter false positive exports ([#56](https://github.com/unjs/mlly/issues/56)) ([7039f54](https://github.com/unjs/mlly/commit/7039f54277b1791e99b4f625198dfba2dbf6fbe6))


### Bug Fixes

* **findExports:** get exports with trailing comma ([#61](https://github.com/unjs/mlly/issues/61)) ([79a3ceb](https://github.com/unjs/mlly/commit/79a3ceb5f9b831325351a411a8d1fdc0c2fb6778))

### [0.5.5](https://github.com/unjs/mlly/compare/v0.5.4...v0.5.5) (2022-07-20)


### Bug Fixes

* **findExports:** export with trailing comma ([#59](https://github.com/unjs/mlly/issues/59)) ([51c81b8](https://github.com/unjs/mlly/commit/51c81b82b8ffc0aef9a1cf3ffbe4c2ef4f429c69))

### [0.5.4](https://github.com/unjs/mlly/compare/v0.5.3...v0.5.4) (2022-06-29)


### Bug Fixes

* **detectSyntax:** detect `export class` as esm syntax ([896c8a7](https://github.com/unjs/mlly/commit/896c8a7dd087d041ffb29a00065a4f71d62ed249))
* **findExports:** filtering for named exports ([#55](https://github.com/unjs/mlly/issues/55)) ([df908fd](https://github.com/unjs/mlly/commit/df908fd509d7357265038b5fec414c41bd3ebd67))

### [0.5.3](https://github.com/unjs/mlly/compare/v0.5.2...v0.5.3) (2022-06-16)


### Features

* support named star export ([#45](https://github.com/unjs/mlly/issues/45)) ([af777cb](https://github.com/unjs/mlly/commit/af777cbe3ce09d23c6a994334e658f1b21e71ea6))


### Bug Fixes

* don't throw if module subpath not found ([#46](https://github.com/unjs/mlly/issues/46)) ([37d5bcc](https://github.com/unjs/mlly/commit/37d5bcc221e83be4298a4e52b351900a962823e3))
* make `url` optional in resolver created with `createResolve` ([#44](https://github.com/unjs/mlly/issues/44)) ([7c1bda4](https://github.com/unjs/mlly/commit/7c1bda4221b8a162e39610ebf9f50f957a32d7f9))

### [0.5.2](https://github.com/unjs/mlly/compare/v0.5.1...v0.5.2) (2022-04-13)


### Bug Fixes

* fix lookbefore in front of import ([#43](https://github.com/unjs/mlly/issues/43)) ([fbc9b5a](https://github.com/unjs/mlly/commit/fbc9b5ab78f084957b5c32f87b912c97a6eb57a4))

### [0.5.1](https://github.com/unjs/mlly/compare/v0.5.0...v0.5.1) (2022-03-25)


### Bug Fixes

* inline import-meta-resolve ([2c0a147](https://github.com/unjs/mlly/commit/2c0a147641fb78f2455378caf88e48b9565e2477))

## [0.5.0](https://github.com/unjs/mlly/compare/v0.4.3...v0.5.0) (2022-03-24)


### ⚠ BREAKING CHANGES

* **pkg:** avoid inlining dependencies

### Bug Fixes

* improve regexp for multiple imports on same line ([#41](https://github.com/unjs/mlly/issues/41)) ([bc64246](https://github.com/unjs/mlly/commit/bc64246a907b09c597093b36da93291a23cb305b))


* **pkg:** avoid inlining dependencies ([0c28f44](https://github.com/unjs/mlly/commit/0c28f44db5643e3d4520aabf09a158082f31b746))

### [0.4.3](https://github.com/unjs/mlly/compare/v0.4.2...v0.4.3) (2022-02-11)


### Bug Fixes

* test for name after normalisation ([#40](https://github.com/unjs/mlly/issues/40)) ([5fd933b](https://github.com/unjs/mlly/commit/5fd933b4ea6c5e2fde1bcbe377b42e86172fba68))

### [0.4.2](https://github.com/unjs/mlly/compare/v0.4.1...v0.4.2) (2022-02-07)


### Bug Fixes

* prevent multiple exports of multiple signatures ([#39](https://github.com/unjs/mlly/issues/39)) ([d492116](https://github.com/unjs/mlly/commit/d4921168d9fddff9354177116b220f3669b6169f))

### [0.4.1](https://github.com/unjs/mlly/compare/v0.4.0...v0.4.1) (2022-01-25)


### Bug Fixes

* **resolve:** ensure absolute id exists and resolved ([f505b7c](https://github.com/unjs/mlly/commit/f505b7ccf3b7978c5bdf1a4c68208a20475d3cfb))

## [0.4.0](https://github.com/unjs/mlly/compare/v0.3.19...v0.4.0) (2022-01-25)


### ⚠ BREAKING CHANGES

* code-gen utils moved to https://github.com/unjs/knitwork

### Features

* drop code-gen utils (genImport and genDynamicImport) ([42583e1](https://github.com/unjs/mlly/commit/42583e14ad2c8d464bd3107b8a4bea576806ec79))
* export star ([#33](https://github.com/unjs/mlly/issues/33)) ([3f4e844](https://github.com/unjs/mlly/commit/3f4e844e7993828253196edcfec42b9fe34cc17e))

### [0.3.19](https://github.com/unjs/mlly/compare/v0.3.18...v0.3.19) (2022-01-17)


### Bug Fixes

* add specifer to NamedExport type ([#31](https://github.com/unjs/mlly/issues/31)) ([1ca4d30](https://github.com/unjs/mlly/commit/1ca4d307e975f15bc814f53ea6f63efa52cf63c8))

### [0.3.18](https://github.com/unjs/mlly/compare/v0.3.17...v0.3.18) (2022-01-17)


### Features

* add specifier matcher for `findExports` ([#30](https://github.com/unjs/mlly/issues/30)) ([5ddeba1](https://github.com/unjs/mlly/commit/5ddeba18e0e5414a3edf5301d2a07dd2c3de0196))

### [0.3.17](https://github.com/unjs/mlly/compare/v0.3.16...v0.3.17) (2022-01-07)


### Bug Fixes

* get actual protocol for windows instead of protocol + drive ([#28](https://github.com/unjs/mlly/issues/28)) ([15140cc](https://github.com/unjs/mlly/commit/15140cca5352b2b839bb06887dfe66bd369fa7f1))

### [0.3.16](https://github.com/unjs/mlly/compare/v0.3.15...v0.3.16) (2021-12-17)


### Bug Fixes

* improve esm detection with export declartion ([#27](https://github.com/unjs/mlly/issues/27)) ([0511a93](https://github.com/unjs/mlly/commit/0511a93d3565f3a2a6679fc09a3e6ce349724478))

### [0.3.15](https://github.com/unjs/mlly/compare/v0.3.14...v0.3.15) (2021-11-29)


### Features

* initial code generation utils ([5fdb9f2](https://github.com/unjs/mlly/commit/5fdb9f2e885230d8008916131f584f7e2c07296c))

### [0.3.14](https://github.com/unjs/mlly/compare/v0.3.13...v0.3.14) (2021-11-29)


### Bug Fixes

* **findExports:** detect `async function` ([9fcc555](https://github.com/unjs/mlly/commit/9fcc5551bfbc188781b7d59dcd8383921fbd4ae9))

### [0.3.13](https://github.com/unjs/mlly/compare/v0.3.12...v0.3.13) (2021-11-11)


### Bug Fixes

* **findExports:** normalize named exports ([b82d27b](https://github.com/unjs/mlly/commit/b82d27bb48ae101531bcc62a5e79671be6151769))

### [0.3.12](https://github.com/unjs/mlly/compare/v0.3.11...v0.3.12) (2021-11-03)


### Features

* add `sanitizeURIComponent` and `sanitizeFilePath` helpers ([#22](https://github.com/unjs/mlly/issues/22)) ([9ddeab8](https://github.com/unjs/mlly/commit/9ddeab866e5dc5637f1500cfd4487c034100dc8e))

### [0.3.11](https://github.com/unjs/mlly/compare/v0.3.10...v0.3.11) (2021-11-02)


### Bug Fixes

* exclude windows drive letters from protocols ([#21](https://github.com/unjs/mlly/issues/21)) ([94d3506](https://github.com/unjs/mlly/commit/94d350699a132fe0d5f25031f09dc5117cf659db))

### [0.3.10](https://github.com/unjs/mlly/compare/v0.3.9...v0.3.10) (2021-10-28)


### Features

* support protocols for `isValidNodeImport` ([#20](https://github.com/unjs/mlly/issues/20)) ([0cfa4d9](https://github.com/unjs/mlly/commit/0cfa4d927acffc09beb8c0af7862d9c02046dfe5))

### [0.3.9](https://github.com/unjs/mlly/compare/v0.3.8...v0.3.9) (2021-10-28)


### Bug Fixes

* prevent more false positives on cjs ([#19](https://github.com/unjs/mlly/issues/19)) ([8ac4b74](https://github.com/unjs/mlly/commit/8ac4b7424392dba14c1dbc5aacb84dc4b274bb6c))

### [0.3.8](https://github.com/unjs/mlly/compare/v0.3.7...v0.3.8) (2021-10-27)


### Bug Fixes

* import detection improvements ([#18](https://github.com/unjs/mlly/issues/18)) ([b99bf2c](https://github.com/unjs/mlly/commit/b99bf2ce9b37e628f681831553d817a8bdfa7e39))

### [0.3.7](https://github.com/unjs/mlly/compare/v0.3.6...v0.3.7) (2021-10-27)


### Features

* add `isValidNodeImport` utility ([#16](https://github.com/unjs/mlly/issues/16)) ([32ef24a](https://github.com/unjs/mlly/commit/32ef24a86371b50019c07417e90e05aef5d4bb44))

### [0.3.6](https://github.com/unjs/mlly/compare/v0.3.5...v0.3.6) (2021-10-27)


### Features

* **resolve:** automatically add `node_modules` to search path ([7b03715](https://github.com/unjs/mlly/commit/7b03715485bf421a4aef1b2010c9a24599deeedd))

### [0.3.5](https://github.com/unjs/mlly/compare/v0.3.4...v0.3.5) (2021-10-27)


### Features

* detect esm/cjs syntax ([#12](https://github.com/unjs/mlly/issues/12)) ([477d76e](https://github.com/unjs/mlly/commit/477d76ebcd2f01478ce5a2e01bb6b253454f2587))


### Bug Fixes

* **resolve:** don't normalize falsy urls ([9fdf8f6](https://github.com/unjs/mlly/commit/9fdf8f64b72c9efd1f9535e79ecfeec6780939ec))
* **types:** make options optional ([9240f07](https://github.com/unjs/mlly/commit/9240f07c49df0591e00f83a7998a5158a898983a))

### [0.3.4](https://github.com/unjs/mlly/compare/v0.3.3...v0.3.4) (2021-10-27)


### Bug Fixes

* **resolve:** resolve absolute paths as-is ([c6e4f9f](https://github.com/unjs/mlly/commit/c6e4f9f3fce6010cc6b3a4b3991a43b20ec6550e))

### [0.3.3](https://github.com/unjs/mlly/compare/v0.3.2...v0.3.3) (2021-10-27)


### Bug Fixes

* correct `ResolveOptions.url` type ([e432175](https://github.com/unjs/mlly/commit/e432175b11077f5116521211360af959a76f8fc8))

### [0.3.2](https://github.com/unjs/mlly/compare/v0.3.1...v0.3.2) (2021-10-27)


### Features

* **resolve:** support resolving from multiple paths or urls ([8d51348](https://github.com/unjs/mlly/commit/8d5134807b44ea92c14785343a38486fc155957c))

### [0.3.1](https://github.com/unjs/mlly/compare/v0.3.0...v0.3.1) (2021-10-22)


### Bug Fixes

* add missing `name` and `names` to `ESMExport` interface ([#13](https://github.com/unjs/mlly/issues/13)) ([c5eacfb](https://github.com/unjs/mlly/commit/c5eacfb6b392395d6d568daaeaea80d322b90a36))

## [0.3.0](https://github.com/unjs/mlly/compare/v0.2.10...v0.3.0) (2021-10-20)


### ⚠ BREAKING CHANGES

* rewrite with typescript

### Features

* rewrite with typescript ([b085827](https://github.com/unjs/mlly/commit/b085827a9cf575bde8dd71841c02eaaa802d829a))


### Bug Fixes

* **pkg:** inline `import-meta-resolve` ([50f13b1](https://github.com/unjs/mlly/commit/50f13b1a2cb4c191d1546f224b4315ed8948ed78))

### [0.2.10](https://github.com/unjs/mlly/compare/v0.2.9...v0.2.10) (2021-10-18)


### Bug Fixes

* **interopDefault:** handle non-object inputs ([0d73a44](https://github.com/unjs/mlly/commit/0d73a444e42897b6ecaaf435a7ddd8a17c5afbfa))

### [0.2.9](https://github.com/unjs/mlly/compare/v0.2.8...v0.2.9) (2021-10-18)


### Bug Fixes

* type guards ([#10](https://github.com/unjs/mlly/issues/10)) ([b92cd94](https://github.com/unjs/mlly/commit/b92cd94c6c97b09211bbf2ebf229fc1a3cf68b7e))

### [0.2.8](https://github.com/unjs/mlly/compare/v0.2.7...v0.2.8) (2021-10-15)


### Bug Fixes

* **types:** types for findExports ([#9](https://github.com/unjs/mlly/issues/9)) ([68b7c39](https://github.com/unjs/mlly/commit/68b7c394cb032af2c93d7f14a63847bb0c643d73))

### [0.2.7](https://github.com/unjs/mlly/compare/v0.2.6...v0.2.7) (2021-10-14)


### Features

* export analyzes with `findExports` ([#8](https://github.com/unjs/mlly/issues/8)) ([2eebbd5](https://github.com/unjs/mlly/commit/2eebbd50262992cd500935ba530d5f99e8ad8dcf))

### [0.2.6](https://github.com/unjs/mlly/compare/v0.2.5...v0.2.6) (2021-10-12)


### Bug Fixes

* **interopDefault:** do not override existing props ([#7](https://github.com/unjs/mlly/issues/7)) ([9429606](https://github.com/unjs/mlly/commit/9429606cd03b17d9e0a1f67a0f4c43977828ec4c))

### [0.2.5](https://github.com/unjs/mlly/compare/v0.2.4...v0.2.5) (2021-10-05)


### Features

* add `interopDefault` util ([#6](https://github.com/unjs/mlly/issues/6)) ([0c49451](https://github.com/unjs/mlly/commit/0c494516e463956e3ab8f4dede9d22bda2518272))

### [0.2.4](https://github.com/unjs/mlly/compare/v0.2.3...v0.2.4) (2021-10-01)


### Features

* add types for import analyzes ([b9ca4af](https://github.com/unjs/mlly/commit/b9ca4aff597453877674f0c9ebf504f19f989ea1))

### [0.2.3](https://github.com/unjs/mlly/compare/v0.2.2...v0.2.3) (2021-10-01)


### Features

* static import analyzes tools ([#3](https://github.com/unjs/mlly/issues/3)) ([8193226](https://github.com/unjs/mlly/commit/8193226dc48f83a3dbf957db1d6c56d1684273e2))

### [0.2.2](https://github.com/unjs/mlly/compare/v0.2.1...v0.2.2) (2021-09-20)


### Bug Fixes

* add missing require to cjs interface ([9bdffc3](https://github.com/unjs/mlly/commit/9bdffc3991c53335f34ce64d51a839e3e0c0cd2c))

### [0.2.1](https://github.com/unjs/mlly/compare/v0.2.0...v0.2.1) (2021-09-20)


### Bug Fixes

* **createResolve:** make url optional ([40de473](https://github.com/unjs/mlly/commit/40de473ddc94de1ba17b6f46b36115e99e51e836))

## [0.2.0](https://github.com/unjs/mlly/compare/v0.1.7...v0.2.0) (2021-07-23)


### ⚠ BREAKING CHANGES

* directly use a url to create cjs context

### Features

* rewrite error stack for inline scripts ([7357aeb](https://github.com/unjs/mlly/commit/7357aeb4b7b6eca234f8622fd8d2d833c1129518))


* directly use a url to create cjs context ([e7012fb](https://github.com/unjs/mlly/commit/e7012fb38015fd3a0d38f40829b3e8042c8e7f1f))

### [0.1.7](https://github.com/unjs/mlly/compare/v0.1.6...v0.1.7) (2021-07-23)

### [0.1.6](https://github.com/unjs/mlly/compare/v0.1.5...v0.1.6) (2021-07-23)


### Features

* json support ([81c12af](https://github.com/unjs/mlly/commit/81c12af219abc7b86cc551605e8eace96debb497))


### Bug Fixes

* resolve bug fixes ([e5946df](https://github.com/unjs/mlly/commit/e5946df14ebdcc994a2f464c07a5439b67359559))

### [0.1.5](https://github.com/unjs/mlly/compare/v0.1.4...v0.1.5) (2021-07-22)


### Features

* support extensions and index resolution ([8f4c080](https://github.com/unjs/mlly/commit/8f4c08005a6056cc14d9d9d63e3b921cb879ec1d))
* support url option for evaluation ([0a78f45](https://github.com/unjs/mlly/commit/0a78f451a3d3163541079f213eeb3a5898fba964))

### [0.1.4](https://github.com/unjs/mlly/compare/v0.1.3...v0.1.4) (2021-07-22)


### Features

* normalizeid and use it to support `from` as path ([14af3d1](https://github.com/unjs/mlly/commit/14af3d18392c0bcb10577f70808dda6cdeca1fb5))


### Bug Fixes

* skip fileURLToPath when id is not file: protocol ([c40b810](https://github.com/unjs/mlly/commit/c40b8100f54ee0f500f848c6d388bf7cdf16b9a9))

### [0.1.3](https://github.com/unjs/mlly/compare/v0.1.2...v0.1.3) (2021-07-22)

### [0.1.2](https://github.com/unjs/mlly/compare/v0.1.1...v0.1.2) (2021-07-22)


### Features

* expose resolveImports and improve docs ([074ef52](https://github.com/unjs/mlly/commit/074ef52a3724518b2fdd43e5a647ab7ceac51084))

### 0.1.1 (2021-07-22)


### Features

* add eval utils and other improvements ([1fe0b69](https://github.com/unjs/mlly/commit/1fe0b69910064c179dd4de5a7a02e6e250e9f19a))
* add resolve utils ([1d1a3ac](https://github.com/unjs/mlly/commit/1d1a3ac957e7f05214bcc7ed0af1ec5d6fe7785b))
