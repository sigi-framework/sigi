import { ValueProvider } from '@sigi/di'
import { InjectionProvidersContext } from '@sigi/react'
import { History } from 'history'
import { memo, useEffect, useMemo } from 'react'
import { Subject } from 'rxjs'

import { HistoryProvide, Router$Provide, RouterChanged } from './browser.module'

export const SigiRouterProvider = memo<{ history: History; children: React.ReactNode }>(({ history, children }) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const router$ = useMemo(() => new Subject<RouterChanged>(), [history])
  const historyProvides: [ValueProvider<History>, ValueProvider<Subject<RouterChanged>>] = useMemo(() => {
    return [
      {
        provide: HistoryProvide.provide,
        useValue: history,
      },
      {
        provide: Router$Provide.provide,
        useValue: router$,
      },
    ]
  }, [history, router$])

  useEffect(() => {
    return history.listen((update) => {
      router$.next(update)
    })
  }, [history, router$])
  return <InjectionProvidersContext providers={historyProvides}>{children}</InjectionProvidersContext>
})
