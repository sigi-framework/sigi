import { EffectModule, Effect } from '@sigi/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { RouterModule } from '../router.module'

interface TestState {}

class TestModule extends EffectModule<TestState> {
  defaultState = {}

  constructor(private readonly routerModule: RouterModule) {
    super()
  }

  @Effect()
  login(payload$: Observable<void>) {
    return payload$.pipe(map(() => this.routerModule.push('/home')))
  }
}
