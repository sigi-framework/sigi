# `@sigi-stringke/react-router`

> React router integration for sigi framework

## Usage

```ts
import { RouterModule } from '@sigi-stringke/react-router'

@Module('App')
export class AppModule extends EffectModule<{}> {
  constructor(private readonly router: RouterModule) {
    super()
  }

  @Effect()
  getUser(payload$: Observable<void>) {
    return payload$.pipe(
      exhaustMap(() => {
        service.getUser().pipe(mergeMap((res) => of(this.getActions().getUserResponse(res), this.router.push('/home'))))
      }),
    )
  }
}
```
