import { ValueProvider } from '@stringke/sigi-di'
import { InjectionProvidersContext } from '@stringke/sigi-react'
import { History, Location, Action } from 'history'
import React, { memo, useEffect, useMemo } from 'react'
import { Subject } from 'rxjs'

import { HistoryProvide, Router$Provide, RouterChanged } from './browser.module'

export const SigiRouterProvider = memo<{ history: History; children: React.ReactChild }>(({ history, children }) => {
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
    return history.listen((location: Location, action: Action) => {
      router$.next({ location, action })
    })
  }, [history, router$])
  return <InjectionProvidersContext providers={historyProvides}>{children}</InjectionProvidersContext>
})
