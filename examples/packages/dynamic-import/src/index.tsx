import 'reflect-metadata'
import 'antd/dist/antd.css'
import React, { useState, useCallback, useEffect } from 'react'
import { render } from 'react-dom'
import { useModule } from '@sigi/react'
import { initDevtool } from '@sigi/devtool'

import { AppModule } from './app.module'

function List() {
  const [{ list }, dispatcher] = useModule(AppModule)
  const loading = !list ? <div>loading</div> : null

  const title = list instanceof Error ? <h2>{list.message}</h2> : <h2>Hello CodeSandbox</h2>

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

function Async() {
  const [childComponent, setComponent] = useState(<div />)
  useEffect(() => {
    import('./async-component').then(({ AsyncComponent }) => {
      setComponent(<AsyncComponent />)
    })
  }, [])
  return childComponent
}

export type TabType = 'list' | 'async'

function App() {
  const [currentTab, setTab] = useState<TabType>('list')
  const getColor = useCallback(
    (tab: TabType) => {
      if (tab === currentTab) {
        return 'black'
      }
      return 'grey'
    },
    [currentTab],
  )

  const setCurrentTab = useCallback(
    (tabType: TabType) => () => {
      setTab(tabType)
    },
    [setTab],
  )

  const body = currentTab === 'list' ? <List /> : <Async />

  return (
    <div>
      <h1>
        <span onClick={setCurrentTab('list')} style={{ color: getColor('list') }}>
          list tab
        </span>{' '}
        |{' '}
        <span onClick={setCurrentTab('async')} style={{ color: getColor('async') }}>
          async tab
        </span>
      </h1>
      {body}
    </div>
  )
}

const rootElement = document.getElementById('app')
render(<App />, rootElement)

initDevtool()
