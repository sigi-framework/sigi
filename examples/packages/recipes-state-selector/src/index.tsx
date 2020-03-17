import 'reflect-metadata'
import React from 'react'
import { render } from 'react-dom'
import { useModule, useModuleState } from '@sigi/react'
import { initDevtool } from '@sigi/devtool'

import { AppModule } from './app.module'

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
    <>
      <List />
      <Loading />
    </>
  )
}

const rootElement = document.getElementById('app')
render(<App />, rootElement)

initDevtool()
