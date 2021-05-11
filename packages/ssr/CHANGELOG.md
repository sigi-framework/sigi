# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.9.2](https://github.com/sigi-framework/sigi/compare/v2.9.1...v2.9.2) (2021-05-11)

### Bug Fixes

- **ssr:** typo windows => window ([0034a24](https://github.com/sigi-framework/sigi/commit/0034a24594859130e5eb046a58201bdaaa938e54))

# [2.9.0](https://github.com/sigi-framework/sigi/compare/v2.8.6...v2.9.0) (2021-05-11)

### Bug Fixes

- **ssr:** should be able to emit terminate in the other modules ([cfb4c43](https://github.com/sigi-framework/sigi/commit/cfb4c43521b732e6da6cedb7c92dff1ff272e1e7))
- dependencies list ([4a44cdd](https://github.com/sigi-framework/sigi/commit/4a44cdd65b1fa83ba949f6993c2708d2f6c2b722))

### Features

- **core:** ssr effect now could be marked retry on client ([116df59](https://github.com/sigi-framework/sigi/commit/116df5952c8f45cda94a0d352a5c538b78307ffe))

### Performance Improvements

- **ssr:** add fast path for ssr di logic ([8cd2f5a](https://github.com/sigi-framework/sigi/commit/8cd2f5a4517fed2f01058cc39d410af63fa53a3b))

## [2.8.6](https://github.com/sigi-framework/sigi/compare/v2.8.5...v2.8.6) (2021-05-06)

**Note:** Version bump only for package @sigi/ssr

## [2.8.5](https://github.com/sigi-framework/sigi/compare/v2.8.4...v2.8.5) (2021-04-28)

### Bug Fixes

- **ssr:** race operator should only accept last value of SSR Modules ([44c3e1b](https://github.com/sigi-framework/sigi/commit/44c3e1b725d725bad6ca51c4d0b885e2cecb4f23))

## [2.8.2](https://github.com/sigi-framework/sigi/compare/v2.8.1...v2.8.2) (2021-03-29)

### Bug Fixes

- **ssr:** always resolve deferred promise to prevent floating Promise ([4493da0](https://github.com/sigi-framework/sigi/commit/4493da0bf7d899ddb008cf8da613a088a3f18808))

## [2.8.1](https://github.com/sigi-framework/sigi/compare/v2.8.0...v2.8.1) (2021-03-03)

### Bug Fixes

- **ssr:** emit stateToPersist after all Modules was finished ([92f1790](https://github.com/sigi-framework/sigi/commit/92f179090358675c4c9fcbc1ce532983eda177de))

# [2.8.0](https://github.com/sigi-framework/sigi/compare/v2.7.0...v2.8.0) (2021-02-22)

### Performance Improvements

- **ssr:** reduce closure creations ([5ede4ac](https://github.com/sigi-framework/sigi/commit/5ede4ac2c9b486ca8a9972283ba64a44533c9ff6))

# [2.7.0](https://github.com/sigi-framework/sigi/compare/v2.6.0...v2.7.0) (2021-02-07)

### Features

- **ssr:** pass config which contains providers in emitSSREffects function ([b32ef30](https://github.com/sigi-framework/sigi/commit/b32ef302f58b4902dfbdc85a639a22ce074691a4))

## [2.5.1](https://github.com/sigi-framework/sigi/compare/v2.5.0...v2.5.1) (2021-01-22)

### Bug Fixes

- **core:** setup store immediately after set default state ([d5d2631](https://github.com/sigi-framework/sigi/commit/d5d2631898645a6eb938f7cb8ff5bacac8a9efe6))

# [2.5.0](https://github.com/sigi-framework/sigi/compare/v2.4.5...v2.5.0) (2020-12-17)

**Note:** Version bump only for package @sigi/ssr

## [2.4.5](https://github.com/sigi-framework/sigi/compare/v2.4.4...v2.4.5) (2020-12-14)

### Bug Fixes

- **core:** epic do not follow rxjs control ([e27ab82](https://github.com/sigi-framework/sigi/commit/e27ab824d9b99846654087b840c8b2cccea9af6c))

## [2.4.4](https://github.com/sigi-framework/sigi/compare/v2.4.3...v2.4.4) (2020-11-27)

**Note:** Version bump only for package @sigi/ssr

## [2.4.3](https://github.com/sigi-framework/sigi/compare/v2.4.2...v2.4.3) (2020-11-22)

**Note:** Version bump only for package @sigi/ssr

## [2.4.2](https://github.com/sigi-framework/sigi/compare/v2.4.1...v2.4.2) (2020-10-15)

**Note:** Version bump only for package @sigi/ssr

## [2.4.1](https://github.com/sigi-framework/sigi/compare/v2.4.0...v2.4.1) (2020-08-27)

**Note:** Version bump only for package @sigi/ssr

# [2.4.0](https://github.com/sigi-framework/sigi/compare/v2.3.1...v2.4.0) (2020-07-28)

### Features

- **core:** get rid of symbols ([6d7a848](https://github.com/sigi-framework/sigi/commit/6d7a84801e4ce2a7be731ad13e26e56cd0970135))

## [2.3.1](https://github.com/sigi-framework/sigi/compare/v2.3.0...v2.3.1) (2020-07-09)

**Note:** Version bump only for package @sigi/ssr

# [2.3.0](https://github.com/sigi-framework/sigi/compare/v2.2.0...v2.3.0) (2020-07-05)

**Note:** Version bump only for package @sigi/ssr

# [2.2.0](https://github.com/sigi-framework/sigi/compare/v2.1.0...v2.2.0) (2020-06-28)

**Note:** Version bump only for package @sigi/ssr

# [2.1.0](https://github.com/sigi-framework/sigi/compare/v2.0.2...v2.1.0) (2020-06-02)

**Note:** Version bump only for package @sigi/ssr
