import { EffectModule, ActionOfEffectModule, Store } from '@sigi/core'
import { TestModule, Type } from '@sigi/di'

export class SigiTestModule extends TestModule {
  getTestingStub<M extends EffectModule<S>, S = any>(EffectModuleConstructor: Type<M>): SigiTestStub<M, S> {
    const moduleInstance = this.getInstance(EffectModuleConstructor)
    const state = moduleInstance.createStore()
    const actionsCreator: any = moduleInstance.getActions()
    const dispatcher = Object.keys(actionsCreator).reduce((acc, key) => {
      acc[key] = (payload: unknown) => {
        state.dispatch(actionsCreator[key](payload))
      }
      return acc
    }, Object.create(null))

    return new SigiTestStub(dispatcher, state)
  }
}

export class SigiTestStub<M extends EffectModule<S>, S = any> {
  constructor(public readonly dispatcher: ActionOfEffectModule<M, S>, private readonly state: Store<S>) {}

  getState() {
    return this.state.getState()
  }
}

export { Test, TestModule, AbstractTestModule } from '@sigi/di'
