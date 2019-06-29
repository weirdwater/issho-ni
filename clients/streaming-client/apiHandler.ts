import { StreamingAppState } from './streamingApp'
import { isNone, isLoading, loaded, error, Action } from '../../shared/fun';
import { sessionApi } from '../shared/sessionApi';

export const joinSession = (s0: StreamingAppState): Promise<Action<StreamingAppState>> => new Promise(res => {
  if (isNone(s0.credentials) || isNone(s0.credentials.v.sessionToken) || !isLoading(s0.session) || isNone(s0.sessionToken)) {
    return res(s1 => s1)
  }

  sessionApi(s0.credentials.v)
    .joinSession(s0.sessionToken.v)
    .then(session => res(s1 => isLoading(s1.session) ? {...s1, session: loaded(session) } : s1))
    .catch(e => res(s1 => isLoading(s1.session) ? {...s1, session: error(e.message) } : s1))
})
