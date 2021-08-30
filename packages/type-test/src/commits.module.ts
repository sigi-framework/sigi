import { Module, EffectModule, Effect, ImmerReducer } from '@sigi-stringke/core'
import { Observable } from 'rxjs'
import { exhaustMap, map } from 'rxjs/operators'
import { Draft } from 'immer'

import { HttpService } from './http.service'

export interface CommitsStateProps {
  commits: any[]
  branches: string[]
}

@Module('Commits')
export class CommitsModule extends EffectModule<CommitsStateProps> {
  defaultState = {
    commits: [],
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
  fetchRepo(payload$: Observable<string>) {
    return payload$.pipe(
      exhaustMap((currentBranch) => {
        return this.httpClient
          .get<any[]>(`https://api.github.com/repos/vuejs/vue/commits?per_page=3&sha=${currentBranch}`)
          .pipe(map((response) => this.getActions().setRepos(response)))
      }),
    )
  }
}
