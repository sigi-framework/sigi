import 'reflect-metadata'

import { EffectModule, Module, ImmerReducer, Effect } from '@sigi/core'
import { Test, SigiTestModule, SigiTestStub } from '@sigi/testing'
import { Observable, timer } from 'rxjs'
import { flatMap, map, switchMap } from 'rxjs/operators'
import { Draft } from 'immer'
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
  let vm = new Vue(reactive(VueTestingModule, {}))
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

    expect(vm['foo']).toBe('1')

    vm['setFoo']()

    expect(vm['foo']).toBe('2')
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
