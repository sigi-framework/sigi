import { Token, Provider, ValueProvider, Type } from './type'

export class InjectionProvider {
  private readonly providersMap = new Map<Token<unknown>, Provider<unknown>>()

  addProvider<T extends Provider<any>>(provider: T): T {
    this.providersMap.set((provider as ValueProvider<T>).provide ?? (provider as Type<T>), provider)
    return provider
  }

  findProviderByToken<T>(token: Token<T>): Provider<T> | null {
    if (!this.providersMap.has(token)) {
      return null
    }
    return this.providersMap.get(token)! as Provider<T>
  }
}
