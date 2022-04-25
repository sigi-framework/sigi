import '@abraham/reflection'
import { initDevtool } from '@sigi/devtool'
import { ClassProvider } from '@sigi/di'
import { useModule, InjectionProvidersContext } from '@sigi/react'
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

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

initDevtool()

const rootElement = document.getElementById('app')!
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
