import { EffectModule, ActionOfEffectModule, IStore } from '@stringke/sigi-core'
import { TestModule, Type } from '@stringke/sigi-di'

export class SigiTestModule extends TestModule {
  getTestingStub<M extends EffectModule<S>, S = M extends EffectModule<infer State> ? State : never>(
    EffectModuleConstructor: Type<M>,
  ): SigiTestStub<M, S> {
    const moduleInstance = this.getInstance(EffectModuleConstructor)
    const store = moduleInstance.store
    const actionsCreator: any = moduleInstance.getActions()
    const dispatcher = Object.keys(actionsCreator).reduce((acc, key) => {
      acc[key] = (payload: unknown) => {
        store.dispatch(actionsCreator[key](payload))
      }
      return acc
    }, Object.create(null))

    return new SigiTestStub(dispatcher, store)
  }
}

export class SigiTestStub<M extends EffectModule<S>, S = M extends EffectModule<infer State> ? State : never> {
  constructor(public readonly dispatcher: ActionOfEffectModule<M, S>, private readonly store: IStore<S>) {}

  getState() {
    return this.store.state
  }
}

export { Test, TestModule, AbstractTestModule } from '@stringke/sigi-di'
