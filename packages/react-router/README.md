# `@sigi/react-router`

> React router intergration for sigi framework

## Usage

```ts
import { RouterModule } from '@sigi/react-router'

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
