import '@abraham/reflection'
import { initDevtool } from '@sigi/devtool'
import { useModule, useModuleState } from '@sigi/react'
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AppModule } from './app.module'

initDevtool()

function Loading() {
  console.info('Loading render')
  const loading = useModuleState(AppModule, {
    selector: (state) => state.loading,
  })
  if (loading) {
    return <h1 style={{ color: 'hotpink' }}>I am loading</h1>
  }
  return null
}

function List() {
  console.info('List render')
  const [list, dispatcher] = useModule(AppModule, {
    selector: (state) => state.list,
  })

  const listNodes = list.map((value) => <li key={value}>{value}</li>)
  return (
    <div>
      <h1>Hello CodeSandbox</h1>
      <button onClick={dispatcher.fetchList}>fetchList</button>
      <button onClick={dispatcher.cancel}>cancel</button>
      <ul>{listNodes}</ul>
    </div>
  )
}

function App() {
  return (
    <StrictMode>
      <List />
      <Loading />
    </StrictMode>
  )
}

const rootElement = document.getElementById('app')
createRoot(rootElement!).render(<App />)

if (module.hot) {
  module.hot.accept()
}
