# `@sigi/ts-plugin`

## Usage

```ts
// webpack.config.js
const { SigiTransformer } = require('@sigi/ts-plugin');

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.(jsx|tsx|js|ts)$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          getCustomTransformers: () => ({
            before: [ SigiTransformer ]
          }),
          compilerOptions: {
            module: 'esnext'
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  // ...
}
```
