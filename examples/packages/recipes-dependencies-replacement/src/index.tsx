import '@abraham/reflection'
import { ClassProvider } from '@sigi/di'
import { useModule, InjectionProvidersContext } from '@sigi/react'
import React from 'react'
import { render } from 'react-dom'

import { AppModule } from './app.module'
import { HttpBetterClient } from './http-better.service'
import { HttpErrorClient } from './http-with-error.service'

const AppContainer = React.memo(({ appTitle }: { appTitle: string }) => {
  const [{ list }, dispatcher] = useModule(AppModule)

  const loading = !list ? <div>loading</div> : null

  const title = list instanceof Error ? <h1>{list.message}</h1> : <h1>{appTitle}</h1>

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
})

function App() {
  const betterHttpProvider: ClassProvider<HttpErrorClient> = {
    provide: HttpErrorClient,
    useClass: HttpBetterClient,
  }
  return (
    <>
      <AppContainer appTitle="Always error" />
      <InjectionProvidersContext providers={[betterHttpProvider]}>
        <AppContainer appTitle="Better http client" />
      </InjectionProvidersContext>
    </>
  )
}

const rootElement = document.getElementById('app')
render(<App />, rootElement)
