import 'reflect-metadata'

import { Injectable } from '@stringke/sigi-di'
import React from 'react'
import { create } from 'react-test-renderer'

import { InjectionProvidersContext, useInstance } from '../injectable-context'

function render(component: React.ReactElement) {
  return create(<InjectionProvidersContext>{component}</InjectionProvidersContext>)
}

function inject() {
  @Injectable()
  class Service {}

  @Injectable()
  class Module {
    constructor(public readonly service: Service) {}
  }

  return { Module, Service }
}

describe('Context specs', () => {
  it('should getInstance', () => {
    const { Module, Service } = inject()
    const TestComponent = () => {
      const instance = useInstance(Module)
      expect(instance.service instanceof Service).toBeTruthy()
      return <div />
    }

    render(<TestComponent />)
  })

  it('should override provider', () => {
    const { Module, Service } = inject()
    const mockService = {
      provide: Service,
      useValue: 1,
    }
    const TestComponent = () => {
      const instance = useInstance(Module)
      expect(instance.service).toBe(mockService.useValue)
      return <div />
    }

    render(
      <InjectionProvidersContext providers={[mockService]}>
        <TestComponent />
      </InjectionProvidersContext>,
    )
  })

  it('Multi providers context', () => {
    const { Module, Service } = inject()
    const mockService1 = {
      provide: Service,
      useValue: 1,
    }
    const mockService2 = {
      provide: Service,
      useValue: 2,
    }
    const TestComponent1 = () => {
      const instance = useInstance(Module)
      expect(instance.service).toBe(mockService1.useValue)
      return <div />
    }

    const TestComponent2 = () => {
      const instance = useInstance(Module)
      expect(mockService2.useValue).toBe(instance.service)
      return <div />
    }

    render(
      <>
        <InjectionProvidersContext providers={[mockService1]}>
          <TestComponent1 />
        </InjectionProvidersContext>
        <InjectionProvidersContext providers={[mockService2]}>
          <TestComponent2 />
        </InjectionProvidersContext>
      </>,
    )
  })

  it('Nested providers', () => {
    const { Module, Service } = inject()
    const mockService1 = {
      provide: Service,
      useValue: 1,
    }
    const mockService2 = {
      provide: Service,
      useValue: 2,
    }
    // eslint-disable-next-line sonarjs/no-identical-functions
    const TestComponent1 = () => {
      const instance = useInstance(Module)
      expect(instance.service).toBe(mockService1.useValue)
      return <div />
    }

    const TestComponent2 = () => {
      const instance = useInstance(Module)
      expect(instance.service).toBe(mockService2.useValue)
      return <div />
    }

    render(
      <>
        <InjectionProvidersContext providers={[mockService1]}>
          <TestComponent1 />
          <InjectionProvidersContext providers={[mockService2]}>
            <TestComponent2 />
            <InjectionProvidersContext providers={[mockService1]}>
              <TestComponent1 />
            </InjectionProvidersContext>
          </InjectionProvidersContext>
        </InjectionProvidersContext>
      </>,
    )
  })
})
