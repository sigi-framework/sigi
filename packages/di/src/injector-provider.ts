import { InjectionToken, Provider, Token } from './type'

export class ReflectiveProvider<T> {
  name: string

  token: Token<T>

  constructor(public readonly provider: Provider<T>) {
    if (typeof provider === 'function') {
      this.name = provider.name
      this.token = provider
    } else {
      this.name = provider.provide instanceof InjectionToken ? provider.provide.toString() : provider.provide.name
      this.token = provider.provide
    }
  }

  toString() {
    return this.name
  }
}
