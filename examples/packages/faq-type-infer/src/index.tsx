import '@abraham/reflection'
import { initDevtool } from '@sigi/devtool'
import { useModule } from '@sigi/react'
import * as React from 'react'
import { render } from 'react-dom'

import { CountModule } from './app.module'

function App() {
  const [state, dispatcher] = useModule(CountModule)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const add = React.useCallback(() => {
    dispatcher.addLeastFive(parseInt(inputRef.current!.value, 10))
  }, [inputRef, dispatcher])

  return (
    <div>
      <h1>Hello CodeSandbox</h1>
      <h2>Count: {state.count}</h2>
      <input ref={inputRef} />
      <button onClick={add}>Add</button>
    </div>
  )
}

const rootElement = document.getElementById('root')
render(<App />, rootElement)

initDevtool()
