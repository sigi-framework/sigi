import { readdirSync, statSync } from 'fs'
import { join } from 'path'
import typescript from '@rollup/plugin-typescript'
import sourcemaps from 'rollup-plugin-sourcemaps'

const pkgs = readdirSync(join(__dirname, 'packages')).filter((dir) =>
  statSync(join(__dirname, 'packages', dir)).isDirectory(),
)

const external = ['rxjs', '@sigi/core', '@sigi/di', 'rxjs/operators', 'immer', 'react', 'tslib']

export default pkgs
  .map((dir) => ({
    input: `./packages/${dir}/esm/index.js`,
    external,
    plugins: [sourcemaps()],
    output: [
      {
        file: `./packages/${dir}/dist/index.cjs.js`,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: `./packages/${dir}/dist/index.esm.js`,
        format: 'esm',
        sourcemap: true,
      },
    ],
  }))
  .concat(
    pkgs.map((dir) => ({
      input: `./packages/${dir}/src/index.ts`,
      external,
      output: [
        {
          file: `./packages/${dir}/dist/index.next.js`,
          format: 'esm',
          sourcemap: true,
        },
      ],
      plugins: [typescript({ target: 'ES2018' }), sourcemaps()],
    })),
  )
