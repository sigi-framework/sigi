# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
