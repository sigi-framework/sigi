/**
 * @jest-environment jsdom
 */
/* eslint-disable sonarjs/no-identical-functions */
import '@abraham/reflection'

import { GLOBAL_KEY_SYMBOL, RETRY_KEY_SYMBOL } from '@sigi/core'
import { Injector } from '@sigi/di'
import { useEffect } from 'react'
import { render, act } from '@testing-library/react'

import { SSRContext, useModule } from '../index.browser'

import { CountModule, ServiceModule, Service } from './__fixtures__'

const ComponentWithSelector = () => {
  const [state, actions] = useModule(CountModule, {
    selector: (s) => ({
      count: s.count + 1,
    }),
  })
  useEffect(() => {
    actions.setName('new name')
  }, [actions])

  return <span>{state.count}</span>
}

const MODULES = [CountModule, ServiceModule, Service]

describe('client ssr hydration', () => {
  it('should restore state from global with selector', () => {
    // @ts-expect-error
    global[GLOBAL_KEY_SYMBOL] = {
      CountModule: {
        count: 10,
        name: '',
      },
    }
    const testRenderer = render(
      <SSRContext value={new Injector().addProviders(MODULES)}>
        <ComponentWithSelector />
      </SSRContext>,
    )
    expect(testRenderer.baseElement.querySelector('span')?.textContent).toBe('11')
    // @ts-expect-error
    delete global[GLOBAL_KEY_SYMBOL]
    testRenderer.unmount()
  })

  it('should not restore state from global if state is null', () => {
    // @ts-expect-error
    global[GLOBAL_KEY_SYMBOL] = {
      OtherModule: {
        count: 10,
        name: '',
      },
    }
    const injector = new Injector().addProviders(MODULES)
    const testRenderer = render(
      <SSRContext value={injector}>
        <ComponentWithSelector />
      </SSRContext>,
    )
    act(() => {
      testRenderer.rerender(
        <SSRContext value={injector}>
          <ComponentWithSelector />
        </SSRContext>,
      )
    })

    expect(testRenderer.baseElement.querySelector('span')?.textContent).toBe('1')

    // @ts-expect-error
    delete global[GLOBAL_KEY_SYMBOL]
    testRenderer.unmount()
  })

  it('should restore and skip first action on client side', () => {
    const Component = () => {
      const [state, actions] = useModule(CountModule)
      useEffect(() => {
        actions.getCount()
      }, [actions])

      return <span>{state.count}</span>
    }

    // @ts-expect-error
    global[GLOBAL_KEY_SYMBOL] = {
      CountModule: {
        count: 2,
        name: '',
      },
    }

    const injector = new Injector().addProviders(MODULES)

    const testRenderer = render(
      <SSRContext value={injector}>
        <Component />
      </SSRContext>,
    )

    act(() => {
      testRenderer.rerender(
        <SSRContext value={injector}>
          <Component />
        </SSRContext>,
      )
    })
    expect(testRenderer.baseElement.querySelector('span')?.textContent).toBe('2')

    // @ts-expect-error
    delete global[GLOBAL_KEY_SYMBOL]
    testRenderer.unmount()
  })

  it('should retry action if needed on client side', () => {
    const Component = () => {
      const [state, dispatcher] = useModule(ServiceModule)
      useEffect(() => {
        dispatcher.setNameWithFailure(void 0)
      }, [dispatcher])

      return <span>{state.name}</span>
    }

    // @ts-expect-error
    global[RETRY_KEY_SYMBOL] = {
      ServiceModule: ['setNameWithFailure'],
    }

    const injector = new Injector().addProviders(MODULES)

    const testRenderer = render(
      <SSRContext value={injector}>
        <Component />
      </SSRContext>,
    )

    // eslint-disable-next-line sonarjs/no-identical-functions
    act(() => {
      testRenderer.rerender(
        <SSRContext value={injector}>
          <Component />
        </SSRContext>,
      )
    })

    expect(testRenderer.baseElement.querySelector('span')?.textContent).toBe('From retry')

    // @ts-expect-error
    delete global[GLOBAL_KEY_SYMBOL]
    testRenderer.unmount()
  })
})
