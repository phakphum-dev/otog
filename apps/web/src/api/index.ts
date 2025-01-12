import wretch from 'wretch'

import { environment, isServer } from '../env'

export const secure =
  !environment.OFFLINE_MODE && environment.NODE_ENV === 'production'

export const api = wretch(
  isServer ? environment.API_HOST_SSR : environment.API_HOST,
  {
    secure,
    mode: 'cors',
    credentials: 'include',
  }
)
