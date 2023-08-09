import { readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sourcemaps from 'rollup-plugin-sourcemaps'

const __dirname = join(fileURLToPath(import.meta.url), '..')
const require = createRequire(import.meta.url)

const pkgs = readdirSync(join(__dirname, '..', 'packages')).filter(
  (dir) =>
    statSync(join(__dirname, '..', 'packages', dir)).isDirectory() &&
    !require(join(__dirname, '..', 'packages', dir, 'package.json')).private,
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

export default pkgs.map((dir) => ({
  input: `./packages/${dir}/next/index.js`,
  external,
  plugins: [sourcemaps()],
  output: [
    {
      file: `./packages/${dir}/dist/index.js`,
      format: 'cjs',
      sourcemap: true,
    },
  ],
}))
