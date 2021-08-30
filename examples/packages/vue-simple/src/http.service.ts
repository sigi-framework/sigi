import { Injectable } from '@stringke/sigi-di'
import { Observable, Observer } from 'rxjs'

@Injectable()
export class HttpService {
  get<T>(url: string): Observable<T> {
    return new Observable((observer: Observer<T>) => {
      const controller = new AbortController()
      fetch(`${url}`, {
        method: 'GET',
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((res) => {
          observer.next(res)
          observer.complete()
        })
        .catch((e) => {
          observer.error(e)
        })

      return () => controller.abort()
    })
  }
}
