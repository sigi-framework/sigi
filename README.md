# [Sigi framework](https://sigi.how)

<p align="center"><a href="https://sigi.how" target="_blank" rel="noopener noreferrer"><img width="100" src="https://raw.githubusercontent.com/sigi-framework/documents/master/assets/android-chrome-512x512.png" alt="Sigi logo"></a></p>

<p align="center">
  <a href="https://github.com/sigi-framework/sigi/actions"><img src="https://github.com/sigi-framework/sigi/workflows/Test%20Commit/badge.svg" alt="Build Status"></a>
  <a href="https://codecov.io/gh/sigi-framework/sigi"><img src="https://codecov.io/gh/sigi-framework/sigi/branch/master/graph/badge.svg" alt="Coverage Status"></a>
  <a href="https://npmcharts.com/compare/@stringke/sigi-core?minimal=true"><img src="https://img.shields.io/npm/dm/@stringke/sigi-core.svg?sanitize=true" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/@stringke/sigi-core"><img src="https://img.shields.io/npm/v/@stringke/sigi-core.svg?sanitize=true" alt="Version"></a>
  <a href="https://github.com/sigi-framework/sigi/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@stringke/sigi-core.svg?sanitize=true" alt="License"></img></a>
</p>

Sigi is a effect management framework for complex frontend app.

- **Type safe**: Sigi provides **Type Safe** APIs which connect the gap between your `Component` and `Side Effect` codes in compile time.
- **Dependencies Injection**: Sigi contains a tiny dependency injection implementation. Which allow you easier to compose your `Modules` and `Services`. And it is also provide huge benefit when you want to write some tests.
- **Multi platforms support**: Sigi now support `React/React Native` and `Vue@2.x`, we will also provide support for `Flutter` with very similar APIs in very soon.

## Documentation

You can find the full documentation [on the website](https://sigi.how).

And you can also read higher level introduction article in Chinese [中文介绍](https://zhuanlan.zhihu.com/p/107132560)

## Ecosystem

| **Project**                             | **Status**                                                             | **Description**                                                                           |
| --------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [vue](./packages/vue)                   | ![](https://img.shields.io/npm/v/@stringke/sigi-vue.svg?sanitize=true)          | VueJS integration library                                                                 |
| [react](./packages/react)               | ![](https://img.shields.io/npm/v/@stringke/sigi-react.svg?sanitize=true)        | React Hooks APIs                                                                          |
| [react-router](./pacakges/react-router) | ![](https://img.shields.io/npm/v/@stringke/sigi-react-router.svg?sanitize=true) | React router integration                                                                  |
| [ssr](./pacakges/ssr)                   | ![](https://img.shields.io/npm/v/@stringke/sigi-ssr.svg?sanitize=true)          | Server side rendering support for `Vue/React`                                             |
| [devtool](./packages/devtool)           | ![](https://img.shields.io/npm/v/@stringke/sigi-devtool.svg?sanitize=true)      | Redux devtool integration                                                                 |
| [di](./packages/di)                     | ![](https://img.shields.io/npm/v/@stringke/sigi-di.svg?sanitize=true)           | Dependencies injection library which allow you compose your own class with `Sigi Modules` |
| [testing](./packages/testing)           | ![](https://img.shields.io/npm/v/@stringke/sigi-testing.svg?sanitize=true)      | Test helper library                                                                       |
