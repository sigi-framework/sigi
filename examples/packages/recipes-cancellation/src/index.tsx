import '@abraham/reflection'
import { initDevtool } from '@stringke/sigi-devtool'
import { useModule } from '@stringke/sigi-react'
import React from 'react'
import { render } from 'react-dom'

import { AppModule } from './app.module'

function App() {
  const [state, dispatcher] = useModule(AppModule)

  const loading = state.loading ? <div>loading</div> : null

  const list = (state.list ?? []).map((value) => <li key={value}>{value}</li>)
  return (
    <div>
      <h1>Hello CodeSandbox</h1>
      <button onClick={dispatcher.fetchList}>fetchList</button>
      <button onClick={dispatcher.cancel}>cancel</button>
      {loading}
      <ul>{list}</ul>
    </div>
  )
}

const rootElement = document.getElementById('app')
render(<App />, rootElement)

initDevtool()
