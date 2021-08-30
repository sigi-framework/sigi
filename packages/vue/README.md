# `@stringke/sigi-vue`

[Sigi documents](https://sigi.how)

## Install

```bash
yarn install @stringke/sigi-{vue,core,di}
```

## Usage

### `reactive` API

```ts
reactive(EffectModule, VueComponentOptions)
```

All the **states** and **dispatch props** in the `EffectModule` will be mixed into `VueComponentOptions`. And you can use them in `methods`, `LifeCycles` and `watch` handlers.
