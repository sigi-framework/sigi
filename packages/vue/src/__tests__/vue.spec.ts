import 'reflect-metadata'

import { EffectModule, Module, ImmerReducer, Effect } from '@sigi/core'
import { Test, SigiTestModule, SigiTestStub } from '@sigi/testing'
import { Draft } from 'immer'
import { Observable, timer } from 'rxjs'
import { flatMap, map, switchMap } from 'rxjs/operators'
import * as Sinon from 'sinon'
import Vue from 'vue'

import { reactive } from '../index'

interface VueTestingState {
  count: number
  name: string
}

@Module('VueTestingModule')
class VueTestingModule extends EffectModule<VueTestingState> {
  defaultState = { count: 0, name: '' }

  @ImmerReducer()
  setCount(state: Draft<VueTestingState>, count: number) {
    state.count = count
  }

  @ImmerReducer()
  setName(state: Draft<VueTestingState>, name: string) {
    state.name = name
  }

  @Effect()
  getCount(payload$: Observable<void>) {
    return payload$.pipe(flatMap(() => timer(20).pipe(map(() => this.getActions().setCount(1)))))
  }

  @Effect()
  asyncSetName(payload$: Observable<string>) {
    return payload$.pipe(switchMap((name) => timer(20).pipe(map(() => this.getActions().setName(name)))))
  }
}

describe('VueJS reative binding', () => {
  const options = reactive(VueTestingModule, {})
  let vm = new Vue(options)
  let testingStub: SigiTestStub<VueTestingModule, VueTestingState>
  let timer: Sinon.SinonFakeTimers

  beforeEach(() => {
    const testingModule = Test.createTestingModule({
      TestModule: SigiTestModule,
    }).compile()

    vm = new Vue(reactive(VueTestingModule, {}))
    testingStub = testingModule.getTestingStub(VueTestingModule)
    timer = Sinon.useFakeTimers()
  })

  afterEach(() => {
    timer.restore()
  })

  it('should create vue component options', () => {
    expect(vm).toBeInstanceOf(Vue)
  })

  it('should call reducer', () => {
    const count = 1
    vm.setCount(count)
    expect(testingStub.getState().count).toBe(count)
  })

  it('should be able to call reducer', () => {
    const count = 1
    vm.setCount(count)
    expect(testingStub.getState().count).toBe(count)
  })

  it('should be able to call effect', () => {
    const name = 'VueJS'
    vm.asyncSetName(name)
    timer.runAll()
    expect(testingStub.getState().name).toBe(name)
  })

  it('state should map to vue data', () => {
    vm.getCount()
    timer.runAll()
    expect(vm.count).toBe(1)
  })

  it('should stop observe state change after destroy', async () => {
    vm.$destroy()
    await vm.$nextTick()
    const count = 1000
    vm.setCount(count)
    expect(vm.count).not.toBe(count)
  })

  it('should be able to merge state to data', () => {
    const reactiveOptions = reactive(VueTestingModule, {
      data() {
        return {
          foo: '1',
        }
      },

      methods: {
        setFoo() {
          this.foo = '2'
        },
      },
    })
    const vm = new Vue(reactiveOptions)

    expect(vm.foo).toBe('1')

    vm.setFoo()

    expect(vm.foo).toBe('2')
  })

  it('should be able to syncToSigi', () => {
    const newName = 'fake new name'
    const reactiveOptions = reactive(VueTestingModule, {
      data() {
        return {
          foo: 1,
        }
      },

      syncToSigi: ['name'],

      render(h) {
        return h('div', [h('span', this.name)])
      },
    })

    const vm = new Vue(reactiveOptions)
    vm.name = newName
    vm.$options.beforeUpdate![0].call(vm)
    expect(testingStub.getState().name).toBe(newName)
  })

  it('should merge original beforeUpdate lifecycle', () => {
    const spy = Sinon.spy()
    const reactiveOptions = reactive(VueTestingModule, {
      syncToSigi: ['name'],
      beforeUpdate: spy,
    })

    const vm = new Vue(reactiveOptions)
    vm.$options.beforeUpdate![0].call(vm)
    expect(spy.callCount).toBe(1)
  })

  it('should warn if property which syncToSigi not existed', () => {
    const spy = Sinon.spy(console, 'warn')
    const reactiveOptions = reactive(VueTestingModule, {
      syncToSigi: ['name-n' as any],
    })

    const vm = new Vue(reactiveOptions)

    const { NODE_ENV } = process.env

    process.env.NODE_ENV = 'development'

    vm.$options.beforeUpdate![0].call(vm)
    expect(spy.callCount).toBe(1)

    spy.restore()
    process.env.NODE_ENV = NODE_ENV
  })

  it('should ignore non-function data property', () => {
    const reactiveOptions = reactive(VueTestingModule, {
      data: {
        foo: '1',
      } as any,
    })
    const vm = new Vue(reactiveOptions)

    expect(vm['foo']).toBeUndefined()
  })

  it('should call original beforeDestory', async () => {
    const spy = Sinon.spy()
    const reactiveOptions = reactive(VueTestingModule, {
      beforeDestroy: spy,
    })
    const vm = new Vue(reactiveOptions)

    vm.$destroy()
    await vm.$nextTick()

    expect(spy.calledOnce).toBeTruthy()
  })
})
