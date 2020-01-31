import { Injectable } from '@sigi/di'
import { Observable, throwError } from 'rxjs'

@Injectable()
export class HttpErrorClient {
  get(_url: string): Observable<string[]> {
    return throwError(new TypeError('Fail to fetch'))
  }
}
