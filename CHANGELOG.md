# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
