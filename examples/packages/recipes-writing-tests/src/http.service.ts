import { Injectable } from '@stringke/sigi-di'
import { Observable, timer, throwError } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class HttpClient {
  get(_url: string): Observable<string[]> {
    return Math.random() > 0.5
      ? throwError(new TypeError('Fail to fetch'))
      : timer(3000).pipe(map(() => ['mock1', 'mock2', 'mock3']))
  }
}
