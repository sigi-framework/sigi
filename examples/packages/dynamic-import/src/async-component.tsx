import React from 'react'
import { useModule } from '@sigi/react'

import { AsyncModule } from './async.module'

export function AsyncComponent() {
  const [{ list }, dispatcher] = useModule(AsyncModule)
  const loading = !list ? <div>loading</div> : null

  const title = list instanceof Error ? <h2>{list.message}</h2> : <h2>Async Component</h2>

  const listNodes = Array.isArray(list) ? list.map((value) => <li key={value}>{value}</li>) : null
  return (
    <div>
      {title}
      <button onClick={dispatcher.fetchList}>fetchList</button>
      <button onClick={dispatcher.cancel}>cancel</button>
      {loading}
      <ul>{listNodes}</ul>
    </div>
  )
}
