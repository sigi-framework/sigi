export class InjectionToken<T> {
  // @internal
  readonly _phantom?: T

  constructor(private readonly desc: string) {}

  toString() {
    return this.desc
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export interface Type<T = Record<string, unknown>> extends Function {
  new (...args: any[]): T
}

export interface ValueProvider<T> {
  /**
   * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
   */
  provide: Token<T>
  /**
   * The value to inject.
   */
  useValue: T
}

export interface FactoryProvider<T, Deps extends Array<Token<any>> = any[]> {
  /**
   * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
   */
  provide: Token<T>
  /**
   * A function to invoke to create a value for this `token`. The function is invoked with
   * resolved values of `token`s in the `deps` field.
   */
  useFactory: (...args: Deps) => T
  /**
   * A list of `token`s which need to be resolved by the injector. The list of values is then
   * used as arguments to the `useFactory` function.
   */
  deps?: Deps
}

export interface ClassProvider<T> {
  /**
   * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
   */
  provide: Token<T>
  /**
   * Class to instantiate for the `token`.
   */
  useClass: Type<T>
}

export interface ExistingProvider<T> {
  /**
   * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
   */
  provide: Token<T>
  /**
   * Existing `token` to return. (equivalent to `injector.get(useExisting)`)
   */
  useExisting: Token<T>
}

export type Token<T = unknown> = Type<T> | InjectionToken<T>

export type Provider<T = unknown> =
  | Type<T>
  | ValueProvider<T>
  | ClassProvider<T>
  | ExistingProvider<T>
  | FactoryProvider<T>
