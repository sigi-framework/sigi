import { ValueProvider } from '@sigi/di'
import { InjectionProvidersContext } from '@sigi/react'
import { History, Location, Action } from 'history'
import React, { memo, useEffect, useMemo } from 'react'
import { Subject } from 'rxjs'

import { HistoryProvide, Router$Provide, RouterChanged } from './router.module'

export const SigiRouterProvider = memo<{ history: History; children: React.ReactChild }>(({ history, children }) => {
  const historyProvide: ValueProvider<History> = useMemo(
    () => ({
      provide: HistoryProvide.provide,
      useValue: history,
    }),
    [history],
  )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const router$ = useMemo(() => new Subject<RouterChanged>(), [history])
  const router$Provide: ValueProvider<Subject<RouterChanged>> = useMemo(
    () => ({
      provide: Router$Provide.provide,
      useValue: router$,
    }),
    [router$],
  )

  useEffect(() => {
    const teardown = history.listen((location: Location, action: Action) => {
      router$.next({ location, action })
    })
    return () => {
      teardown()
      router$.unsubscribe()
    }
  }, [history, router$])
  return <InjectionProvidersContext providers={[historyProvide, router$Provide]}>{children}</InjectionProvidersContext>
})
