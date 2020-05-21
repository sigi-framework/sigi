import { Module, EffectModule, Effect, ImmerReducer } from '@sigi/core'
import { Draft } from 'immer'
import { Observable } from 'rxjs'
import { map, combineLatest, switchMap, distinctUntilKeyChanged } from 'rxjs/operators'

import { HttpService } from './http.service'

export interface CommitsStateProps {
  commits: any[]
  branches: string[]
  currentBranch: string
}

@Module('Commits')
export class CommitsModule extends EffectModule<CommitsStateProps> {
  defaultState = {
    commits: [],
    currentBranch: 'master',
    branches: ['master', 'dev'],
  }

  constructor(private readonly httpClient: HttpService) {
    super()
  }

  @ImmerReducer()
  setRepos(state: Draft<CommitsStateProps>, payload: any[]) {
    state.commits = payload
  }

  @Effect()
  observeRepos(payload$: Observable<void>) {
    return payload$.pipe(
      combineLatest(this.state$.pipe(distinctUntilKeyChanged('currentBranch'))),
      switchMap(([_, state]) => {
        return this.httpClient
          .get<any[]>(`https://api.github.com/repos/vuejs/vue/commits?per_page=3&sha=${state.currentBranch}`)
          .pipe(map((response) => this.getActions().setRepos(response)))
      }),
    )
  }
}
