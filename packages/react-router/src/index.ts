import { NEVER, Observable } from 'rxjs'

import { HistoryProvide, Router$Provide, RouterChanged } from './router.module'

import type { Provider } from '@sigi/di'
import type { History } from 'history'

export function createHistoryProviders(history: History): [Provider<History>, Provider<Observable<RouterChanged>>] {
  return [
    {
      provide: HistoryProvide.provide,
      useValue: history,
    },
    {
      provide: Router$Provide.provide,
      useFactory: () => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('RouterModule.router$ will never emit values nor complete in SSR scenario')
        }
        return NEVER
      },
    },
  ]
}

export { RouterModule } from './router.module'
export * from './router-provider'
