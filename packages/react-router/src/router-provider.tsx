import React, { memo, useEffect } from 'react'
import { History } from 'history'
import { useEffectModuleDispatchers } from '@sigi/react'

import { RouterModule } from './router.module'

export const SigiRouterProvider = memo<{ history: History; children: React.ReactChild }>((props) => {
  const dispatcher = useEffectModuleDispatchers(RouterModule)
  useEffect(() => {
    dispatcher.setHistory(props.history)
    return () => {
      dispatcher.stopListen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.history])
  return <>{props.children}</>
})
