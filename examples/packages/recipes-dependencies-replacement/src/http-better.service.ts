import { Injectable } from '@sigi-stringke/di'
import { Observable, timer } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class HttpBetterClient {
  get(_url: string): Observable<string[]> {
    return timer(3000).pipe(map(() => ['mock1', 'mock2', 'mock3']))
  }
}
