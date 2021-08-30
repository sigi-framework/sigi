import { replaceLogger } from '@stringke/sigi-core'
import { Action } from '@stringke/sigi-types'
import { noop } from 'rxjs'

interface GlobalState {
  [modelName: string]: Record<string, unknown>
}

let devtool: { send: (...args: any[]) => void; init: (...args: any[]) => void } = {
  send: noop,
  init: noop,
}

const FakeReduxDevTools = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connect: () => devtool,
}

const ReduxDevTools =
  (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) ?? FakeReduxDevTools

const STATE: GlobalState = {}

const logStateAction = (action: Action<any>) => {
  const namespace = action.store.name
  const _action = {
    type: `${namespace}/${action.type}`,
    params: filterParams(action.payload),
  }

  STATE[namespace] = action.store.state
  devtool.send(_action, STATE)
}

export const initDevtool = () => {
  if (process.env.NODE_ENV === 'development') {
    devtool = ReduxDevTools.connect({
      name: `Sigi`,
    })
    devtool.init(STATE)
    replaceLogger(logStateAction)
  }
}

function filterParams(params: any): any {
  if (params && typeof params === 'object' && typeof Event !== 'undefined') {
    if (params instanceof Event) {
      return `<<Event:${params.type}>>`
    } else if (params.nativeEvent instanceof Event) {
      return `<<SyntheticEvent:${params.nativeEvent.type}>>`
    }
  }

  return params
}
