import { readdirSync, statSync } from 'fs'
import { join } from 'path'
import sourcemaps from 'rollup-plugin-sourcemaps'

const pkgs = readdirSync(join(__dirname, 'packages')).filter((dir) =>
  statSync(join(__dirname, 'packages', dir)).isDirectory(),
)

const external = [
  'rxjs',
  '@sigi/core',
  '@sigi/di',
  '@sigi/react',
  '@sigi/ssr',
  'rxjs/operators',
  'immer',
  'react',
  'tslib',
  'serialize-javascript',
  'through',
  'html-tokenize',
  'multipipe',
  'typescript',
]

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
      input: `./packages/${dir}/next/index.js`,
      external,
      plugins: [sourcemaps()],
      output: [
        {
          file: `./packages/${dir}/dist/index.next.js`,
          format: 'esm',
          sourcemap: true,
        },
      ],
    })),
  )
