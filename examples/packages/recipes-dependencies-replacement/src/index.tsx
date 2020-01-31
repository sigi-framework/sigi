import 'reflect-metadata'
import React from 'react'
import { render } from 'react-dom'
import { ClassProvider } from '@sigi/di'
import { useEffectModule, InjectionProvidersContext } from '@sigi/react'
import { HttpErrorClient } from './http-with-error.service'
import { HttpBetterClient } from './http-better.service'

import { AppModule } from './app.module'

const AppContainer = React.memo(({ appTitle }: { appTitle: string }) => {
  const [{ list }, dispatcher] = useEffectModule(AppModule)

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
