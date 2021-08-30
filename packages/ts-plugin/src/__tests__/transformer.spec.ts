import * as fs from 'fs'
import { resolve } from 'path'

import * as ts from 'typescript'

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
  print: (val, _print, indent) => {
    const obj = val as TransformBaseline
    return `
File: ${obj.filename}
TypeScript before transform:
${indent(obj.content)}
      ↓ ↓ ↓ ↓ ↓ ↓
TypeScript after transform:
${indent(obj.transformed).replace(/ {4}/g, '  ')}
`
  },
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
    import { EffectModule, Module, Effect } from '@stringke/sigi-core'
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
    expect(transpile).toThrow('Only support object literal parameter in Effect decorator')
  })

  it('should output hmr codes', () => {
    const { NODE_ENV } = process.env
    process.env.NODE_ENV = 'development'
    const code = `
    import { Module, Effect } from '@stringke/sigi-core'
    import { Request } from 'express'
    import { Observable } from 'rxjs'
    import { map } from 'rxjs/operators'
    
    interface AState {}

    @Module('MA')
    export class ModuleA extends EffectModule<AState> {
      @Effect()
      whatever(payload$: Observable<string>) {
        return payload$.pipe(
          map(() => this.createNoopAction())
        )
      }
    }
    `
    const printer = ts.createPrinter()
    const source = ts.createSourceFile('hmr', code, ts.ScriptTarget.ESNext, true)
    const output = ts.transform(source, [SigiTransformer])

    const [outputCode] = output.transformed
    const resultCode = printer.printFile(outputCode)
    expect(resultCode).toMatchSnapshot()
    process.env.NODE_ENV = NODE_ENV
  })

  it('should skip inject hmr codes if non module name', () => {
    const { NODE_ENV } = process.env
    process.env.NODE_ENV = 'development'
    const code = `
    import { Module, Effect } from '@stringke/sigi-core'
    import { Request } from 'express'
    import { Observable } from 'rxjs'
    import { map } from 'rxjs/operators'
    
    interface AState {}

    @Module()
    export class ModuleA extends EffectModule<AState> {
      @Effect()
      whatever(payload$: Observable<string>) {
        return payload$.pipe(
          map(() => this.createNoopAction())
        )
      }
    }
    `
    const printer = ts.createPrinter()
    const source = ts.createSourceFile('hmr', code, ts.ScriptTarget.ESNext, true)
    const output = ts.transform(source, [SigiTransformer])

    const [outputCode] = output.transformed
    const resultCode = printer.printFile(outputCode)
    expect(resultCode).toMatchSnapshot()
    process.env.NODE_ENV = NODE_ENV
  })
})
