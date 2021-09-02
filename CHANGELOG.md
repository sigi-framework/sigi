# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.12.0](https://github.com/sigi-framework/sigi/compare/v2.11.3...v2.12.0) (2021-09-02)

### Features

- **ssr:** support extract to json and restore state ([4ac7936](https://github.com/sigi-framework/sigi/commit/4ac793678a35c8ad5591415885f1de4cff0a612e))

## [2.11.3](https://github.com/sigi-framework/sigi/compare/v2.11.2...v2.11.3) (2021-08-30)

**Note:** Version bump only for package sigi

## [2.11.2](https://github.com/sigi-framework/sigi/compare/v2.11.1...v2.11.2) (2021-08-24)

### Bug Fixes

- **core:** skipCount should less equal than the filtered index ([ff38eb6](https://github.com/sigi-framework/sigi/commit/ff38eb6667cc8f0274a893211669925cd3e7f334))

## [2.11.1](https://github.com/sigi-framework/sigi/compare/v2.11.0...v2.11.1) (2021-08-11)

### Bug Fixes

- init while payloadgetter skip ([f317101](https://github.com/sigi-framework/sigi/commit/f3171014fa30b591dd65b3473f917316793a0833))
- **ssr:** payloadGetter type in match function ([38738ab](https://github.com/sigi-framework/sigi/commit/38738ab80d1f9b46baeb80824bb9369bcf118c5a))

# [2.11.0](https://github.com/sigi-framework/sigi/compare/v2.10.9...v2.11.0) (2021-07-19)

### Features

- **ssr:** support match fn ([f899954](https://github.com/sigi-framework/sigi/commit/f899954a24ad6f3a903675868f335aeb0fa3568f))

## [2.10.9](https://github.com/sigi-framework/sigi/compare/v2.10.8...v2.10.9) (2021-06-28)

**Note:** Version bump only for package sigi

## [2.10.8](https://github.com/sigi-framework/sigi/compare/v2.10.7...v2.10.8) (2021-06-16)

### Bug Fixes

- **ssr:** skipped actions should always be retried on client ([4000e27](https://github.com/sigi-framework/sigi/commit/4000e27bc1ca2ccc3f8e5a8440ce3384b218d8e1))

## [2.10.7](https://github.com/sigi-framework/sigi/compare/v2.10.6...v2.10.7) (2021-06-15)

### Bug Fixes

- **core:** skip from SSR logic ([c3e1ee8](https://github.com/sigi-framework/sigi/commit/c3e1ee8ee97732294c7bf9f3759dd4d7e284e041))

## [2.10.6](https://github.com/sigi-framework/sigi/compare/v2.10.5...v2.10.6) (2021-06-09)

### Bug Fixes

- **react-router:** duplicated router module ([6458713](https://github.com/sigi-framework/sigi/commit/6458713edec3bab45ccb1c9aebcf7b7fd8c73baf))

## [2.10.5](https://github.com/sigi-framework/sigi/compare/v2.10.4...v2.10.5) (2021-06-09)

### Bug Fixes

- **react-router:** missing export types ([d9e8c65](https://github.com/sigi-framework/sigi/commit/d9e8c6544de81a8d112bc3b7141f8faec05777ad))

## [2.10.4](https://github.com/sigi-framework/sigi/compare/v2.10.3...v2.10.4) (2021-06-09)

### Bug Fixes

- **core:** compatible with es class property ([3f0e38a](https://github.com/sigi-framework/sigi/commit/3f0e38a8531f72ec62f50552c9dd866945245665))

## [2.10.3](https://github.com/sigi-framework/sigi/compare/v2.10.2...v2.10.3) (2021-06-09)

### Bug Fixes

- **react:** react 18 cm safe ([fef08ff](https://github.com/sigi-framework/sigi/commit/fef08ff8e3904b53265e22e60a4869df74e6bd19))

## [2.10.2](https://github.com/sigi-framework/sigi/compare/v2.10.1...v2.10.2) (2021-05-26)

**Note:** Version bump only for package sigi

## [2.10.1](https://github.com/sigi-framework/sigi/compare/v2.10.0...v2.10.1) (2021-05-18)

### Bug Fixes

- **react:** serverCache in childInjector may be undefined ([b943c19](https://github.com/sigi-framework/sigi/commit/b943c19842db426dc452a57c5a79c7776512a18a))

# [2.10.0](https://github.com/sigi-framework/sigi/compare/v2.9.3...v2.10.0) (2021-05-13)

### Features

- **ssr:** force all epic to complete after disposed ([d89786a](https://github.com/sigi-framework/sigi/commit/d89786a4ead1ce84901543274a54f6ea6fa03e9b))

## [2.9.3](https://github.com/sigi-framework/sigi/compare/v2.9.2...v2.9.3) (2021-05-12)

### Bug Fixes

- **ssr:** re-assign timer to null ([c7e6a55](https://github.com/sigi-framework/sigi/commit/c7e6a5500a47cd8730dc03fac7c8c514adfa17bd))

## [2.9.2](https://github.com/sigi-framework/sigi/compare/v2.9.1...v2.9.2) (2021-05-11)

### Bug Fixes

- **ssr:** typo windows => window ([0034a24](https://github.com/sigi-framework/sigi/commit/0034a24594859130e5eb046a58201bdaaa938e54))

## [2.9.1](https://github.com/sigi-framework/sigi/compare/v2.9.0...v2.9.1) (2021-05-11)

### Bug Fixes

- **react:** missing fallback logic in useServerInstance ([9922ae2](https://github.com/sigi-framework/sigi/commit/9922ae25c47ac6f32a3817304e402cb74f07c46f))

# [2.9.0](https://github.com/sigi-framework/sigi/compare/v2.8.6...v2.9.0) (2021-05-11)

### Bug Fixes

- **ssr:** should be able to emit terminate in the other modules ([cfb4c43](https://github.com/sigi-framework/sigi/commit/cfb4c43521b732e6da6cedb7c92dff1ff272e1e7))
- dependencies list ([4a44cdd](https://github.com/sigi-framework/sigi/commit/4a44cdd65b1fa83ba949f6993c2708d2f6c2b722))
- **react:** state mismatch while dispatch reducers in useEffect of Child component ([c92d4be](https://github.com/sigi-framework/sigi/commit/c92d4beb7e709d1577c6390d93bec5ad8deafb9f))

### Features

- **core:** ssr effect now could be marked retry on client ([116df59](https://github.com/sigi-framework/sigi/commit/116df5952c8f45cda94a0d352a5c538b78307ffe))

### Performance Improvements

- **core:** reduce js engine hidden path mismatch ([3224344](https://github.com/sigi-framework/sigi/commit/32243447ba72b7aa957cc52ef7460aaef118e175))
- **react:** fast code path on server ([f7df497](https://github.com/sigi-framework/sigi/commit/f7df49708808f5421f40798151108280ab669359))
- **ssr:** add fast path for ssr di logic ([8cd2f5a](https://github.com/sigi-framework/sigi/commit/8cd2f5a4517fed2f01058cc39d410af63fa53a3b))

## [2.8.6](https://github.com/sigi-framework/sigi/compare/v2.8.5...v2.8.6) (2021-05-06)

**Note:** Version bump only for package sigi

## [2.8.5](https://github.com/sigi-framework/sigi/compare/v2.8.4...v2.8.5) (2021-04-28)

### Bug Fixes

- **ssr:** race operator should only accept last value of SSR Modules ([44c3e1b](https://github.com/sigi-framework/sigi/commit/44c3e1b725d725bad6ca51c4d0b885e2cecb4f23))

## [2.8.4](https://github.com/sigi-framework/sigi/compare/v2.8.3...v2.8.4) (2021-03-31)

### Bug Fixes

- **react:** should still not skip first setState if not first rendering ([1349288](https://github.com/sigi-framework/sigi/commit/134928867bdfda1f3e1e6b55d84e60cd5061630f))

## [2.8.3](https://github.com/sigi-framework/sigi/compare/v2.8.2...v2.8.3) (2021-03-29)

### Bug Fixes

- **react:** emit warning while pass selector without dependencies ([3198ea5](https://github.com/sigi-framework/sigi/commit/3198ea5984a74592ea244c52f596f873d5b74439))

## [2.8.2](https://github.com/sigi-framework/sigi/compare/v2.8.1...v2.8.2) (2021-03-29)

### Bug Fixes

- typecheck issues after upgrade to ts@4.2 ([390651e](https://github.com/sigi-framework/sigi/commit/390651ea9eb4857992e2e447ae615b517f896650))
- **react:** useModule subscription should be in useEffect ([9603ffa](https://github.com/sigi-framework/sigi/commit/9603ffa8d5cc86acd1f4ba6dc7c1a8e031559838))
- **ssr:** always resolve deferred promise to prevent floating Promise ([4493da0](https://github.com/sigi-framework/sigi/commit/4493da0bf7d899ddb008cf8da613a088a3f18808))

## [2.8.1](https://github.com/sigi-framework/sigi/compare/v2.8.0...v2.8.1) (2021-03-03)

### Bug Fixes

- **ssr:** emit stateToPersist after all Modules was finished ([92f1790](https://github.com/sigi-framework/sigi/commit/92f179090358675c4c9fcbc1ce532983eda177de))

# [2.8.0](https://github.com/sigi-framework/sigi/compare/v2.7.0...v2.8.0) (2021-02-22)

### Bug Fixes

- husky permission ([ad2255d](https://github.com/sigi-framework/sigi/commit/ad2255d7969ab8bdd421824961d0f42f20eb9114))

### Performance Improvements

- **ssr:** reduce closure creations ([5ede4ac](https://github.com/sigi-framework/sigi/commit/5ede4ac2c9b486ca8a9972283ba64a44533c9ff6))

# [2.7.0](https://github.com/sigi-framework/sigi/compare/v2.6.0...v2.7.0) (2021-02-07)

### Features

- **react-router:** export createHistoryProviders to register history in SSR ([1369acf](https://github.com/sigi-framework/sigi/commit/1369acfcb0b30b7cfb93f2181bbd0a508e4abfd2))
- **ssr:** pass config which contains providers in emitSSREffects function ([b32ef30](https://github.com/sigi-framework/sigi/commit/b32ef302f58b4902dfbdc85a639a22ce074691a4))

# [2.6.0](https://github.com/sigi-framework/sigi/compare/v2.5.1...v2.6.0) (2021-02-01)

### Bug Fixes

- **react-router:** missing @sigi/{di,types} dependencies ([6f50a97](https://github.com/sigi-framework/sigi/commit/6f50a9792a2acf3b604c1a736861ea2d1009b206))

### Features

- **testing:** typings enhancement ([c2ca55d](https://github.com/sigi-framework/sigi/commit/c2ca55d3187d4c366af9e9dcc01284d9fdbf5c9c))

## [2.5.1](https://github.com/sigi-framework/sigi/compare/v2.5.0...v2.5.1) (2021-01-22)

### Bug Fixes

- **core:** setup store immediately after set default state ([d5d2631](https://github.com/sigi-framework/sigi/commit/d5d2631898645a6eb938f7cb8ff5bacac8a9efe6))

# [2.5.0](https://github.com/sigi-framework/sigi/compare/v2.4.5...v2.5.0) (2020-12-17)

### Features

- **react:** add equal fn option to state selector config ([a9a13ea](https://github.com/sigi-framework/sigi/commit/a9a13ea79924a3b30ce87cd5b6b3963604819ac8))

## [2.4.5](https://github.com/sigi-framework/sigi/compare/v2.4.4...v2.4.5) (2020-12-14)

### Bug Fixes

- **core:** epic do not follow rxjs control ([e27ab82](https://github.com/sigi-framework/sigi/commit/e27ab824d9b99846654087b840c8b2cccea9af6c))

## [2.4.4](https://github.com/sigi-framework/sigi/compare/v2.4.3...v2.4.4) (2020-11-27)

### Bug Fixes

- **di:** always cache instance in nearest injector ([a999d5c](https://github.com/sigi-framework/sigi/commit/a999d5cbae4694344d9539df82f909c3e4c141c9))

## [2.4.3](https://github.com/sigi-framework/sigi/compare/v2.4.2...v2.4.3) (2020-11-22)

**Note:** Version bump only for package sigi

## [2.4.2](https://github.com/sigi-framework/sigi/compare/v2.4.1...v2.4.2) (2020-10-15)

**Note:** Version bump only for package sigi

## [2.4.1](https://github.com/sigi-framework/sigi/compare/v2.4.0...v2.4.1) (2020-08-27)

### Bug Fixes

- **react-router:** react-router is actually using history@4 ([e1a6841](https://github.com/sigi-framework/sigi/commit/e1a6841080120428e3ca54c914fde815b460a6fa))

# [2.4.0](https://github.com/sigi-framework/sigi/compare/v2.3.1...v2.4.0) (2020-07-28)

### Features

- **core:** get rid of symbols ([6d7a848](https://github.com/sigi-framework/sigi/commit/6d7a84801e4ce2a7be731ad13e26e56cd0970135))
- **react:** expose common actions to dispatcher hooks ([20dd063](https://github.com/sigi-framework/sigi/commit/20dd0631d2501e4b912210fef1f2b69addadb612))

## [2.3.1](https://github.com/sigi-framework/sigi/compare/v2.3.0...v2.3.1) (2020-07-09)

### Bug Fixes

- **react:** do not skip emit state after dependencies changed ([8656051](https://github.com/sigi-framework/sigi/commit/86560514d32252ee9385508b2b04c3e891116f49))

# [2.3.0](https://github.com/sigi-framework/sigi/compare/v2.2.0...v2.3.0) (2020-07-05)

### Features

- **di:** injectable now accept InjectableOptions ([f1da08f](https://github.com/sigi-framework/sigi/commit/f1da08fee2485d3f7df5d24eb029eaa4e3960f73))

# [2.2.0](https://github.com/sigi-framework/sigi/compare/v2.1.0...v2.2.0) (2020-06-28)

### Bug Fixes

- **core:** dispatching action on non-effects module causes dead loop ([1ad1100](https://github.com/sigi-framework/sigi/commit/1ad1100158bd131d7366fef165d4acca30e6739b))
- **react-router:** api broken after bump history to 5.0 ([224d283](https://github.com/sigi-framework/sigi/commit/224d283976c616897390bbe2eeab77581414d9d3))

### Performance Improvements

- add dependencies to selector ([#283](https://github.com/sigi-framework/sigi/issues/283)) ([4fc71ac](https://github.com/sigi-framework/sigi/commit/4fc71acc5ffb1116d9536c6eb1189071a1eeb154))

# [2.1.0](https://github.com/sigi-framework/sigi/compare/v2.0.2...v2.1.0) (2020-06-02)

### Features

- provide `noop()`, `terminate()`, `reset()` three default actions ([e680fdf](https://github.com/sigi-framework/sigi/commit/e680fdf1ccb501351b0f176831677b1077712816))

### refactor

- deprecate `this.createNoopAction()`, use `this.noop()` instead ([5202209](https://github.com/sigi-framework/sigi/commit/5202209806cc0ac0b45b095e627e3d17d3c0cd98))
- effect module and core store ([e680fdf](https://github.com/sigi-framework/sigi/commit/e680fdf1ccb501351b0f176831677b1077712816))

# v2.0.2

## @sigi/react

- remove useless `SSR_LOADED_KEY` and related logic

# v2.0.1

## @sigi/react

- fix: `Reflect.deleteMetadata` is not implemented by [`@abraham/reflection`](https://github.com/abraham/reflection)

# v2.0.0

## @sigi/core

- rename internal state owner to `store`

## @sigi/react

- (Breaking change) merge `@SSREffect` into `@Effect` [#67](https://github.com/sigi-framework/sigi/pull/67)
- (Breaking change) rename `useEffectModule` => `useModule`
- (Breaking change) rename `useEffectState` => `useModuleState`
- (Breaking change) rename `useEffectModuleDispatchers` => `useDispatchers` [#83](https://github.com/sigi-framework/sigi/pull/83)

# v1.0.2

## `devtool`

- fix error when logging `noopAction`

# v1.0.1

## `testing` @1.0.1

- rename `SigiTestingModule#getAyanamiTestingStub` => `SigiTestingModule#getTestingStub`

# v1.0.0 (First release)

- `core` @1.0.0
- `devtool` @1.0.0
- `react` @1.0.0
- `react-router` @1.0.0
- `ssr` @1.0.0
- `testing` @1.0.0
- `ts-plugin` @1.0.0
