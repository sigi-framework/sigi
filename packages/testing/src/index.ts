import { TestModule, Type } from '@sigi/di'
import { EffectModule, ActionOfEffectModule, State } from '@sigi/core'

export class SigiTestModule extends TestModule {
  getAyanamiTestingStub<M extends EffectModule<S>, S = any>(ayanamiModule: Type<M>): SigiTestStub<M, S> {
    const moduleInstance = this.getInstance(ayanamiModule)
    const state = moduleInstance.createState()
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
  constructor(public readonly dispatcher: ActionOfEffectModule<M, S>, private readonly state: State<S>) {}

  getState() {
    return this.state.getState()
  }
}

export { Test, TestModule, AbstractTestModule } from '@sigi/di'
