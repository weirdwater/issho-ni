import { StreamingAppState, EntryScreenState } from './streamingApp'
import { isNone, isLoading, loaded, error, Action, none } from '../../shared/fun';
import { sessionApi } from '../shared/sessionApi';

export const joinSession = (s0: EntryScreenState): Promise<Action<StreamingAppState>> => new Promise(res => {
  if (isNone(s0.credentials) || isNone(s0.credentials.v.sessionToken) || !isLoading(s0.session) || isNone(s0.sessionToken)) {
    return res(s1 => s1)
  }

  sessionApi(s0.credentials.v)
    .joinSession(s0.sessionToken.v)
    .then(session => res(s1 => isLoading(s1.session) ? {...s1, session: loaded(session) } : s1))
    .catch(e => res(s1 => isLoading(s1.session) ? {
        ...s1,
        screen: 'entry',
        session: error(e.message),
        sessionToken: s1.screen === 'entry' ? s1.sessionToken : none(),
      } : s1))
})
