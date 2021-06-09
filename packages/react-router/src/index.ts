import { Module, EffectModule } from '@sigi/core'

@Module('@@Router')
export class RouterModule extends EffectModule<null> {
  defaultState = null

  push() {
    return this.noop()
  }

  go() {
    return this.noop()
  }

  goBack() {
    return this.noop()
  }
  goForward() {
    return this.noop()
  }

  replace() {
    return this.noop()
  }
}
