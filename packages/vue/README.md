# `@sigi/vue`

[Sigi documents](https://sigi.how)

## Install

```bash
yarn install @sigi/{vue,core,di}
```

## Usage

### `reactive` API

```ts
reactive(EffectModule, VueComponetOptions)
```

All the **states** and **distpach props** in the `EffectModule` will be mixed into `VueComponentOptions`. And you can use them in `methods`, `Lifecycles` and `watch` handlers.
