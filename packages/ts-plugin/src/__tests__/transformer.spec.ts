import * as ts from 'typescript'
import * as fs from 'fs'
import { resolve } from 'path'

import { SigiTransformer } from '../index'

interface TransformBaseline {
  type: 'transform-baseline'
  filename: string
  content: string
  source: string
  transformed: string
}

expect.addSnapshotSerializer({
  test: (obj: any) => obj && obj.type === 'transform-baseline',
  print: (obj: TransformBaseline, _print: (object: any) => string, indent: (str: string) => string) =>
    `
File: ${obj.filename}
TypeScript before transform:
${indent(obj.content)}
      ↓ ↓ ↓ ↓ ↓ ↓
TypeScript after transform:
${indent(obj.transformed).replace(/ {4}/g, '  ')}
`,
})

describe('ts-plugin specs', () => {
  const fixtureDir = fs.readdirSync(resolve(__dirname, 'fixtures'))
  fixtureDir.forEach((v) => {
    it(`should transform ${v}`, () => {
      const printer = ts.createPrinter()
      const sourceCode = fs.readFileSync(resolve(__dirname, 'fixtures', v), 'utf-8')

      const source = ts.createSourceFile(v, sourceCode, ts.ScriptTarget.ESNext, true)

      const result = ts.transform(source, [SigiTransformer])

      const [transformed] = result.transformed

      const resultCode = printer.printFile(transformed)

      expect({
        transformed: resultCode,
        source: printer.printFile(source),
        filename: `${v}.tsx`,
        type: 'transform-baseline',
        content: sourceCode,
      }).toMatchSnapshot()

      result.dispose()
    })
  })

  it('should throw if Effect option is dynamic', () => {
    const code = `
    import { EffectModule, Module, Effect } from '@sigi/core'
    import { Request } from 'express'
    import { Observable } from 'rxjs'
    import { map } from 'rxjs/operators'
    
    interface AState {}
    
    const effectOption = {
      payloadGetter: (req: Request) => {
        return require('md5')('hello')
      }
    }

    @EffectModule('A')
    export class ModuleA extends EffectModule<AState> {
      @Effect(effectOption)
      whatever(payload$: Observable<string>) {
        return payload$.pipe(
          map(() => this.createNoopAction())
        )
      }
    }
    `

    const source = ts.createSourceFile('dynamic-option', code, ts.ScriptTarget.ESNext, true)
    const transpile = () => ts.transform(source, [SigiTransformer])
    expect(transpile).toThrow('Only support object literal parameter in SSREffect')
  })
})
