import { Controller, Res, UseGuards } from '@nestjs/common'
import {
  TsRestHandler,
  nestControllerContract,
  tsRestHandler,
} from '@ts-rest/nest'
import type { Response } from 'express'
import { AccessState } from 'src/core/constants'
import { OfflineAccess } from 'src/core/decorators/offline-mode.decorator'
import { User } from 'src/core/decorators/user.decorator'
import { environment } from 'src/env'

import { authRouter } from '@otog/contract'

import { Public } from '../../core/decorators/isPublic.decorator'
import { JwtRefreshTokenAuthGuard } from '../../core/guards/jwt-refreshtoken-auth.guard'
import { LocalAuthGuard } from '../../core/guards/local-auth.guard'
import { UserDTO } from '../user/dto/user.dto'
import { AuthService } from './auth.service'
import { AuthResDTO } from './dto/auth.dto'

const c = nestControllerContract(authRouter)

@Public()
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @TsRestHandler(c.register)
  register() {
    return tsRestHandler(c.register, async ({ body }) => {
      const result = await this.authService.signup(body)
      return { status: 201, body: { message: result.message } }
    })
  }

  @UseGuards(LocalAuthGuard)
  @OfflineAccess(AccessState.Public)
  @TsRestHandler(c.login)
  async login(@User() userData: UserDTO, @Res() res: Response) {
    const { token, user } = await this.authService.login(userData)
    const authResDTO = new AuthResDTO()
    authResDTO.user = user
    authResDTO.accessToken = token.accessToken
    return res
      .cookie('RID', token.refreshToken.id, {
        httpOnly: true,
        domain: environment.COOKIE_DOMAIN,
        expires: token.refreshToken.expiryDate ?? undefined,
      })
      .json(authResDTO)
  }

  @UseGuards(JwtRefreshTokenAuthGuard)
  @OfflineAccess(AccessState.Public)
  @TsRestHandler(c.refreshToken)
  async refreshToken(@User() userData: UserDTO, @Res() res: Response) {
    const { token, user } = await this.authService.reAccessToken(userData)
    const authResDTO = new AuthResDTO()
    authResDTO.user = user
    authResDTO.accessToken = token.accessToken
    return res
      .cookie('RID', token.refreshToken.id, {
        httpOnly: true,
        domain: environment.COOKIE_DOMAIN,
        expires: token.refreshToken.expiryDate ?? undefined,
      })
      .json(authResDTO)
  }
}
