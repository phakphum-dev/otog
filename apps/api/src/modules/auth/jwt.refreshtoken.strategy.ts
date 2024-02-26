import { ForbiddenException, Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { environment } from 'src/env'
import { UserService } from 'src/modules/user/user.service'

import { UserDTO } from '../user/dto/user.dto'
import { AuthService } from './auth.service'
import { JwtPayloadDTO } from './dto/auth.dto'

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refreshtoken'
) {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: environment.JWT_SECRET,
      passReqToCallback: true,
    })
  }

  async validate(req: Request, payload: JwtPayloadDTO): Promise<UserDTO> {
    const refreshTokenId = req.cookies['RID']
    if (!refreshTokenId) {
      throw new ForbiddenException('No refresh token')
    }
    if (!payload) {
      throw new ForbiddenException('No access token')
    }
    const { jti, id } = payload
    await this.authService.validateToken(refreshTokenId, jti!)
    const user = await this.userService.findOneById(id!)
    const userAuthDTO = new UserDTO(user)
    return userAuthDTO
  }
}
