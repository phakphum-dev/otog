import { SetMetadata } from '@nestjs/common'

import { AccessState, OFFLINE_KEY } from '../constants'

export const OfflineAccess = (roles: AccessState) =>
  SetMetadata(OFFLINE_KEY, roles)
