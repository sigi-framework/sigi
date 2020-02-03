# `@sigi/di`

[Sigi documents](https://sigi.how)

> Dependencies injection library

## Usage

### Basic

```ts
import { Injectable, InjectableFactory } from '@sigi/di'

@Injectable()
class Engine { }

@Injectable()
class Car {
  constructor(public engine: Engine) { }
}

const car = InjectableFactory.getInstance(Car)
expect(car).to.be.instanceof(Car)
expect(car.engine).to.be.instanceof(Engine)
```

### Value Provider

```ts
import { Inject, InjectionToken, Injectable, InjectableFactory, ValueProvider } from '@sigi/di'
import Axios from 'axios'

const token = new InjectionToken<Axios>('Axios client')

const provider: ValueProvider = {
  provide: token,
  useValue: Axios,
}

@Injectable({
  providers: [provider],
})
class HttpClient {
  constructor(@Inject(token) public axios: Axios) { }
}

const client = InjectableFactory.getInstance(HttpClient)
expect(client).to.be.instanceof(HttpClient)
expect(client.axios).to.equal(Axios)
```

### Factory Provider

```ts
import { Inject, InjectionToken, Injectable, InjectableFactory, FactoryProvider } from '@sigi/di'
import Axios from 'axios'

const token = new InjectionToken<Axios>('Axios client')
const baseURL = 'https://leetcode-cn.com/api'
const provider: FactoryProvider = {
  provide: token,
  useFactory: () => {
    return Axios.create({
      baseURL,
    })
  },
}

@Injectable({
  providers: [provider],
})
class HttpClient {
  constructor(@Inject(token) public axios: Axios) { }
}

const client = InjectableFactory.getInstance(HttpClient)
expect(client).to.be.instanceof(HttpClient)
expect(client.axios).to.equal(Axios) // baseURL of client.axios is 'https://leetcode-cn.com/api'
```

## Testing

### Override Provider by configureModule

```ts
function whatever() {
  return true
}

function replacement() {
  return false
}

const token = new InjectionToken<typeof whatever>('replacable')

const provider: ValueProvider = {
  useValue: replacement,
  provide: token,
}

@Injectable({
  providers: [provider],
})
class Service {
  constructor(@Inject(token) public dep: typeof whatever) {}
}

const testModule = Test.createTestingModule({ providers: [{ provide: token, useValue: replacement }] }).compile()
const service = testModule.getInstance(Service)
t.true(service instanceof Service)
t.is(service.dep, replacement)
t.false(service.dep())
```

### Override Provider by overrideProvider method

```ts
function whatever() {
  return true
}

function replacement() {
  return false
}

const token = new InjectionToken<typeof whatever>('replacabel')

const provider: ValueProvider = {
  useValue: replacement,
  provide: token,
}

@Injectable({
  providers: [provider],
})
class Service {
  constructor(@Inject(token) public dep: typeof whatever) {}
}

const testModule = Test.createTestingModule()
  .overrideProvider(token)
  .useValue(replacement)
  .compile()
const service = testModule.getInstance(Service)
t.true(service instanceof Service)
t.is(service.dep, replacement)
t.false(service.dep())
```
